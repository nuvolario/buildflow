-- BuildFlow Migration 003: Cantieri

CREATE TABLE IF NOT EXISTS cantieri (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,

  -- Info base
  codice VARCHAR(50) NOT NULL,
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,

  -- Stato cantiere
  stato ENUM('pianificato', 'in_corso', 'sospeso', 'completato', 'annullato') DEFAULT 'pianificato',

  -- Date
  data_inizio_prevista DATE,
  data_fine_prevista DATE,
  data_inizio_effettiva DATE,
  data_fine_effettiva DATE,

  -- Localizzazione
  indirizzo VARCHAR(255),
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(2),
  latitudine DECIMAL(10, 8),
  longitudine DECIMAL(11, 8),

  -- Budget
  budget_previsto DECIMAL(12, 2),
  budget_attuale DECIMAL(12, 2),

  -- Riferimenti cliente
  cliente_nome VARCHAR(255),
  cliente_telefono VARCHAR(20),
  cliente_email VARCHAR(255),

  -- Documenti e note
  note TEXT,
  documenti JSON DEFAULT ('[]'),

  -- Metadata
  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE KEY unique_company_codice (company_id, codice),
  INDEX idx_cantieri_company (company_id),
  INDEX idx_cantieri_stato (stato),
  INDEX idx_cantieri_date (data_inizio_prevista, data_fine_prevista)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Milestone/Fasi cantiere
CREATE TABLE IF NOT EXISTS cantiere_milestones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cantiere_id INT UNSIGNED NOT NULL,

  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  ordine INT NOT NULL DEFAULT 0,

  -- Stato
  stato ENUM('pending', 'in_progress', 'completed', 'skipped') DEFAULT 'pending',

  -- Date
  data_prevista DATE,
  data_completamento DATE,

  -- Percentuale completamento
  percentuale_completamento TINYINT UNSIGNED DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  INDEX idx_milestones_cantiere (cantiere_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log attivita cantiere
CREATE TABLE IF NOT EXISTS cantiere_activities (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cantiere_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED,

  tipo_attivita VARCHAR(50) NOT NULL,
  descrizione TEXT,
  dettagli JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_activities_cantiere (cantiere_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
