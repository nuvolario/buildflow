/**
 * BuildFlow - Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('Error:', err.message)
  console.error('Stack:', err.stack)

  // CORS error
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS not allowed'
    })
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Token non valido'
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token scaduto'
    })
  }

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      error: 'Dato duplicato'
    })
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      error: 'Riferimento non valido'
    })
  }

  // Default error
  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Errore interno del server'
      : err.message
  })
}

module.exports = { errorHandler }
