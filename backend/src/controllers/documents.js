/**
 * BuildFlow - Documents Controller
 * Gestione documenti aziendali con scadenze
 */

const pool = require('../config/database')

/**
 * GET /api/documents/types
 * Lista tipi documento disponibili
 */
async function getDocumentTypes(req, res) {
  try {
    const { applicabile_a } = req.query

    let query = 'SELECT * FROM document_types WHERE 1=1'
    const params = []

    if (applicabile_a) {
      query += ' AND (applicabile_a = ? OR applicabile_a = ?)'
      params.push(applicabile_a, 'all')
    }

    query += ' ORDER BY obbligatorio DESC, nome'

    const [types] = await pool.execute(query, params)

    res.json({ success: true, data: types })

  } catch (error) {
    console.error('Get document types error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero tipi documento' })
  }
}

/**
 * GET /api/documents
 * Lista documenti aziendali
 */
async function getDocuments(req, res) {
  try {
    const { membro_id, cantiere_id, stato, scadenza_entro_giorni } = req.query

    let query = `
      SELECT d.*, dt.nome as tipo_nome, dt.obbligatorio, dt.ha_scadenza,
             m.nome as membro_nome, m.cognome as membro_cognome,
             c.nome as cantiere_nome
      FROM company_documents d
      JOIN document_types dt ON d.document_type_id = dt.id
      LEFT JOIN membri m ON d.membro_id = m.id
      LEFT JOIN cantieri c ON d.cantiere_id = c.id
      WHERE d.company_id = ?
    `
    const params = [req.companyId]

    if (membro_id) {
      query += ' AND d.membro_id = ?'
      params.push(membro_id)
    }

    if (cantiere_id) {
      query += ' AND d.cantiere_id = ?'
      params.push(cantiere_id)
    }

    if (stato) {
      query += ' AND d.stato = ?'
      params.push(stato)
    }

    if (scadenza_entro_giorni) {
      query += ' AND d.data_scadenza IS NOT NULL AND d.data_scadenza <= DATE_ADD(CURDATE(), INTERVAL ? DAY)'
      params.push(parseInt(scadenza_entro_giorni))
    }

    query += ' ORDER BY d.data_scadenza ASC, dt.obbligatorio DESC'

    const [documents] = await pool.execute(query, params)

    res.json({ success: true, data: documents })

  } catch (error) {
    console.error('Get documents error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero documenti' })
  }
}

/**
 * POST /api/documents
 * Carica nuovo documento
 */
async function createDocument(req, res) {
  try {
    const {
      document_type_id, membro_id, cantiere_id,
      nome_file, file_url, file_size, mime_type,
      data_emissione, data_scadenza,
      numero_documento, ente_emittente, note
    } = req.body

    if (!document_type_id || !nome_file || !file_url) {
      return res.status(400).json({
        success: false,
        error: 'Tipo documento, nome file e URL sono obbligatori'
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO company_documents
       (company_id, document_type_id, membro_id, cantiere_id,
        nome_file, file_url, file_size, mime_type,
        data_emissione, data_scadenza,
        numero_documento, ente_emittente, note, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.companyId, document_type_id, membro_id || null, cantiere_id || null,
        nome_file, file_url, file_size || null, mime_type || null,
        data_emissione || null, data_scadenza || null,
        numero_documento || null, ente_emittente || null, note || null,
        req.userId
      ]
    )

    // Log verifica
    await pool.execute(
      `INSERT INTO document_verifications (document_id, azione, stato_nuovo, user_id)
       VALUES (?, 'uploaded', 'pending', ?)`,
      [result.insertId, req.userId]
    )

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    })

  } catch (error) {
    console.error('Create document error:', error)
    res.status(500).json({ success: false, error: 'Errore caricamento documento' })
  }
}

/**
 * PATCH /api/documents/:id/verify
 * Approva o rifiuta documento
 */
