-- BuildFlow Migration 002: Companies (Multi-tenant)

CREATE TABLE IF NOT EXISTS companies (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  partita_iva VARCHAR(20),
  codice_fiscale VARCHAR(20),

  -- Contatti
  indirizzo TEXT,
  citta VARCHAR(100),
  cap VARCHAR(10),
  provincia VARCHAR(2),
  telefono VARCHAR(20),
  email VARCHAR(255),
  pec VARCHAR(255),

  -- Branding
  logo_url VARCHAR(500),
  colore_primario VARCHAR(7) DEFAULT '#2563EB',

  -- Settings
  settings JSON,

  -- Stato
  status ENUM('active', 'suspended', 'trial') DEFAULT 'active',
  trial_ends_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_companies_slug (slug),
  INDEX idx_companies_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membership utente-azienda
CREATE TABLE IF NOT EXISTS company_users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,

  -- Ruolo nell'azienda
  ruolo ENUM('titolare', 'amministratore', 'responsabile', 'operatore', 'ospite') DEFAULT 'operatore',

  -- Permessi custom (override ruolo)
  custom_permissions JSON,

  -- Metadata
  invitato_da INT UNSIGNED,
  invitato_at TIMESTAMP NULL,
  accettato_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invitato_da) REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE KEY unique_company_user (company_id, user_id),
  INDEX idx_company_users_company (company_id),
  INDEX idx_company_users_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
