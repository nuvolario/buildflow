/**
 * BuildFlow - Safety Controller
 * Gestione sicurezza sul lavoro: checklist, incidenti, DPI
 */

const pool = require('../config/database')

// ============================================================
// CHECKLIST TEMPLATES
// ============================================================

/**
 * GET /api/safety/templates
 * Lista template checklist disponibili
 */
async function getTemplates(req, res) {
  try {
    const { category_id, tipo, livello_rischio } = req.query

    let query = `
      SELECT t.*, c.nome as categoria_nome, c.livello_rischio as categoria_rischio
      FROM safety_checklist_templates t
      LEFT JOIN safety_activity_categories c ON t.category_id = c.id
      WHERE (t.company_id IS NULL OR t.company_id = ?)
        AND t.attivo = 1
    `
    const params = [req.companyId]

    if (category_id) {
      query += ' AND t.category_id = ?'
      params.push(category_id)
    }

    if (tipo) {
      query += ' AND t.tipo = ?'
      params.push(tipo)
    }

    query += ' ORDER BY t.livello_rischio_minimo DESC, t.nome'

    const [templates] = await pool.execute(query, params)

    res.json({ success: true, data: templates })

  } catch (error) {
    console.error('Get templates error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero template' })
  }
}

/**
 * GET /api/safety/templates/:id
 * Dettaglio template con items
 */
async function getTemplateById(req, res) {
  try {
    const [templates] = await pool.execute(
      `SELECT t.*, c.nome as categoria_nome
       FROM safety_checklist_templates t
       LEFT JOIN safety_activity_categories c ON t.category_id = c.id
       WHERE t.id = ? AND (t.company_id IS NULL OR t.company_id = ?)`,
      [req.params.id, req.companyId]
    )

    if (templates.length === 0) {
      return res.status(404).json({ success: false, error: 'Template non trovato' })
    }

    // Recupera items
    const [items] = await pool.execute(
      `SELECT * FROM safety_checklist_template_items
       WHERE template_id = ? AND attivo = 1
       ORDER BY ordine`,
      [req.params.id]
    )

    res.json({
      success: true,
      data: {
        ...templates[0],
        items
      }
    })

  } catch (error) {
    console.error('Get template error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero template' })
  }
}

// ============================================================
// CHECKLIST COMPILATE
// ============================================================

/**
 * POST /api/safety/checklists
 * Avvia nuova checklist per un task/cantiere
 */
async function createChecklist(req, res) {
  try {
    const {
      cantiere_id,
      task_id,
      template_id,
      membro_id,
      meteo,
      temperatura_percepita
    } = req.body

    if (!cantiere_id || !template_id || !membro_id) {
      return res.status(400).json({
        success: false,
        error: 'Cantiere, template e membro sono obbligatori'
      })
    }

    // Verifica template esiste
    const [templates] = await pool.execute(
      'SELECT * FROM safety_checklist_templates WHERE id = ?',
      [template_id]
    )

    if (templates.length === 0) {
      return res.status(404).json({ success: false, error: 'Template non trovato' })
    }

    // Recupera items del template
    const [items] = await pool.execute(
      `SELECT * FROM safety_checklist_template_items
       WHERE template_id = ? AND attivo = 1
       ORDER BY ordine`,
      [template_id]
    )

    // Crea checklist
    const [result] = await pool.execute(
      `INSERT INTO safety_checklists
       (company_id, cantiere_id, task_id, template_id, compilato_da, data, ora_inizio,
        controlli_totali, meteo, temperatura_percepita)
       VALUES (?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?, ?, ?)`,
      [
        req.companyId, cantiere_id, task_id || null, template_id, membro_id,
        items.length, meteo || 'sereno', temperatura_percepita || 'normale'
      ]
    )

    const checklistId = result.insertId

    // Crea risposte vuote per ogni item
    for (const item of items) {
      await pool.execute(
        `INSERT INTO safety_checklist_responses
         (checklist_id, template_item_id, testo_controllo, categoria)
         VALUES (?, ?, ?, ?)`,
        [checklistId, item.id, item.testo, item.categoria]
      )
    }

    res.status(201).json({
      success: true,
      data: {
        id: checklistId,
        items_count: items.length
      }
    })

  } catch (error) {
    console.error('Create checklist error:', error)
    res.status(500).json({ success: false, error: 'Errore creazione checklist' })
  }
}

/**
 * GET /api/safety/checklists/:id
 * Dettaglio checklist con risposte
 */
