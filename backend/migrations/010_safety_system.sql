-- BuildFlow Migration 010: Sistema Sicurezza Completo
-- Checklist sicurezza per attivita, controlli obbligatori, incidenti e near-miss
-- IL LAVORATORE DEVE SPUNTARE I CONTROLLI PRIMA DI INIZIARE IL LAVORO

-- ============================================================
-- CATEGORIE ATTIVITA E LIVELLI PERICOLOSITA
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_activity_categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codice VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Livello di rischio base della categoria
  livello_rischio ENUM('basso', 'medio', 'alto', 'molto_alto') NOT NULL DEFAULT 'medio',

  -- DPI obbligatori per questa categoria (JSON array)
  dpi_obbligatori JSON NOT NULL DEFAULT ('[]'),

  -- Formazione richiesta (codici da document_types)
  formazione_richiesta JSON DEFAULT ('[]'),

  -- Patentini/abilitazioni richieste
  abilitazioni_richieste JSON DEFAULT ('[]'),

  -- Ordine visualizzazione
  ordine INT DEFAULT 0,

  attivo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TEMPLATE CHECKLIST SICUREZZA
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_checklist_templates (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED,  -- NULL = template di sistema

  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Associazione a categoria attivita
  category_id INT UNSIGNED,

  -- Livello rischio per cui e' obbligatorio
  livello_rischio_minimo ENUM('basso', 'medio', 'alto', 'molto_alto') DEFAULT 'basso',

  -- Tipo checklist
  tipo ENUM('pre_lavoro', 'giornaliera', 'settimanale', 'post_lavoro', 'emergenza') DEFAULT 'pre_lavoro',

  -- Template attivo
  attivo TINYINT(1) DEFAULT 1,

  created_by INT UNSIGNED,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES safety_activity_categories(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_template_company (company_id),
  INDEX idx_template_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Items dei template checklist
CREATE TABLE IF NOT EXISTS safety_checklist_template_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  template_id INT UNSIGNED NOT NULL,

  -- Contenuto
  testo TEXT NOT NULL,
  descrizione_estesa TEXT,

  -- Categorizzazione
  categoria ENUM(
    'dpi',              -- Dispositivi protezione individuale
    'attrezzature',     -- Controllo attrezzature
    'ambiente',         -- Condizioni ambientali
    'procedure',        -- Procedure operative
    'documentazione',   -- Documentazione richiesta
    'formazione',       -- Verifica formazione
    'emergenza',        -- Procedure emergenza
    'interferenze',     -- Gestione interferenze
    'altro'
  ) NOT NULL DEFAULT 'procedure',

  -- Obbligatorieta
  obbligatorio TINYINT(1) DEFAULT 1,

  -- Se obbligatorio e non spuntato, blocca il lavoro
  bloccante TINYINT(1) DEFAULT 0,

  -- Richiede foto/allegato
  richiede_evidenza TINYINT(1) DEFAULT 0,

  -- Richiede nota/commento
  richiede_nota TINYINT(1) DEFAULT 0,

  -- Ordine
  ordine INT DEFAULT 0,

  attivo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (template_id) REFERENCES safety_checklist_templates(id) ON DELETE CASCADE,
  INDEX idx_item_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- CHECKLIST COMPILATE DAI LAVORATORI
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_checklists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  cantiere_id INT UNSIGNED NOT NULL,
  task_id INT UNSIGNED,

  -- Template usato
  template_id INT UNSIGNED,

  -- Chi compila
  compilato_da INT UNSIGNED NOT NULL,  -- membro_id

  -- Data e ora
  data DATE NOT NULL,
  ora_inizio TIME,
  ora_fine TIME,

  -- Stato
  stato ENUM('in_corso', 'completata', 'non_conforme', 'bloccata') DEFAULT 'in_corso',

  -- Esito
  tutti_controlli_ok TINYINT(1) DEFAULT 0,
  controlli_totali INT UNSIGNED DEFAULT 0,
  controlli_superati INT UNSIGNED DEFAULT 0,
  controlli_falliti INT UNSIGNED DEFAULT 0,
  controlli_na INT UNSIGNED DEFAULT 0,  -- Non applicabili

  -- Se bloccante non superato
  lavoro_autorizzato TINYINT(1) DEFAULT 0,

  -- Firma digitale (conferma del lavoratore)
  firma_lavoratore TINYINT(1) DEFAULT 0,
  firma_lavoratore_at TIMESTAMP NULL,
  dichiarazione_accettata TINYINT(1) DEFAULT 0,

  -- Supervisore (se richiesto)
  verificato_da INT UNSIGNED,  -- user_id supervisore
  verificato_at TIMESTAMP NULL,
  note_supervisore TEXT,

  -- Note generali
  note TEXT,

  -- Condizioni meteo (rilevanti per sicurezza)
  meteo ENUM('sereno', 'nuvoloso', 'pioggia', 'neve', 'vento_forte', 'nebbia') DEFAULT 'sereno',
  temperatura_percepita ENUM('normale', 'caldo_intenso', 'freddo_intenso'),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (template_id) REFERENCES safety_checklist_templates(id) ON DELETE SET NULL,
  FOREIGN KEY (compilato_da) REFERENCES membri(id) ON DELETE CASCADE,
  FOREIGN KEY (verificato_da) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_checklist_cantiere (cantiere_id),
  INDEX idx_checklist_membro (compilato_da),
  INDEX idx_checklist_data (data),
  INDEX idx_checklist_stato (stato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Risposte ai singoli items della checklist
CREATE TABLE IF NOT EXISTS safety_checklist_responses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  checklist_id INT UNSIGNED NOT NULL,
  template_item_id INT UNSIGNED,

  -- Testo controllo (copiato dal template per storicizzazione)
  testo_controllo TEXT NOT NULL,
  categoria VARCHAR(50),

  -- Risposta
  esito ENUM('ok', 'non_ok', 'na', 'pending') DEFAULT 'pending',

  -- Dettagli
  nota TEXT,
  evidenza_url VARCHAR(500),  -- Foto allegata

  -- Se non_ok
  azione_correttiva TEXT,
  azione_completata TINYINT(1) DEFAULT 0,

  -- Timestamp risposta
  risposto_at TIMESTAMP NULL,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (checklist_id) REFERENCES safety_checklists(id) ON DELETE CASCADE,
  FOREIGN KEY (template_item_id) REFERENCES safety_checklist_template_items(id) ON DELETE SET NULL,

  INDEX idx_response_checklist (checklist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- INCIDENTI E NEAR-MISS
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_incidents (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  company_id INT UNSIGNED NOT NULL,
  cantiere_id INT UNSIGNED NOT NULL,
  task_id INT UNSIGNED,

  -- Tipo evento
  tipo ENUM(
    'infortunio',         -- Infortunio con lesioni
    'near_miss',          -- Quasi incidente
    'danno_materiale',    -- Danno a cose
    'malore',             -- Malore sul lavoro
    'incidente_strada',   -- Incidente in itinere
    'altro'
  ) NOT NULL,

  -- Gravita
  gravita ENUM(
    'lieve',              -- Nessuna conseguenza o minima
    'media',              -- Conseguenze moderate
    'grave',              -- Conseguenze serie
    'molto_grave',        -- Prognosi > 40 giorni
    'mortale'
  ) NOT NULL,

  -- Data e ora evento
  data_evento DATE NOT NULL,
  ora_evento TIME,
  luogo_esatto TEXT,

  -- Persone coinvolte
  coinvolti JSON DEFAULT ('[]'),  -- Array di {membro_id, ruolo, lesioni}

  -- Descrizione
  descrizione TEXT NOT NULL,
  dinamica TEXT,
  cause_probabili TEXT,

  -- Testimoni
  testimoni JSON DEFAULT ('[]'),

  -- Conseguenze
  giorni_prognosi INT UNSIGNED DEFAULT 0,
  ricovero_ospedaliero TINYINT(1) DEFAULT 0,
  danni_materiali TEXT,
  stima_danni DECIMAL(12,2),

  -- Interventi immediati
  interventi_immediati TEXT,
  soccorsi_chiamati TINYINT(1) DEFAULT 0,
  autorita_avvisate TINYINT(1) DEFAULT 0,

  -- Allegati (foto, documenti)
  allegati JSON DEFAULT ('[]'),

  -- Analisi e follow-up
  analisi_cause TEXT,
  azioni_correttive TEXT,
  responsabile_followup INT UNSIGNED,
  scadenza_followup DATE,

  -- Stato gestione
  stato ENUM(
    'segnalato',
    'in_analisi',
    'azioni_definite',
    'azioni_in_corso',
    'chiuso'
  ) DEFAULT 'segnalato',

  -- Denuncia INAIL (se infortunio)
  denuncia_inail TINYINT(1) DEFAULT 0,
  numero_denuncia VARCHAR(50),
  data_denuncia DATE,

  -- Registrazione
  segnalato_da INT UNSIGNED NOT NULL,
  gestito_da INT UNSIGNED,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (cantiere_id) REFERENCES cantieri(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
  FOREIGN KEY (responsabile_followup) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (segnalato_da) REFERENCES users(id),
  FOREIGN KEY (gestito_da) REFERENCES users(id) ON DELETE SET NULL,

  INDEX idx_incident_cantiere (cantiere_id),
  INDEX idx_incident_tipo (tipo),
  INDEX idx_incident_gravita (gravita),
  INDEX idx_incident_data (data_evento),
  INDEX idx_incident_stato (stato)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DPI (Dispositivi Protezione Individuale)
-- ============================================================

CREATE TABLE IF NOT EXISTS safety_dpi (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  codice VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,
  categoria ENUM('testa', 'udito', 'vista', 'respirazione', 'mani', 'piedi', 'corpo', 'anticaduta', 'altro') NOT NULL,

  -- Immagine/icona
  icona_url VARCHAR(500),

  ordine INT DEFAULT 0,
  attivo TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATI INIZIALI
-- ============================================================

-- Categorie attivita standard
INSERT INTO safety_activity_categories (codice, nome, livello_rischio, dpi_obbligatori, ordine) VALUES
  ('scavi', 'Scavi e Movimento Terra', 'alto', '["casco", "scarpe_sicurezza", "gilet_av", "guanti"]', 1),
  ('demolizioni', 'Demolizioni', 'molto_alto', '["casco", "scarpe_sicurezza", "occhiali", "mascherina", "guanti", "tuta"]', 2),
  ('strutture_ca', 'Strutture in C.A.', 'alto', '["casco", "scarpe_sicurezza", "guanti", "gilet_av"]', 3),
  ('carpenteria', 'Carpenteria', 'alto', '["casco", "scarpe_sicurezza", "guanti", "occhiali"]', 4),
  ('muratura', 'Muratura', 'medio', '["casco", "scarpe_sicurezza", "guanti"]', 5),
  ('coperture', 'Lavori in Copertura', 'molto_alto', '["casco", "scarpe_sicurezza", "imbracatura", "guanti"]', 6),
  ('quota', 'Lavori in Quota (>2m)', 'molto_alto', '["casco", "scarpe_sicurezza", "imbracatura", "guanti"]', 7),
  ('elettrico', 'Impianti Elettrici', 'alto', '["casco", "scarpe_sicurezza", "guanti_isolanti", "occhiali"]', 8),
  ('idraulico', 'Impianti Idraulici', 'medio', '["casco", "scarpe_sicurezza", "guanti", "occhiali"]', 9),
  ('finiture', 'Finiture Interne', 'basso', '["scarpe_sicurezza", "guanti"]', 10),
  ('pittura', 'Pittura e Verniciatura', 'medio', '["mascherina", "occhiali", "guanti", "tuta"]', 11),
  ('saldatura', 'Saldatura', 'alto', '["casco_saldatore", "guanti_saldatura", "grembiule", "scarpe_sicurezza"]', 12),
  ('spazi_confinati', 'Spazi Confinati', 'molto_alto', '["casco", "imbracatura", "rilevatore_gas", "autorespiratore"]', 13),
  ('amianto', 'Bonifica Amianto', 'molto_alto', '["tuta_monouso", "mascherina_ffp3", "guanti", "sovrascarpe"]', 14),
  ('generale', 'Attivita Generale', 'basso', '["scarpe_sicurezza"]', 99)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- DPI standard
INSERT INTO safety_dpi (codice, nome, categoria, ordine) VALUES
  ('casco', 'Casco di Protezione', 'testa', 1),
  ('casco_saldatore', 'Casco da Saldatore', 'testa', 2),
  ('cuffie', 'Cuffie Antirumore', 'udito', 3),
  ('tappi', 'Tappi Auricolari', 'udito', 4),
  ('occhiali', 'Occhiali di Protezione', 'vista', 5),
  ('visiera', 'Visiera Protettiva', 'vista', 6),
  ('mascherina', 'Mascherina FFP2', 'respirazione', 7),
  ('mascherina_ffp3', 'Mascherina FFP3', 'respirazione', 8),
  ('autorespiratore', 'Autorespiratore', 'respirazione', 9),
  ('guanti', 'Guanti da Lavoro', 'mani', 10),
  ('guanti_isolanti', 'Guanti Isolanti', 'mani', 11),
  ('guanti_saldatura', 'Guanti da Saldatura', 'mani', 12),
  ('scarpe_sicurezza', 'Scarpe Antinfortunistiche', 'piedi', 13),
  ('stivali', 'Stivali di Sicurezza', 'piedi', 14),
  ('gilet_av', 'Gilet Alta Visibilita', 'corpo', 15),
  ('tuta', 'Tuta da Lavoro', 'corpo', 16),
  ('tuta_monouso', 'Tuta Monouso', 'corpo', 17),
  ('grembiule', 'Grembiule Protettivo', 'corpo', 18),
  ('imbracatura', 'Imbracatura Anticaduta', 'anticaduta', 19),
  ('cordino', 'Cordino con Assorbitore', 'anticaduta', 20),
  ('rilevatore_gas', 'Rilevatore Gas', 'altro', 21)
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

-- Template checklist generica pre-lavoro
INSERT INTO safety_checklist_templates (company_id, nome, descrizione, tipo, livello_rischio_minimo) VALUES
  (NULL, 'Checklist Pre-Lavoro Base', 'Controlli standard prima di iniziare qualsiasi attivita', 'pre_lavoro', 'basso');

SET @template_id = LAST_INSERT_ID();

INSERT INTO safety_checklist_template_items (template_id, testo, categoria, obbligatorio, bloccante, ordine) VALUES
  (@template_id, 'Ho indossato tutti i DPI richiesti per questa attivita', 'dpi', 1, 1, 1),
  (@template_id, 'I DPI sono integri e in buono stato', 'dpi', 1, 1, 2),
  (@template_id, 'Ho verificato che le attrezzature siano funzionanti e sicure', 'attrezzature', 1, 1, 3),
  (@template_id, 'L\'area di lavoro e libera da ostacoli e pericoli evidenti', 'ambiente', 1, 1, 4),
  (@template_id, 'Conosco le procedure di emergenza e le vie di fuga', 'emergenza', 1, 1, 5),
  (@template_id, 'So dove si trovano estintori e cassetta primo soccorso', 'emergenza', 1, 0, 6),
  (@template_id, 'Non ci sono interferenze con altre lavorazioni in corso', 'interferenze', 1, 1, 7),
  (@template_id, 'Ho ricevuto le istruzioni operative per questa attivita', 'procedure', 1, 0, 8),
  (@template_id, 'Le condizioni meteo permettono di lavorare in sicurezza', 'ambiente', 1, 1, 9),
  (@template_id, 'Mi sento fisicamente idoneo a svolgere questa attivita', 'altro', 1, 1, 10);

-- Template checklist lavori in quota
INSERT INTO safety_checklist_templates (company_id, nome, descrizione, category_id, tipo, livello_rischio_minimo) VALUES
  (NULL, 'Checklist Lavori in Quota', 'Controlli specifici per lavori oltre 2 metri di altezza',
   (SELECT id FROM safety_activity_categories WHERE codice = 'quota'), 'pre_lavoro', 'alto');

SET @template_quota = LAST_INSERT_ID();

INSERT INTO safety_checklist_template_items (template_id, testo, categoria, obbligatorio, bloccante, ordine) VALUES
  (@template_quota, 'Indosso correttamente l\'imbracatura anticaduta', 'dpi', 1, 1, 1),
  (@template_quota, 'L\'imbracatura e stata verificata e non presenta danni', 'dpi', 1, 1, 2),
  (@template_quota, 'Il cordino con assorbitore e collegato a un punto di ancoraggio sicuro', 'dpi', 1, 1, 3),
  (@template_quota, 'Ho verificato la solidita del punto di ancoraggio', 'attrezzature', 1, 1, 4),
  (@template_quota, 'Il ponteggio/trabattello e stato verificato e autorizzato', 'attrezzature', 1, 1, 5),
  (@template_quota, 'Sono presenti parapetti e protezioni perimetrali', 'ambiente', 1, 1, 6),
  (@template_quota, 'L\'area sottostante e stata delimitata e segnalata', 'ambiente', 1, 1, 7),
  (@template_quota, 'Ho la formazione per lavori in quota (attestato valido)', 'formazione', 1, 1, 8),
  (@template_quota, 'Non soffro di vertigini o problemi che impediscano il lavoro in quota', 'altro', 1, 1, 9),
  (@template_quota, 'Ho il permesso di lavoro specifico per questa attivita', 'documentazione', 1, 1, 10);

-- Template checklist spazi confinati
INSERT INTO safety_checklist_templates (company_id, nome, descrizione, category_id, tipo, livello_rischio_minimo) VALUES
  (NULL, 'Checklist Spazi Confinati', 'Controlli specifici per accesso a spazi confinati o sospetti di inquinamento',
   (SELECT id FROM safety_activity_categories WHERE codice = 'spazi_confinati'), 'pre_lavoro', 'molto_alto');

SET @template_confinati = LAST_INSERT_ID();

INSERT INTO safety_checklist_template_items (template_id, testo, categoria, obbligatorio, bloccante, ordine) VALUES
  (@template_confinati, 'E stato emesso il permesso di lavoro specifico per spazi confinati', 'documentazione', 1, 1, 1),
  (@template_confinati, 'E presente il preposto responsabile dell\'operazione', 'procedure', 1, 1, 2),
  (@template_confinati, 'E stato effettuato il rilevamento atmosferico (O2, gas tossici, esplosivi)', 'attrezzature', 1, 1, 3),
  (@template_confinati, 'I valori rilevati sono nei limiti di sicurezza', 'ambiente', 1, 1, 4),
  (@template_confinati, 'E garantita la ventilazione adeguata dello spazio', 'ambiente', 1, 1, 5),
  (@template_confinati, 'Indosso correttamente l\'imbracatura per recupero', 'dpi', 1, 1, 6),
  (@template_confinati, 'E presente personale di sorveglianza all\'esterno', 'procedure', 1, 1, 7),
  (@template_confinati, 'Sono disponibili dispositivi di recupero rapido', 'attrezzature', 1, 1, 8),
  (@template_confinati, 'Ho la formazione specifica per spazi confinati', 'formazione', 1, 1, 9),
  (@template_confinati, 'Conosco le procedure di emergenza e soccorso', 'emergenza', 1, 1, 10),
  (@template_confinati, 'E disponibile autorespiratore/maschere per emergenza', 'attrezzature', 1, 1, 11);
