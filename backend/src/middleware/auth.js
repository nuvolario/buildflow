/**
 * BuildFlow - JWT Authentication Middleware
 */

const jwt = require('jsonwebtoken')
const pool = require('../config/database')

const JWT_SECRET = process.env.JWT_SECRET || 'buildflow-secret-change-in-production'
const JWT_EXPIRES_IN = '7d'

/**
 * Genera un token JWT per l'utente
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      companyId: user.company_id
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

/**
 * Verifica un token JWT
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

/**
 * Middleware di autenticazione
 * Verifica il token JWT e aggiunge user alla request
 */
async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token di autenticazione mancante'
      })
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Token non valido o scaduto'
      })
    }

    // Verifica che l'utente esista ancora
    const [users] = await pool.execute(
      'SELECT id, email, nome, cognome, status FROM users WHERE id = ? AND status = ?',
      [decoded.userId, 'active']
    )

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Utente non trovato o disabilitato'
      })
    }

    // Aggiungi user e company alla request
    req.user = users[0]
    req.userId = decoded.userId
    req.companyId = decoded.companyId

    next()
  } catch (error) {
    console.error('Auth middleware error:', error)
    return res.status(500).json({
      success: false,
      error: 'Errore di autenticazione'
    })
  }
}

/**
 * Middleware opzionale - non blocca se non autenticato
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = verifyToken(token)

      if (decoded) {
        req.userId = decoded.userId
        req.companyId = decoded.companyId
      }
    }

    next()
  } catch (error) {
    next()
  }
}

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  optionalAuth,
  JWT_SECRET
}
