/**
 * BuildFlow Backend - Entry Point
 * Supporta sia sviluppo locale che Vercel serverless
 */

require('dotenv').config()
const app = require('./app')

const PORT = process.env.PORT || 3001

// Vercel serverless export
if (process.env.VERCEL) {
  module.exports = app
} else {
  // Sviluppo locale
  app.listen(PORT, () => {
    console.log(`BuildFlow API running on port ${PORT}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
}
