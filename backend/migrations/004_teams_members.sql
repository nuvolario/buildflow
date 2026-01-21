-- BuildFlow Migration 004: Team e Membri

-- Squadre di lavoro
CREATE TABLE IF NOT EXISTS squadre (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,

  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,
  colore VARCHAR(7) DEFAULT '#3B82F6',

  -- Capo squadra
  capo_squadra_id INT UNSIGNED,

  -- Stato
  attiva TINYINT(1) DEFAULT 1,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  INDEX idx_squadre_company (company_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membri (dipendenti/collaboratori)
CREATE TABLE IF NOT EXISTS membri (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED,

  -- Dati anagrafici
  nome VARCHAR(100) NOT NULL,
  cognome VARCHAR(100) NOT NULL,
  codice_fiscale VARCHAR(16),
  telefono VARCHAR(20),
  email VARCHAR(255),

  -- Contratto
  tipo_contratto VARCHAR(50),
  data_assunzione DATE,
  costo_orario DECIMAL(8, 2),

  -- Competenze (array di codici)
  competenze JSON DEFAULT ('[]'),

  -- Certificazioni/Patentini
  certificazioni JSON DEFAULT ('[]'),

  -- Stato
  stato ENUM('attivo', 'inattivo', 'sospeso') DEFAULT 'attivo',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_membri_company (company_id),
  INDEX idx_membri_stato (stato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Aggiorna FK capo_squadra dopo creazione membri
ALTER TABLE squadre ADD FOREIGN KEY (capo_squadra_id) REFERENCES membri(id) ON DELETE SET NULL;

-- Appartenenza membri a squadre
CREATE TABLE IF NOT EXISTS squadra_membri (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  squadra_id INT UNSIGNED NOT NULL,
  membro_id INT UNSIGNED NOT NULL,

  -- Ruolo nella squadra
  ruolo VARCHAR(50) DEFAULT 'operaio',

  data_ingresso DATE DEFAULT (CURDATE()),
  data_uscita DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (squadra_id) REFERENCES squadre(id) ON DELETE CASCADE,
  FOREIGN KEY (membro_id) REFERENCES membri(id) ON DELETE CASCADE,
  UNIQUE KEY unique_squadra_membro (squadra_id, membro_id),
  INDEX idx_squadra_membri_squadra (squadra_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disponibilita membri
CREATE TABLE IF NOT EXISTS membro_disponibilita (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  membro_id INT UNSIGNED NOT NULL,

  data DATE NOT NULL,

  -- Tipo disponibilita
  tipo ENUM('disponibile', 'ferie', 'malattia', 'permesso', 'non_disponibile') NOT NULL,

  -- Ore se parziale
  ore_disponibili DECIMAL(4, 2),

  note TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (membro_id) REFERENCES membri(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membro_data (membro_id, data),
  INDEX idx_disponibilita_membro (membro_id, data)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assegnazione squadre a cantieri
CREATE TABLE IF NOT EXISTS cantiere_squadre (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cantiere_id INT UNSIGNED NOT NULL,
  squadra_id INT UNSIGNED NOT NULL,

  data_inizio DATE,
  data_fine DATE,

  note TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (squadra_id) REFERENCES squadre(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cantiere_squadra (cantiere_id, squadra_id),
  INDEX idx_cantiere_squadre_cantiere (cantiere_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
