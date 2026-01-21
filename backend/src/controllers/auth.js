/**
 * BuildFlow - Auth Controller
 */

const bcrypt = require('bcryptjs')
const pool = require('../config/database')
const { generateToken } = require('../middleware/auth')

/**
 * POST /api/auth/register
 * Registra un nuovo utente e crea la sua company
 */
async function register(req, res) {
  try {
    const { email, password, nome, cognome, telefono, companyName } = req.body

    // Validazione
    if (!email || !password || !nome || !cognome) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, nome e cognome sono obbligatori'
      })
    }

    // Verifica email esistente
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email.toLowerCase()]
    )

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email gia registrata'
      })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Inizia transazione
    const connection = await pool.getConnection()
    await connection.beginTransaction()

    try {
      // Crea company
      const companySlug = (companyName || `${nome}-${cognome}`)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100)

      const [companyResult] = await connection.execute(
        `INSERT INTO companies (nome, slug) VALUES (?, ?)`,
        [companyName || `${nome} ${cognome}`, companySlug + '-' + Date.now()]
      )

      const companyId = companyResult.insertId

      // Crea utente
      const [userResult] = await connection.execute(
        `INSERT INTO users (email, password_hash, nome, cognome, telefono)
         VALUES (?, ?, ?, ?, ?)`,
        [email.toLowerCase(), passwordHash, nome, cognome, telefono || null]
      )

      const userId = userResult.insertId

      // Collega utente a company come titolare
      await connection.execute(
        `INSERT INTO company_users (company_id, user_id, ruolo)
         VALUES (?, ?, ?)`,
        [companyId, userId, 'titolare']
      )

      await connection.commit()

      // Genera token
      const token = generateToken({
        id: userId,
        email: email.toLowerCase(),
        company_id: companyId
      })

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: userId,
            email: email.toLowerCase(),
            nome,
            cognome,
            telefono
          },
          company: {
            id: companyId,
            nome: companyName || `${nome} ${cognome}`
          }
        }
      })

    } catch (err) {
      await connection.rollback()
      throw err
    } finally {
      connection.release()
    }

  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      error: 'Errore durante la registrazione'
    })
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e password sono obbligatori'
      })
    }

    // Cerca utente con company
    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.password_hash, u.nome, u.cognome, u.telefono, u.status,
              cu.company_id, cu.ruolo, c.nome as company_name
       FROM users u
       LEFT JOIN company_users cu ON u.id = cu.user_id
       LEFT JOIN companies c ON cu.company_id = c.id
       WHERE u.email = ?`,
      [email.toLowerCase()]
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      })
    }

    const user = users[0]

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: 'Account non attivo'
      })
    }

    // Verifica password
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Credenziali non valide'
      })
    }

    // Aggiorna last login
    await pool.execute(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    )

    // Genera token
    const token = generateToken({
      id: user.id,
      email: user.email,
      company_id: user.company_id
    })

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          cognome: user.cognome,
          telefono: user.telefono
        },
        company: user.company_id ? {
          id: user.company_id,
          nome: user.company_name,
          ruolo: user.ruolo
        } : null
      }
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      error: 'Errore durante il login'
    })
  }
}

/**
 * GET /api/auth/me
 */
async function me(req, res) {
  try {
    const [users] = await pool.execute(
      `SELECT u.id, u.email, u.nome, u.cognome, u.telefono, u.status, u.created_at,
              cu.company_id, cu.ruolo, c.nome as company_name
       FROM users u
       LEFT JOIN company_users cu ON u.id = cu.user_id
       LEFT JOIN companies c ON cu.company_id = c.id
       WHERE u.id = ?`,
      [req.userId]
    )

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Utente non trovato'
      })
    }

    const user = users[0]

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          cognome: user.cognome,
          telefono: user.telefono,
          status: user.status,
          createdAt: user.created_at
        },
        company: user.company_id ? {
          id: user.company_id,
          nome: user.company_name,
          ruolo: user.ruolo
        } : null
      }
    })

  } catch (error) {
    console.error('Me error:', error)
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero profilo'
    })
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res) {
  // Con JWT stateless, il logout e' gestito lato client
  res.json({
    success: true,
    message: 'Logout effettuato'
  })
}

module.exports = {
  register,
  login,
  me,
  logout
}
