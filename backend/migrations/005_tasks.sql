-- BuildFlow Migration 005: Tasks

CREATE TABLE IF NOT EXISTS tasks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cantiere_id INT UNSIGNED NOT NULL,
  milestone_id INT UNSIGNED,

  -- Info task
  titolo VARCHAR(255) NOT NULL,
  descrizione TEXT,

  -- Assegnazione
  assegnato_a INT UNSIGNED,
  squadra_id INT UNSIGNED,

  -- Stato
  stato ENUM('pending', 'in_progress', 'completed', 'blocked', 'cancelled') DEFAULT 'pending',

  -- Priorita
  priorita ENUM('bassa', 'normale', 'alta', 'urgente') DEFAULT 'normale',

  -- Date
  data_scadenza DATE,
  data_completamento TIMESTAMP NULL,

  -- Tempo
  tempo_stimato_minuti INT UNSIGNED,
  tempo_effettivo_minuti INT UNSIGNED DEFAULT 0,

  -- Costi
  costo_stimato DECIMAL(10, 2),
  costo_effettivo DECIMAL(10, 2),

  -- Metadata
  note TEXT,
  allegati JSON DEFAULT ('[]'),

  -- Ordinamento
  ordine INT DEFAULT 0,

  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (milestone_id) REFERENCES cantiere_milestones(id) ON DELETE SET NULL,
  FOREIGN KEY (assegnato_a) REFERENCES membri(id) ON DELETE SET NULL,
  FOREIGN KEY (squadra_id) REFERENCES squadre(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_tasks_cantiere (cantiere_id),
  INDEX idx_tasks_stato (stato),
  INDEX idx_tasks_assegnato (assegnato_a),
  INDEX idx_tasks_scadenza (data_scadenza)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log tempo lavorato sui task
CREATE TABLE IF NOT EXISTS task_time_entries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,
  membro_id INT UNSIGNED NOT NULL,

  data DATE NOT NULL,
  minuti INT UNSIGNED NOT NULL,

  descrizione TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (membro_id) REFERENCES membri(id) ON DELETE CASCADE,
  INDEX idx_time_entries_task (task_id),
  INDEX idx_time_entries_membro (membro_id, data)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Commenti sui task
CREATE TABLE IF NOT EXISTS task_comments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,

  contenuto TEXT NOT NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_comments_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Checklist items per task
CREATE TABLE IF NOT EXISTS task_checklist (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  task_id INT UNSIGNED NOT NULL,

  testo VARCHAR(255) NOT NULL,
  completato TINYINT(1) DEFAULT 0,
  completato_da INT UNSIGNED,
  completato_at TIMESTAMP NULL,

  ordine INT DEFAULT 0,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (completato_da) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_checklist_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
