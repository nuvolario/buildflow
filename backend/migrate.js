#!/usr/bin/env node

/**
 * BuildFlow - Migration Runner
 * Pattern da nuvolario-organizer
 *
 * Usage:
 *   node migrate.js           # Esegue migrations pending
 *   node migrate.js --status  # Mostra stato migrations
 *   node migrate.js --reset   # Reset tabella migrations
 */

require('dotenv').config()
const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

// Colori console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[OK]${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}[WARN]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
}

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'buildflow',
    multipleStatements: true
  })
}

async function ensureMigrationsTable(conn) {
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      checksum VARCHAR(32) NOT NULL,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations')

  if (!fs.existsSync(migrationsDir)) {
    return []
  }

  return fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()
}

function getFileChecksum(filepath) {
  const content = fs.readFileSync(filepath, 'utf8')
  return crypto.createHash('md5').update(content).digest('hex')
}

async function getExecutedMigrations(conn) {
  const [rows] = await conn.execute('SELECT name, checksum FROM _migrations ORDER BY name')
  return new Map(rows.map(r => [r.name, r.checksum]))
}

async function runMigrations() {
  log.info('Connessione al database...')

  const conn = await getConnection()

  try {
    await ensureMigrationsTable(conn)

    const files = getMigrationFiles()
    const executed = await getExecutedMigrations(conn)

    log.info(`Trovate ${files.length} migrations, ${executed.size} gia eseguite`)

    let pending = 0
    let success = 0

    for (const file of files) {
      const filepath = path.join(__dirname, 'migrations', file)
      const checksum = getFileChecksum(filepath)

      if (executed.has(file)) {
        const savedChecksum = executed.get(file)
        if (savedChecksum !== checksum) {
          log.warn(`${file} - checksum diverso! (modificata dopo esecuzione)`)
        }
        continue
      }

      pending++
      log.info(`Esecuzione: ${file}`)

      try {
        const sql = fs.readFileSync(filepath, 'utf8')
        await conn.query(sql)

        await conn.execute(
          'INSERT INTO _migrations (name, checksum) VALUES (?, ?)',
          [file, checksum]
        )

        log.success(`${file} completata`)
        success++

      } catch (err) {
        log.error(`${file} fallita: ${err.message}`)
        throw err
      }
    }

    if (pending === 0) {
      log.success('Nessuna migration da eseguire')
    } else {
      log.success(`${success}/${pending} migrations eseguite con successo`)
    }

  } finally {
    await conn.end()
  }
}

async function showStatus() {
  log.info('Stato migrations...')

  const conn = await getConnection()

  try {
    await ensureMigrationsTable(conn)

    const files = getMigrationFiles()
    const executed = await getExecutedMigrations(conn)

    console.log('')
    console.log('MIGRATION                              STATUS')
    console.log('─'.repeat(60))

    for (const file of files) {
      const filepath = path.join(__dirname, 'migrations', file)
      const checksum = getFileChecksum(filepath)

      if (executed.has(file)) {
        const savedChecksum = executed.get(file)
        if (savedChecksum !== checksum) {
          console.log(`${file.padEnd(40)} ${colors.yellow}MODIFIED${colors.reset}`)
        } else {
          console.log(`${file.padEnd(40)} ${colors.green}EXECUTED${colors.reset}`)
        }
      } else {
        console.log(`${file.padEnd(40)} ${colors.cyan}PENDING${colors.reset}`)
      }
    }

    console.log('')

  } finally {
    await conn.end()
  }
}

async function resetMigrations() {
  log.warn('Reset tabella migrations...')

  const conn = await getConnection()

  try {
    await conn.execute('DROP TABLE IF EXISTS _migrations')
    log.success('Tabella _migrations eliminata')

  } finally {
    await conn.end()
  }
}

// Main
const args = process.argv.slice(2)

if (args.includes('--status')) {
  showStatus().catch(err => {
    log.error(err.message)
    process.exit(1)
  })
} else if (args.includes('--reset')) {
  resetMigrations().catch(err => {
    log.error(err.message)
    process.exit(1)
  })
} else {
  runMigrations().catch(err => {
    log.error(err.message)
    process.exit(1)
  })
}
