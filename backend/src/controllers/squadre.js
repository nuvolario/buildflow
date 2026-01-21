/**
 * BuildFlow - Squadre Controller
 */

const pool = require('../config/database')

async function getAll(req, res) {
  try {
    const [squadre] = await pool.execute(
      `SELECT s.*,
              (SELECT COUNT(*) FROM squadra_membri sm WHERE sm.squadra_id = s.id AND sm.data_uscita IS NULL) as membri_count
       FROM squadre s
       WHERE s.company_id = ? AND s.attiva = 1
       ORDER BY s.nome`,
      [req.companyId]
    )

    res.json({ success: true, data: squadre })

  } catch (error) {
    console.error('Get squadre error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero squadre' })
  }
}

async function create(req, res) {
  try {
    const { nome, descrizione, colore, capo_squadra_id } = req.body

    if (!nome) {
      return res.status(400).json({ success: false, error: 'Nome obbligatorio' })
    }

    const [result] = await pool.execute(
      `INSERT INTO squadre (company_id, nome, descrizione, colore, capo_squadra_id)
       VALUES (?, ?, ?, ?, ?)`,
      [req.companyId, nome, descrizione || null, colore || '#3B82F6', capo_squadra_id || null]
    )

    res.status(201).json({ success: true, data: { id: result.insertId, nome } })

  } catch (error) {
    console.error('Create squadra error:', error)
    res.status(500).json({ success: false, error: 'Errore creazione squadra' })
  }
}

async function getById(req, res) {
  try {
    const [squadre] = await pool.execute(
      'SELECT * FROM squadre WHERE id = ? AND company_id = ?',
      [req.params.id, req.companyId]
    )

    if (squadre.length === 0) {
      return res.status(404).json({ success: false, error: 'Squadra non trovata' })
    }

    res.json({ success: true, data: squadre[0] })

  } catch (error) {
    console.error('Get squadra error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero squadra' })
  }
}

async function update(req, res) {
  try {
    const { nome, descrizione, colore, capo_squadra_id, attiva } = req.body

    const [result] = await pool.execute(
      `UPDATE squadre SET
        nome = COALESCE(?, nome),
        descrizione = ?,
        colore = COALESCE(?, colore),
        capo_squadra_id = ?,
        attiva = COALESCE(?, attiva),
        updated_at = NOW()
       WHERE id = ? AND company_id = ?`,
      [nome, descrizione, colore, capo_squadra_id, attiva, req.params.id, req.companyId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Squadra non trovata' })
    }

    res.json({ success: true, message: 'Squadra aggiornata' })

  } catch (error) {
    console.error('Update squadra error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiornamento squadra' })
  }
}

async function deleteById(req, res) {
  try {
    const [result] = await pool.execute(
      'UPDATE squadre SET attiva = 0 WHERE id = ? AND company_id = ?',
      [req.params.id, req.companyId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Squadra non trovata' })
    }

    res.json({ success: true, message: 'Squadra disattivata' })

  } catch (error) {
    console.error('Delete squadra error:', error)
    res.status(500).json({ success: false, error: 'Errore eliminazione squadra' })
  }
}

async function getMembri(req, res) {
  try {
    const [membri] = await pool.execute(
      `SELECT m.*, sm.ruolo as ruolo_squadra, sm.data_ingresso
       FROM squadra_membri sm
       JOIN membri m ON sm.membro_id = m.id
       WHERE sm.squadra_id = ? AND sm.data_uscita IS NULL`,
      [req.params.id]
    )

    res.json({ success: true, data: membri })

  } catch (error) {
    console.error('Get membri error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero membri' })
  }
}

async function addMembro(req, res) {
  try {
    const { membro_id, ruolo } = req.body

    await pool.execute(
      `INSERT INTO squadra_membri (squadra_id, membro_id, ruolo, data_ingresso)
       VALUES (?, ?, ?, CURDATE())`,
      [req.params.id, membro_id, ruolo || 'operaio']
    )

    res.status(201).json({ success: true, message: 'Membro aggiunto' })

  } catch (error) {
    console.error('Add membro error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiunta membro' })
  }
}

async function removeMembro(req, res) {
  try {
    await pool.execute(
      `UPDATE squadra_membri SET data_uscita = CURDATE()
       WHERE squadra_id = ? AND membro_id = ?`,
      [req.params.id, req.params.membroId]
    )

    res.json({ success: true, message: 'Membro rimosso' })

  } catch (error) {
    console.error('Remove membro error:', error)
    res.status(500).json({ success: false, error: 'Errore rimozione membro' })
  }
}

module.exports = {
  getAll,
  create,
  getById,
  update,
  delete: deleteById,
  getMembri,
  addMembro,
  removeMembro
}
