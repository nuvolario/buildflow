-- BuildFlow Migration 009: Consuntivazione Avanzata Tasks
-- Estensione task per consuntivazione completa: ore macchine, materiali, imprevisti, non conformita

-- Aggiunta stati task avanzati e campi consuntivazione
ALTER TABLE tasks
  -- Stati piu granulari
  MODIFY COLUMN stato ENUM(
    'planned',      -- Pianificato
    'ready',        -- Prerequisiti OK, pronto per esecuzione
    'in_progress',  -- In esecuzione
    'blocked',      -- Bloccato (attesa materiali, meteo, etc.)
    'done',         -- Completato
    'verified',     -- Verificato/Approvato
    'cancelled'     -- Annullato
  ) DEFAULT 'planned',

  -- Livello di rischio dell'attivita
  ADD COLUMN livello_rischio ENUM('basso', 'medio', 'alto', 'molto_alto') DEFAULT 'basso' AFTER priorita,

  -- Flag sicurezza completata
  ADD COLUMN sicurezza_verificata TINYINT(1) DEFAULT 0 AFTER livello_rischio,
  ADD COLUMN sicurezza_verificata_da INT UNSIGNED AFTER sicurezza_verificata,
  ADD COLUMN sicurezza_verificata_at TIMESTAMP NULL AFTER sicurezza_verificata_da,

  -- Consuntivo ore macchine
  ADD COLUMN ore_macchine_stimate DECIMAL(6,2) AFTER costo_effettivo,
  ADD COLUMN ore_macchine_effettive DECIMAL(6,2) DEFAULT 0 AFTER ore_macchine_stimate,

  -- Verificatore finale
  ADD COLUMN verificato_da INT UNSIGNED AFTER created_by,
  ADD COLUMN verificato_at TIMESTAMP NULL AFTER verificato_da;

-- Consuntivo materiali utilizzati
CREATE TABLE IF NOT EXISTS task_materiali (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,

  -- Materiale
  descrizione VARCHAR(255) NOT NULL,
  unita_misura VARCHAR(20) DEFAULT 'pz',
  quantita_prevista DECIMAL(10,2),
  quantita_utilizzata DECIMAL(10,2),

  -- Costo
  costo_unitario DECIMAL(10,2),
  costo_totale DECIMAL(12,2),

  note TEXT,

  registrato_da INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (registrato_da) REFERENCES users(id),
  INDEX idx_materiali_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Consuntivo ore macchine
CREATE TABLE IF NOT EXISTS task_ore_macchine (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,

  -- Macchina/Attrezzatura
  tipo_macchina VARCHAR(100) NOT NULL,
  targa_identificativo VARCHAR(50),

  data DATE NOT NULL,
  ore DECIMAL(5,2) NOT NULL,

  -- Costo
  costo_orario DECIMAL(8,2),
  costo_totale DECIMAL(10,2),

  -- Operatore
  operatore_id INT UNSIGNED,

  note TEXT,

  registrato_da INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (operatore_id) REFERENCES membri(id) ON DELETE SET NULL,
  FOREIGN KEY (registrato_da) REFERENCES users(id),
  INDEX idx_ore_macchine_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Imprevisti registrati
CREATE TABLE IF NOT EXISTS task_imprevisti (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,

  -- Tipo imprevisto
  tipo ENUM(
    'meteo',
    'materiali_mancanti',
    'attrezzature_guaste',
    'personale_assente',
    'interferenze',
    'errore_progetto',
    'variante_richiesta',
    'altro'
  ) NOT NULL,

  descrizione TEXT NOT NULL,

  -- Impatto
  ore_ritardo INT UNSIGNED DEFAULT 0,
  costo_aggiuntivo DECIMAL(10,2) DEFAULT 0,

  -- Risoluzione
  risolto TINYINT(1) DEFAULT 0,
  risoluzione TEXT,
  risolto_at TIMESTAMP NULL,

  -- Allegati
  allegati JSON DEFAULT ('[]'),

  segnalato_da INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (segnalato_da) REFERENCES users(id),
  INDEX idx_imprevisti_task (task_id),
  INDEX idx_imprevisti_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Non conformita rilevate
CREATE TABLE IF NOT EXISTS task_non_conformita (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,
  cantiere_id INT UNSIGNED NOT NULL,

  -- Classificazione
  codice VARCHAR(20) NOT NULL,
  tipo ENUM(
    'qualita',
    'sicurezza',
    'procedura',
    'documentale',
    'ambientale'
  ) NOT NULL,

  gravita ENUM('lieve', 'media', 'grave', 'critica') NOT NULL,

  -- Descrizione
  descrizione TEXT NOT NULL,
  causa_presunta TEXT,

  -- Evidenze
  allegati JSON DEFAULT ('[]'),

  -- Azione correttiva
  azione_richiesta TEXT,
  responsabile_azione INT UNSIGNED,
  scadenza_azione DATE,

  -- Stato
  stato ENUM('aperta', 'in_gestione', 'risolta', 'chiusa') DEFAULT 'aperta',

  -- Chiusura
  azione_effettuata TEXT,
  chiusa_da INT UNSIGNED,
  chiusa_at TIMESTAMP NULL,

  -- Costi
  costo_risoluzione DECIMAL(10,2),

  segnalata_da INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (responsabile_azione) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (chiusa_da) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (segnalata_da) REFERENCES users(id),

  INDEX idx_nc_task (task_id),
  INDEX idx_nc_cantiere (cantiere_id),
  INDEX idx_nc_tipo (tipo),
  INDEX idx_nc_stato (stato),
  INDEX idx_nc_gravita (gravita)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
