/**
 * BuildFlow - Membri Controller
 */

const pool = require('../config/database')

async function getAll(req, res) {
  try {
    const { stato, search } = req.query

    let query = 'SELECT * FROM membri WHERE company_id = ?'
    const params = [req.companyId]

    if (stato) {
      query += ' AND stato = ?'
      params.push(stato)
    }

    if (search) {
      query += ' AND (nome LIKE ? OR cognome LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    query += ' ORDER BY cognome, nome'

    const [membri] = await pool.execute(query, params)

    res.json({ success: true, data: membri })

  } catch (error) {
    console.error('Get membri error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero membri' })
  }
}

async function create(req, res) {
  try {
    const {
      nome, cognome, codice_fiscale, telefono, email,
      tipo_contratto, data_assunzione, costo_orario, competenze
    } = req.body

    if (!nome || !cognome) {
      return res.status(400).json({ success: false, error: 'Nome e cognome obbligatori' })
    }

    const [result] = await pool.execute(
      `INSERT INTO membri
       (company_id, nome, cognome, codice_fiscale, telefono, email, tipo_contratto, data_assunzione, costo_orario, competenze)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.companyId, nome, cognome, codice_fiscale || null, telefono || null, email || null,
        tipo_contratto || null, data_assunzione || null, costo_orario || null,
        JSON.stringify(competenze || [])
      ]
    )

    res.status(201).json({ success: true, data: { id: result.insertId, nome, cognome } })

  } catch (error) {
    console.error('Create membro error:', error)
    res.status(500).json({ success: false, error: 'Errore creazione membro' })
  }
}

async function getById(req, res) {
  try {
    const [membri] = await pool.execute(
      'SELECT * FROM membri WHERE id = ? AND company_id = ?',
      [req.params.id, req.companyId]
    )

    if (membri.length === 0) {
      return res.status(404).json({ success: false, error: 'Membro non trovato' })
    }

    res.json({ success: true, data: membri[0] })

  } catch (error) {
    console.error('Get membro error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero membro' })
  }
}

async function update(req, res) {
  try {
    const {
      nome, cognome, codice_fiscale, telefono, email,
      tipo_contratto, data_assunzione, costo_orario, competenze, stato
    } = req.body

    const [result] = await pool.execute(
      `UPDATE membri SET
        nome = COALESCE(?, nome),
        cognome = COALESCE(?, cognome),
        codice_fiscale = ?,
        telefono = ?,
        email = ?,
        tipo_contratto = ?,
        data_assunzione = ?,
        costo_orario = ?,
        competenze = ?,
        stato = COALESCE(?, stato),
        updated_at = NOW()
       WHERE id = ? AND company_id = ?`,
      [
        nome, cognome, codice_fiscale, telefono, email,
        tipo_contratto, data_assunzione, costo_orario,
        competenze ? JSON.stringify(competenze) : null,
        stato, req.params.id, req.companyId
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Membro non trovato' })
    }

    res.json({ success: true, message: 'Membro aggiornato' })

  } catch (error) {
    console.error('Update membro error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiornamento membro' })
  }
}

async function deleteById(req, res) {
  try {
    const [result] = await pool.execute(
      'UPDATE membri SET stato = ? WHERE id = ? AND company_id = ?',
      ['inattivo', req.params.id, req.companyId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Membro non trovato' })
    }

    res.json({ success: true, message: 'Membro disattivato' })

  } catch (error) {
    console.error('Delete membro error:', error)
    res.status(500).json({ success: false, error: 'Errore eliminazione membro' })
  }
}

async function getDisponibilita(req, res) {
  try {
    const { data_inizio, data_fine } = req.query

    let query = 'SELECT * FROM membro_disponibilita WHERE membro_id = ?'
    const params = [req.params.id]

    if (data_inizio && data_fine) {
      query += ' AND data BETWEEN ? AND ?'
      params.push(data_inizio, data_fine)
    }

    query += ' ORDER BY data'

    const [disponibilita] = await pool.execute(query, params)

    res.json({ success: true, data: disponibilita })

  } catch (error) {
    console.error('Get disponibilita error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero disponibilita' })
  }
}

async function setDisponibilita(req, res) {
  try {
    const { data, tipo, ore_disponibili, note } = req.body

    await pool.execute(
      `INSERT INTO membro_disponibilita (membro_id, data, tipo, ore_disponibili, note)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE tipo = ?, ore_disponibili = ?, note = ?`,
      [req.params.id, data, tipo, ore_disponibili, note, tipo, ore_disponibili, note]
    )

    res.json({ success: true, message: 'Disponibilita aggiornata' })

  } catch (error) {
    console.error('Set disponibilita error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiornamento disponibilita' })
  }
}

module.exports = {
  getAll,
  create,
  getById,
  update,
  delete: deleteById,
  getDisponibilita,
  setDisponibilita
}
