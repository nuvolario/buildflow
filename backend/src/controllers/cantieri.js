/**
 * BuildFlow - Cantieri Controller
 */

const pool = require('../config/database')

/**
 * GET /api/cantieri
 */
async function getAll(req, res) {
  try {
    const { stato, search, page = 1, limit = 20 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM tasks t WHERE t.cantiere_id = c.id) as tasks_count,
             (SELECT COUNT(*) FROM tasks t WHERE t.cantiere_id = c.id AND t.stato = 'completed') as tasks_completed
      FROM cantieri c
      WHERE c.company_id = ?
    `
    const params = [req.companyId]

    if (stato) {
      query += ' AND c.stato = ?'
      params.push(stato)
    }

    if (search) {
      query += ' AND (c.nome LIKE ? OR c.codice LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY c.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [cantieri] = await pool.execute(query, params)

    // Count totale
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM cantieri WHERE company_id = ?',
      [req.companyId]
    )

    res.json({
      success: true,
      data: cantieri,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult[0].total,
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    })

  } catch (error) {
    console.error('Get cantieri error:', error)
    res.status(500).json({ success: false, error: 'Errore nel recupero cantieri' })
  }
}

/**
 * POST /api/cantieri
 */
async function create(req, res) {
  try {
    const {
      codice, nome, descrizione, stato,
      data_inizio_prevista, data_fine_prevista,
      indirizzo, citta, cap, provincia,
      budget_previsto, cliente_nome, cliente_telefono, cliente_email
    } = req.body

    if (!codice || !nome) {
      return res.status(400).json({
        success: false,
        error: 'Codice e nome sono obbligatori'
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO cantieri
       (company_id, codice, nome, descrizione, stato, data_inizio_prevista, data_fine_prevista,
        indirizzo, citta, cap, provincia, budget_previsto, cliente_nome, cliente_telefono, cliente_email, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.companyId, codice, nome, descrizione || null, stato || 'pianificato',
        data_inizio_prevista || null, data_fine_prevista || null,
        indirizzo || null, citta || null, cap || null, provincia || null,
        budget_previsto || null, cliente_nome || null, cliente_telefono || null, cliente_email || null,
        req.userId
      ]
    )

    res.status(201).json({
      success: true,
      data: { id: result.insertId, codice, nome }
    })

  } catch (error) {
    console.error('Create cantiere error:', error)
    res.status(500).json({ success: false, error: 'Errore nella creazione cantiere' })
  }
}

/**
 * GET /api/cantieri/:id
 */
async function getById(req, res) {
  try {
    const [cantieri] = await pool.execute(
      `SELECT c.* FROM cantieri c WHERE c.id = ? AND c.company_id = ?`,
      [req.params.id, req.companyId]
    )

    if (cantieri.length === 0) {
      return res.status(404).json({ success: false, error: 'Cantiere non trovato' })
    }

    res.json({ success: true, data: cantieri[0] })

  } catch (error) {
    console.error('Get cantiere error:', error)
    res.status(500).json({ success: false, error: 'Errore nel recupero cantiere' })
  }
}

/**
 * PUT /api/cantieri/:id
 */
async function update(req, res) {
  try {
    const {
      codice, nome, descrizione, stato,
      data_inizio_prevista, data_fine_prevista, data_inizio_effettiva, data_fine_effettiva,
      indirizzo, citta, cap, provincia,
      budget_previsto, budget_attuale,
      cliente_nome, cliente_telefono, cliente_email, note
    } = req.body

    const [result] = await pool.execute(
      `UPDATE cantieri SET
        codice = COALESCE(?, codice),
        nome = COALESCE(?, nome),
        descrizione = ?,
        stato = COALESCE(?, stato),
        data_inizio_prevista = ?,
        data_fine_prevista = ?,
        data_inizio_effettiva = ?,
        data_fine_effettiva = ?,
        indirizzo = ?,
        citta = ?,
        cap = ?,
        provincia = ?,
        budget_previsto = ?,
        budget_attuale = ?,
        cliente_nome = ?,
        cliente_telefono = ?,
        cliente_email = ?,
        note = ?,
        updated_at = NOW()
       WHERE id = ? AND company_id = ?`,
      [
        codice, nome, descrizione,
        stato, data_inizio_prevista, data_fine_prevista, data_inizio_effettiva, data_fine_effettiva,
        indirizzo, citta, cap, provincia,
        budget_previsto, budget_attuale,
        cliente_nome, cliente_telefono, cliente_email, note,
        req.params.id, req.companyId
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Cantiere non trovato' })
    }

    res.json({ success: true, message: 'Cantiere aggiornato' })

  } catch (error) {
    console.error('Update cantiere error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiornamento cantiere' })
  }
}

/**
 * DELETE /api/cantieri/:id
 */
async function deleteById(req, res) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM cantieri WHERE id = ? AND company_id = ?',
      [req.params.id, req.companyId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Cantiere non trovato' })
    }

    res.json({ success: true, message: 'Cantiere eliminato' })

  } catch (error) {
    console.error('Delete cantiere error:', error)
    res.status(500).json({ success: false, error: 'Errore eliminazione cantiere' })
  }
}

/**
 * GET /api/cantieri/:id/milestones
 */
async function getMilestones(req, res) {
  try {
    const [milestones] = await pool.execute(
      `SELECT * FROM cantiere_milestones WHERE cantiere_id = ? ORDER BY ordine`,
      [req.params.id]
    )

    res.json({ success: true, data: milestones })

  } catch (error) {
    console.error('Get milestones error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero milestones' })
  }
}

/**
 * POST /api/cantieri/:id/milestones
 */
async function createMilestone(req, res) {
  try {
    const { nome, descrizione, ordine, data_prevista } = req.body

    const [result] = await pool.execute(
      `INSERT INTO cantiere_milestones (cantiere_id, nome, descrizione, ordine, data_prevista)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, nome, descrizione || null, ordine || 0, data_prevista || null]
    )

    res.status(201).json({ success: true, data: { id: result.insertId } })

  } catch (error) {
    console.error('Create milestone error:', error)
    res.status(500).json({ success: false, error: 'Errore creazione milestone' })
  }
}

/**
 * GET /api/cantieri/:id/team
 */
async function getTeam(req, res) {
  try {
    const [squadre] = await pool.execute(
      `SELECT cs.*, s.nome as squadra_nome, s.colore
       FROM cantiere_squadre cs
       JOIN squadre s ON cs.squadra_id = s.id
       WHERE cs.cantiere_id = ?`,
      [req.params.id]
    )

    res.json({ success: true, data: squadre })

  } catch (error) {
    console.error('Get team error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero team' })
  }
}

/**
 * POST /api/cantieri/:id/team
 */
async function assignTeam(req, res) {
  try {
    const { squadra_id, data_inizio, data_fine, note } = req.body

    const [result] = await pool.execute(
      `INSERT INTO cantiere_squadre (cantiere_id, squadra_id, data_inizio, data_fine, note)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE data_inizio = ?, data_fine = ?, note = ?`,
      [req.params.id, squadra_id, data_inizio, data_fine, note, data_inizio, data_fine, note]
    )

    res.json({ success: true, data: { id: result.insertId } })

  } catch (error) {
    console.error('Assign team error:', error)
    res.status(500).json({ success: false, error: 'Errore assegnazione team' })
  }
}

module.exports = {
  getAll,
  create,
  getById,
  update,
  delete: deleteById,
  getMilestones,
  createMilestone,
  getTeam,
  assignTeam
}