async function getChecklistById(req, res) {
  try {
    const [checklists] = await pool.execute(
      `SELECT c.*, m.nome as membro_nome, m.cognome as membro_cognome,
              t.nome as template_nome, cant.nome as cantiere_nome
       FROM safety_checklists c
       JOIN membri m ON c.compilato_da = m.id
       LEFT JOIN safety_checklist_templates t ON c.template_id = t.id
       JOIN cantieri cant ON c.cantiere_id = cant.id
       WHERE c.id = ? AND c.company_id = ?`,
      [req.params.id, req.companyId]
    )

    if (checklists.length === 0) {
      return res.status(404).json({ success: false, error: 'Checklist non trovata' })
    }

    // Recupera risposte
    const [responses] = await pool.execute(
      `SELECT r.*, ti.obbligatorio, ti.bloccante, ti.richiede_evidenza
       FROM safety_checklist_responses r
       LEFT JOIN safety_checklist_template_items ti ON r.template_item_id = ti.id
       WHERE r.checklist_id = ?
       ORDER BY ti.ordine`,
      [req.params.id]
    )

    res.json({
      success: true,
      data: {
        ...checklists[0],
        responses
      }
    })

  } catch (error) {
    console.error('Get checklist error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero checklist' })
  }
}

/**
 * PATCH /api/safety/checklists/:id/responses/:responseId
 * Aggiorna singola risposta della checklist
 */
async function updateResponse(req, res) {
  try {
    const { esito, nota, evidenza_url, azione_correttiva } = req.body

    if (!esito || !['ok', 'non_ok', 'na'].includes(esito)) {
      return res.status(400).json({ success: false, error: 'Esito non valido' })
    }

    await pool.execute(
      `UPDATE safety_checklist_responses
       SET esito = ?, nota = ?, evidenza_url = ?, azione_correttiva = ?, risposto_at = NOW()
       WHERE id = ? AND checklist_id = ?`,
      [esito, nota || null, evidenza_url || null, azione_correttiva || null,
       req.params.responseId, req.params.id]
    )

    // Aggiorna contatori checklist
    await updateChecklistCounters(req.params.id)

    res.json({ success: true, message: 'Risposta aggiornata' })

  } catch (error) {
    console.error('Update response error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiornamento risposta' })
  }
}

/**
 * POST /api/safety/checklists/:id/complete
 * Completa e firma la checklist
 */
async function completeChecklist(req, res) {
  try {
    const { dichiarazione_accettata } = req.body

    // Verifica che tutte le risposte obbligatorie siano state date
    const [pending] = await pool.execute(
      `SELECT COUNT(*) as count FROM safety_checklist_responses r
       JOIN safety_checklist_template_items ti ON r.template_item_id = ti.id
       WHERE r.checklist_id = ? AND ti.obbligatorio = 1 AND r.esito = 'pending'`,
      [req.params.id]
    )

    if (pending[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: `Ci sono ancora ${pending[0].count} controlli obbligatori da completare`
      })
    }

    // Verifica controlli bloccanti
    const [bloccanti] = await pool.execute(
      `SELECT COUNT(*) as count FROM safety_checklist_responses r
       JOIN safety_checklist_template_items ti ON r.template_item_id = ti.id
       WHERE r.checklist_id = ? AND ti.bloccante = 1 AND r.esito = 'non_ok'`,
      [req.params.id]
    )

    const lavoro_autorizzato = bloccanti[0].count === 0

    // Aggiorna checklist
    await pool.execute(
      `UPDATE safety_checklists
       SET stato = ?,
           tutti_controlli_ok = ?,
           lavoro_autorizzato = ?,
           firma_lavoratore = 1,
           firma_lavoratore_at = NOW(),
           dichiarazione_accettata = ?,
           ora_fine = CURTIME()
       WHERE id = ? AND company_id = ?`,
      [
        lavoro_autorizzato ? 'completata' : 'non_conforme',
        bloccanti[0].count === 0 ? 1 : 0,
        lavoro_autorizzato ? 1 : 0,
        dichiarazione_accettata ? 1 : 0,
        req.params.id, req.companyId
      ]
    )

    // Se c'e un task associato, aggiorna flag sicurezza
    const [checklist] = await pool.execute(
      'SELECT task_id, compilato_da FROM safety_checklists WHERE id = ?',
      [req.params.id]
    )

    if (checklist[0].task_id && lavoro_autorizzato) {
      await pool.execute(
        `UPDATE tasks
         SET sicurezza_verificata = 1,
             sicurezza_verificata_da = ?,
             sicurezza_verificata_at = NOW()
         WHERE id = ?`,
        [checklist[0].compilato_da, checklist[0].task_id]
      )
    }

    // Log audit
    await logAudit(req, 'safety.checklist_completed', 'safety', req.params.id, {
      lavoro_autorizzato,
      controlli_falliti: bloccanti[0].count
    })

    res.json({
      success: true,
      data: {
        lavoro_autorizzato,
        controlli_bloccanti_falliti: bloccanti[0].count,
        message: lavoro_autorizzato
          ? 'Checklist completata. Lavoro autorizzato.'
          : 'ATTENZIONE: Lavoro NON autorizzato. Controlli bloccanti non superati.'
      }
    })

  } catch (error) {
    console.error('Complete checklist error:', error)
    res.status(500).json({ success: false, error: 'Errore completamento checklist' })
  }
}

