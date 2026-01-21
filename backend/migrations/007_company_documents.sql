-- BuildFlow Migration 007: Documenti Aziendali con Scadenze
-- Gestione documentale per compliance (DURC, DVR, certificazioni, etc.)

-- Tipi di documento
CREATE TABLE IF NOT EXISTS document_types (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codice VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Configurazione
  obbligatorio TINYINT(1) DEFAULT 0,
  ha_scadenza TINYINT(1) DEFAULT 1,
  giorni_preavviso_scadenza INT DEFAULT 30,

  -- Applicabilita
  applicabile_a ENUM('azienda', 'membro', 'cantiere', 'all') DEFAULT 'azienda',

  -- Per quali ruoli/attivita e' richiesto (JSON array)
  richiesto_per_ruoli JSON,
  richiesto_per_attivita JSON,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Documenti caricati
CREATE TABLE IF NOT EXISTS company_documents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  document_type_id INT UNSIGNED NOT NULL,

  -- Riferimento opzionale (membro o cantiere)
  membro_id INT UNSIGNED,
  cantiere_id INT UNSIGNED,

  -- File
  nome_file VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INT UNSIGNED,
  mime_type VARCHAR(100),

  -- Date
  data_emissione DATE,
  data_scadenza DATE,

  -- Verifica/Approvazione
  stato ENUM('pending', 'approved', 'rejected', 'expired') DEFAULT 'pending',
  verificato_da INT UNSIGNED,
  verificato_at TIMESTAMP NULL,
  note_verifica TEXT,

  -- Metadata
  numero_documento VARCHAR(100),
  ente_emittente VARCHAR(255),
  note TEXT,

  uploaded_by INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (document_type_id) REFERENCES document_types(id),
  FOREIGN KEY (membro_id) REFERENCES membri(id) ON DELETE CASCADE,
  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (verificato_da) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),

  INDEX idx_docs_company (company_id),
  INDEX idx_docs_type (document_type_id),
  INDEX idx_docs_scadenza (data_scadenza),
  INDEX idx_docs_stato (stato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Storico verifiche documenti (audit)
CREATE TABLE IF NOT EXISTS document_verifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  document_id INT UNSIGNED NOT NULL,

  azione ENUM('uploaded', 'approved', 'rejected', 'expired', 'renewed') NOT NULL,
  stato_precedente VARCHAR(20),
  stato_nuovo VARCHAR(20),

  note TEXT,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (document_id) REFERENCES company_documents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_doc_verif_document (document_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed tipi documento standard
INSERT INTO document_types (codice, nome, descrizione, obbligatorio, ha_scadenza, giorni_preavviso_scadenza, applicabile_a) VALUES
  -- Documenti aziendali
  ('durc', 'DURC', 'Documento Unico di Regolarita Contributiva', 1, 1, 30, 'azienda'),
  ('dvr', 'DVR', 'Documento di Valutazione dei Rischi', 1, 1, 60, 'azienda'),
  ('visura_camerale', 'Visura Camerale', 'Visura della Camera di Commercio', 1, 1, 90, 'azienda'),
  ('polizza_rc', 'Polizza RC', 'Polizza Responsabilita Civile', 1, 1, 30, 'azienda'),
  ('polizza_infortuni', 'Polizza Infortuni', 'Polizza Assicurazione Infortuni', 1, 1, 30, 'azienda'),
  ('certificazione_iso', 'Certificazione ISO', 'Certificazione qualita ISO 9001/14001/45001', 0, 1, 60, 'azienda'),
  ('soa', 'Attestazione SOA', 'Attestazione per appalti pubblici', 0, 1, 90, 'azienda'),

  -- Documenti personali (membri)
  ('documento_identita', 'Documento Identita', 'Carta identita o passaporto', 1, 1, 60, 'membro'),
  ('codice_fiscale', 'Codice Fiscale', 'Tessera sanitaria/codice fiscale', 1, 0, 0, 'membro'),
  ('idoneita_sanitaria', 'Idoneita Sanitaria', 'Certificato idoneita alla mansione', 1, 1, 30, 'membro'),
  ('formazione_sicurezza', 'Formazione Sicurezza', 'Attestato formazione sicurezza base', 1, 1, 60, 'membro'),
  ('formazione_specifica', 'Formazione Specifica', 'Attestato formazione rischi specifici', 0, 1, 60, 'membro'),
  ('patentino_muletto', 'Patentino Muletto', 'Abilitazione carrelli elevatori', 0, 1, 60, 'membro'),
  ('patentino_gru', 'Patentino Gru', 'Abilitazione gru/autogru', 0, 1, 60, 'membro'),
  ('patentino_ple', 'Patentino PLE', 'Abilitazione piattaforme elevabili', 0, 1, 60, 'membro'),
  ('patentino_escavatore', 'Patentino Escavatore', 'Abilitazione escavatori e macchine movimento terra', 0, 1, 60, 'membro'),
  ('pes_pav_pei', 'PES/PAV/PEI', 'Qualifica lavori elettrici', 0, 1, 60, 'membro'),
  ('primo_soccorso', 'Primo Soccorso', 'Attestato addetto primo soccorso', 0, 1, 30, 'membro'),
  ('antincendio', 'Antincendio', 'Attestato addetto antincendio', 0, 1, 30, 'membro'),
  ('preposto', 'Preposto', 'Attestato formazione preposto', 0, 1, 60, 'membro'),
  ('dirigente', 'Dirigente Sicurezza', 'Attestato formazione dirigente', 0, 1, 60, 'membro'),
  ('rspp', 'RSPP', 'Attestato RSPP', 0, 1, 60, 'membro'),
  ('rls', 'RLS', 'Attestato RLS', 0, 1, 30, 'membro'),
  ('coordinatore_sicurezza', 'Coordinatore Sicurezza', 'Abilitazione CSP/CSE', 0, 1, 60, 'membro'),
  ('lavori_quota', 'Lavori in Quota', 'Formazione lavori in quota e DPI III cat', 0, 1, 60, 'membro'),
  ('spazi_confinati', 'Spazi Confinati', 'Formazione ambienti sospetti inquinamento', 0, 1, 60, 'membro'),

  -- Documenti cantiere
  ('pos', 'POS', 'Piano Operativo di Sicurezza', 1, 0, 0, 'cantiere'),
  ('psc', 'PSC', 'Piano di Sicurezza e Coordinamento', 0, 0, 0, 'cantiere'),
  ('notifica_preliminare', 'Notifica Preliminare', 'Notifica preliminare ASL', 1, 0, 0, 'cantiere'),
  ('permesso_costruire', 'Permesso di Costruire', 'Titolo abilitativo edilizio', 1, 0, 0, 'cantiere'),
  ('scia', 'SCIA', 'Segnalazione Certificata Inizio Attivita', 0, 0, 0, 'cantiere')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);
