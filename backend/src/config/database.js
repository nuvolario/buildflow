/**
 * BuildFlow - MySQL Database Configuration
 * Pattern da nuvolario-organizer
 */

const mysql = require('mysql2/promise')

// Detect serverless environment (Vercel)
const isServerless = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME

// Timezone offset per Europe/Rome con supporto DST
function getTimezoneOffset() {
  const now = new Date()
  const jan = new Date(now.getFullYear(), 0, 1)
  const jul = new Date(now.getFullYear(), 6, 1)
  const stdOffset = Math.max(jan.getTimezoneOffset(), jul.getTimezoneOffset())
  const isDST = now.getTimezoneOffset() < stdOffset
  return isDST ? '+02:00' : '+01:00'
}

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'buildflow',
  waitForConnections: true,
  connectionLimit: isServerless ? 3 : 10,
  queueLimit: 0,
  connectTimeout: 10000,
  timezone: getTimezoneOffset(),
  charset: 'utf8mb4'
})

// Test connessione al startup
pool.getConnection()
  .then(conn => {
    console.log('Database connected successfully')
    conn.release()
  })
  .catch(err => {
    console.error('Database connection failed:', err.message)
  })

module.exports = pool
