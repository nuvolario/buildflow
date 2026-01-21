/**
 * BuildFlow - Tasks Controller
 */

const pool = require('../config/database')

async function getAll(req, res) {
  try {
    const { cantiere_id, stato, assegnato_a, priorita, page = 1, limit = 50 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT t.*,
             m.nome as assegnato_nome, m.cognome as assegnato_cognome,
             c.nome as cantiere_nome
       FROM tasks t
       JOIN cantieri c ON t.cantiere_id = c.id
       LEFT JOIN membri m ON t.assegnato_a = m.id
       WHERE c.company_id = ?
    `
    const params = [req.companyId]

    if (cantiere_id) {
      query += ' AND t.cantiere_id = ?'
      params.push(cantiere_id)
    }

    if (stato) {
      query += ' AND t.stato = ?'
      params.push(stato)
    }

    if (assegnato_a) {
      query += ' AND t.assegnato_a = ?'
      params.push(assegnato_a)
    }

    if (priorita) {
      query += ' AND t.priorita = ?'
      params.push(priorita)
    }

    query += ' ORDER BY t.ordine, t.created_at DESC LIMIT ? OFFSET ?'
    params.push(parseInt(limit), parseInt(offset))

    const [tasks] = await pool.execute(query, params)

    res.json({ success: true, data: tasks })

  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero tasks' })
  }
}

async function create(req, res) {
  try {
    const {
      cantiere_id, milestone_id, titolo, descrizione,
      assegnato_a, squadra_id, priorita, data_scadenza,
      tempo_stimato_minuti, costo_stimato
    } = req.body

    if (!cantiere_id || !titolo) {
      return res.status(400).json({ success: false, error: 'Cantiere e titolo obbligatori' })
    }

    const [result] = await pool.execute(
      `INSERT INTO tasks
       (cantiere_id, milestone_id, titolo, descrizione, assegnato_a, squadra_id, priorita,
        data_scadenza, tempo_stimato_minuti, costo_stimato, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cantiere_id, milestone_id || null, titolo, descrizione || null,
        assegnato_a || null, squadra_id || null, priorita || 'normale',
        data_scadenza || null, tempo_stimato_minuti || null, costo_stimato || null,
        req.userId
      ]
    )

    res.status(201).json({ success: true, data: { id: result.insertId, titolo } })

  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ success: false, error: 'Errore creazione task' })
  }
}

async function getById(req, res) {
  try {
    const [tasks] = await pool.execute(
      `SELECT t.*, m.nome as assegnato_nome, m.cognome as assegnato_cognome
       FROM tasks t
       JOIN cantieri c ON t.cantiere_id = c.id
       LEFT JOIN membri m ON t.assegnato_a = m.id
       WHERE t.id = ? AND c.company_id = ?`,
      [req.params.id, req.companyId]
    )

    if (tasks.length === 0) {
      return res.status(404).json({ success: false, error: 'Task non trovato' })
    }

    res.json({ success: true, data: tasks[0] })

  } catch (error) {
    console.error('Get task error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero task' })
  }
}

async function update(req, res) {
  try {
    const {
      titolo, descrizione, assegnato_a, squadra_id, stato, priorita,
      data_scadenza, tempo_stimato_minuti, costo_stimato, note, ordine
    } = req.body

    const [result] = await pool.execute(
      `UPDATE tasks SET
        titolo = COALESCE(?, titolo),
        descrizione = ?,
        assegnato_a = ?,
        squadra_id = ?,
        stato = COALESCE(?, stato),
        priorita = COALESCE(?, priorita),
        data_scadenza = ?,
        tempo_stimato_minuti = ?,
        costo_stimato = ?,
        note = ?,
        ordine = COALESCE(?, ordine),
        updated_at = NOW()
       WHERE id = ? AND cantiere_id IN (SELECT id FROM cantieri WHERE company_id = ?)`,
      [
        titolo, descrizione, assegnato_a, squadra_id, stato, priorita,
        data_scadenza, tempo_stimato_minuti, costo_stimato, note, ordine,
        req.params.id, req.companyId
      ]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Task non trovato' })
    }

    res.json({ success: true, message: 'Task aggiornato' })

  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiornamento task' })
  }
}

async function deleteById(req, res) {
  try {
    const [result] = await pool.execute(
      `DELETE FROM tasks WHERE id = ? AND cantiere_id IN (SELECT id FROM cantieri WHERE company_id = ?)`,
      [req.params.id, req.companyId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Task non trovato' })
    }

    res.json({ success: true, message: 'Task eliminato' })

  } catch (error) {
    console.error('Delete task error:', error)
    res.status(500).json({ success: false, error: 'Errore eliminazione task' })
  }
}

async function updateStato(req, res) {
  try {
    const { stato } = req.body

    const validStati = ['pending', 'in_progress', 'completed', 'blocked', 'cancelled']
    if (!validStati.includes(stato)) {
      return res.status(400).json({ success: false, error: 'Stato non valido' })
    }

    const updates = ['stato = ?', 'updated_at = NOW()']
    const params = [stato]

    // Se completato, imposta data_completamento
    if (stato === 'completed') {
      updates.push('data_completamento = NOW()')
    }

    const [result] = await pool.execute(
      `UPDATE tasks SET ${updates.join(', ')}
       WHERE id = ? AND cantiere_id IN (SELECT id FROM cantieri WHERE company_id = ?)`,
      [...params, req.params.id, req.companyId]
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Task non trovato' })
    }

    res.json({ success: true, message: 'Stato aggiornato' })

  } catch (error) {
    console.error('Update stato error:', error)
    res.status(500).json({ success: false, error: 'Errore aggiornamento stato' })
  }
}

async function addTimeEntry(req, res) {
  try {
    const { membro_id, data, minuti, descrizione } = req.body

    if (!membro_id || !minuti) {
      return res.status(400).json({ success: false, error: 'Membro e minuti obbligatori' })
    }

    // Inserisci time entry
    await pool.execute(
      `INSERT INTO task_time_entries (task_id, membro_id, data, minuti, descrizione)
       VALUES (?, ?, ?, ?, ?)`,
      [req.params.id, membro_id, data || new Date().toISOString().split('T')[0], minuti, descrizione || null]
    )

    // Aggiorna tempo effettivo sul task
    await pool.execute(
      `UPDATE tasks SET tempo_effettivo_minuti = tempo_effettivo_minuti + ? WHERE id = ?`,
      [minuti, req.params.id]
    )

    res.status(201).json({ success: true, message: 'Tempo registrato' })

  } catch (error) {
    console.error('Add time entry error:', error)
    res.status(500).json({ success: false, error: 'Errore registrazione tempo' })
  }
}

async function getTimeEntries(req, res) {
  try {
    const [entries] = await pool.execute(
      `SELECT tte.*, m.nome, m.cognome
       FROM task_time_entries tte
       JOIN membri m ON tte.membro_id = m.id
       WHERE tte.task_id = ?
       ORDER BY tte.data DESC, tte.created_at DESC`,
      [req.params.id]
    )

    res.json({ success: true, data: entries })

  } catch (error) {
    console.error('Get time entries error:', error)
    res.status(500).json({ success: false, error: 'Errore recupero time entries' })
  }
}

module.exports = {
  getAll,
  create,
  getById,
  update,
  delete: deleteById,
  updateStato,
  addTimeEntry,
  getTimeEntries
}