async function verifyDocument(req, res) {
  try {
    const { stato, note_verifica } = req.body

    if (!stato || !['approved', 'rejected'].includes(stato)) {
      return res.status(400).json({ success: false, error: 'Stato non valido' })
    }

    // Recupera stato precedente
    const [docs] = await pool.execute(
      'SELECT stato FROM company_documents WHERE id = ? AND company_id = ?',
      [req.params.id, req.companyId]
    )

    if (docs.length === 0) {
      return res.status(404).json({ success: false, error: 'Documento non trovato' })
    }

    const statoPrecedente = docs[0].stato

    // Aggiorna documento
    await pool.execute(
      `UPDATE company_documents
       SET stato = ?, verificato_da = ?, verificato_at = NOW(), note_verifica = ?
       WHERE id = ? AND company_id = ?`,
      [stato, req.userId, note_verifica || null, req.params.id, req.companyId]
    )

    // Log verifica
    await pool.execute(
      `INSERT INTO document_verifications
       (document_id, azione, stato_precedente, stato_nuovo, note, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.params.id, stato, statoPrecedente, stato, note_verifica, req.userId]
    )

    res.json({ success: true, message: `Documento ${stato === 'approved' ? 'approvato' : 'rifiutato'}` })

  } catch (error) {
    console.error('Verify document error:', error)
    res.status(500).json({ success: false, error: 'Errore verifica documento' })
  }
}

/**
 * GET /api/documents/expiring
 * Documenti in scadenza
 */
async function getExpiringDocuments(req, res) {
  try {
    const giorni = parseInt(req.query.giorni) || 30

    const [documents] = await pool.execute(
      `SELECT d.*, dt.nome as tipo_nome, dt.giorni_preavviso_scadenza,
              m.nome as membro_nome, m.cognome as membro_cognome,
              DATEDIFF(d.data_scadenza, CURDATE()) as giorni_alla_scadenza
       FROM company_documents d
       JOIN document_types dt ON d.document_type_id = dt.id
       LEFT JOIN membri m ON d.membro_id = m.id
       WHERE d.company_id = ?
         AND d.stato = 'approved'
         AND d.data_scadenza IS NOT NULL
         AND d.data_scadenza <= DATE_ADD(CURDATE(), INTERVAL ? DAY)
       ORDER BY d.data_scadenza ASC`,
      [req.companyId, giorni]
    )

    res.json({ success: true, data: documents })

  } catch (error) {
    console.error('Get expiring documents error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero documenti in scadenza' })
  }
}

/**
 * GET /api/documents/compliance/:membroId
 * Verifica compliance documentale di un membro
 */
async function checkMemberCompliance(req, res) {
  try {
    // Documenti obbligatori per membri
    const [required] = await pool.execute(
      `SELECT dt.* FROM document_types dt
       WHERE dt.applicabile_a IN ('membro', 'all') AND dt.obbligatorio = 1`
    )

    // Documenti validi del membro
    const [memberDocs] = await pool.execute(
      `SELECT d.document_type_id FROM company_documents d
       WHERE d.company_id = ? AND d.membro_id = ?
         AND d.stato = 'approved'
         AND (d.data_scadenza IS NULL OR d.data_scadenza > CURDATE())`,
      [req.companyId, req.params.membroId]
    )

    const memberDocTypes = new Set(memberDocs.map(d => d.document_type_id))

    const compliance = required.map(doc => ({
      tipo_id: doc.id,
      tipo_nome: doc.nome,
      obbligatorio: true,
      presente: memberDocTypes.has(doc.id),
      valido: memberDocTypes.has(doc.id)
    }))

    const isCompliant = compliance.every(c => c.valido)

    res.json({
      success: true,
      data: {
        compliant: isCompliant,
        documenti_mancanti: compliance.filter(c => !c.valido).length,
        dettaglio: compliance
      }
    })

  } catch (error) {
    console.error('Check compliance error:', error)
    res.status(500).json({ success: false, error: 'Errore verifica compliance' })
  }
}

module.exports = {
  getDocumentTypes,
  getDocuments,
  createDocument,
  verifyDocument,
  getExpiringDocuments,
  checkMemberCompliance
}
