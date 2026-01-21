-- BuildFlow Migration 006: Figure Professionali e Specializzazioni

-- Categorie di specializzazione
CREATE TABLE IF NOT EXISTS specializzazioni (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codice VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,
  categoria VARCHAR(50),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ruoli professionali obbligatori per cantiere
CREATE TABLE IF NOT EXISTS cantiere_figure (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cantiere_id INT UNSIGNED NOT NULL,

  -- Tipo figura
  tipo_figura ENUM(
    'direttore_lavori',
    'responsabile_sicurezza',
    'capo_cantiere',
    'coordinatore_sicurezza_progettazione',
    'coordinatore_sicurezza_esecuzione',
    'preposto',
    'rls'
  ) NOT NULL,

  -- Assegnazione
  membro_id INT UNSIGNED,
  user_id INT UNSIGNED,

  -- Dati esterni se non membro interno
  nome_esterno VARCHAR(255),
  email_esterno VARCHAR(255),
  telefono_esterno VARCHAR(20),
  azienda_esterna VARCHAR(255),

  -- Date incarico
  data_inizio DATE,
  data_fine DATE,

  -- Documenti/Certificazioni richieste
  documenti JSON DEFAULT ('[]'),

  note TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (membro_id) REFERENCES membri(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE KEY unique_cantiere_figura (cantiere_id, tipo_figura),
  INDEX idx_cantiere_figure_cantiere (cantiere_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Competenze membri
CREATE TABLE IF NOT EXISTS membro_specializzazioni (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  membro_id INT UNSIGNED NOT NULL,
  specializzazione_id INT UNSIGNED NOT NULL,

  livello ENUM('base', 'intermedio', 'avanzato', 'esperto') DEFAULT 'base',
  certificato TINYINT(1) DEFAULT 0,
  data_certificazione DATE,
  scadenza_certificazione DATE,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (membro_id) REFERENCES membri(id) ON DELETE CASCADE,
  FOREIGN KEY (specializzazione_id) REFERENCES specializzazioni(id) ON DELETE CASCADE,
  UNIQUE KEY unique_membro_spec (membro_id, specializzazione_id),
  INDEX idx_membro_spec_membro (membro_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed specializzazioni base
INSERT INTO specializzazioni (codice, nome, categoria) VALUES
  ('muratore', 'Muratore', 'muratura'),
  ('carpentiere', 'Carpentiere', 'carpenteria'),
  ('ferraiolo', 'Ferraiolo', 'carpenteria'),
  ('elettricista', 'Elettricista', 'impianti'),
  ('idraulico', 'Idraulico', 'impianti'),
  ('termoidraulico', 'Termoidraulico', 'impianti'),
  ('piastrellista', 'Piastrellista', 'finiture'),
  ('imbianchino', 'Imbianchino', 'finiture'),
  ('cartongessista', 'Cartongessista', 'finiture'),
  ('posatore', 'Posatore pavimenti', 'finiture'),
  ('gruista', 'Gruista', 'macchinari'),
  ('escavatorista', 'Escavatorista', 'macchinari'),
  ('saldatore', 'Saldatore', 'metalli'),
  ('lattoniere', 'Lattoniere', 'coperture'),
  ('impermeabilizzatore', 'Impermeabilizzatore', 'coperture'),
  ('manovale', 'Manovale generico', 'generale')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