// Helper per aggiornare contatori
async function updateChecklistCounters(checklistId) {
  await pool.execute(
    `UPDATE safety_checklists c
     SET
       controlli_superati = (SELECT COUNT(*) FROM safety_checklist_responses WHERE checklist_id = c.id AND esito = 'ok'),
       controlli_falliti = (SELECT COUNT(*) FROM safety_checklist_responses WHERE checklist_id = c.id AND esito = 'non_ok'),
       controlli_na = (SELECT COUNT(*) FROM safety_checklist_responses WHERE checklist_id = c.id AND esito = 'na')
     WHERE c.id = ?`,
    [checklistId]
  )
}

// ============================================================
// INCIDENTI
// ============================================================

/**
 * POST /api/safety/incidents
 * Segnala nuovo incidente o near-miss
 */
async function createIncident(req, res) {
  try {
    const {
      cantiere_id, task_id, tipo, gravita,
      data_evento, ora_evento, luogo_esatto,
      coinvolti, descrizione, dinamica, cause_probabili,
      testimoni, interventi_immediati,
      soccorsi_chiamati, autorita_avvisate
    } = req.body

    if (!cantiere_id || !tipo || !gravita || !data_evento || !descrizione) {
      return res.status(400).json({
        success: false,
        error: 'Cantiere, tipo, gravita, data e descrizione sono obbligatori'
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO safety_incidents
       (company_id, cantiere_id, task_id, tipo, gravita,
        data_evento, ora_evento, luogo_esatto,
        coinvolti, descrizione, dinamica, cause_probabili,
        testimoni, interventi_immediati,
        soccorsi_chiamati, autorita_avvisate, segnalato_da)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.companyId, cantiere_id, task_id || null, tipo, gravita,
        data_evento, ora_evento || null, luogo_esatto || null,
        JSON.stringify(coinvolti || []), descrizione, dinamica || null, cause_probabili || null,
        JSON.stringify(testimoni || []), interventi_immediati || null,
        soccorsi_chiamati ? 1 : 0, autorita_avvisate ? 1 : 0, req.userId
      ]
    )

    // Log audit con severita critica
    await logAudit(req, `safety.${tipo}_reported`, 'safety', result.insertId, {
      gravita,
      cantiere_id
    }, gravita === 'mortale' || gravita === 'molto_grave' ? 'critical' : 'warning')

    res.status(201).json({
      success: true,
      data: { id: result.insertId }
    })

  } catch (error) {
    console.error('Create incident error:', error)
    res.status(500).json({ success: false, error: 'Errore segnalazione incidente' })
  }
}

/**
 * GET /api/safety/incidents
 * Lista incidenti
 */
async function getIncidents(req, res) {
  try {
    const { cantiere_id, tipo, gravita, stato, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT i.*, c.nome as cantiere_nome,
             u.nome as segnalato_da_nome, u.cognome as segnalato_da_cognome
      FROM safety_incidents i
      JOIN cantieri c ON i.cantiere_id = c.id
      JOIN users u ON i.segnalato_da = u.id
      WHERE i.company_id = ?
    `
    const params = [req.companyId]

    if (cantiere_id) {
      query += ' AND i.cantiere_id = ?'
      params.push(cantiere_id)
    }

    if (tipo) {
      query += ' AND i.tipo = ?'
      params.push(tipo)
    }

    if (gravita) {
      query += ' AND i.gravita = ?'
      params.push(gravita)
    }

    if (stato) {
      query += ' AND i.stato = ?'
      params.push(stato)
    }

    query += ' ORDER BY i.data_evento DESC, i.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [incidents] = await pool.execute(query, params)

    res.json({ success: true, data: incidents })

  } catch (error) {
    console.error('Get incidents error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero incidenti' })
  }
}

// ============================================================
// CATEGORIE E DPI
// ============================================================

/**
 * GET /api/safety/categories
 * Lista categorie attivita
 */
async function getCategories(req, res) {
  try {
    const [categories] = await pool.execute(
      `SELECT * FROM safety_activity_categories WHERE attivo = 1 ORDER BY ordine`
    )

    res.json({ success: true, data: categories })

  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero categorie' })
  }
}

/**
 * GET /api/safety/dpi
 * Lista DPI
 */
async function getDpi(req, res) {
  try {
    const [dpi] = await pool.execute(
      `SELECT * FROM safety_dpi WHERE attivo = 1 ORDER BY ordine`
    )

    res.json({ success: true, data: dpi })

  } catch (error) {
    console.error('Get DPI error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero DPI' })
  }
}

// Helper per logging audit
async function logAudit(req, evento, categoria, entitaId, dati, severita = 'info') {
  try {
    await pool.execute(
      `INSERT INTO audit_log
       (company_id, user_id, cantiere_id, evento, categoria, severita, entita_tipo, entita_id, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.companyId,
        req.userId,
        dati?.cantiere_id || null,
        evento,
        categoria,
        severita,
        'safety_checklist',
        entitaId,
        JSON.stringify(dati),
        req.ip,
        req.get('user-agent')?.substring(0, 500)
      ]
    )
  } catch (err) {
    console.error('Audit log error:', err)
  }
}

module.exports = {
  getTemplates,
  getTemplateById,
  createChecklist,
  getChecklistById,
  updateResponse,
  completeChecklist,
  createIncident,
  getIncidents,
  getCategories,
  getDpi
}
