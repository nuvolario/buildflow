-- BuildFlow Migration 008: Audit Trail Immutabile
-- Sistema di tracciamento completo per eventi critici

-- Audit log principale (IMMUTABILE - no UPDATE/DELETE permessi)
CREATE TABLE IF NOT EXISTS audit_log (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Contesto
  company_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED,
  cantiere_id INT UNSIGNED,

  -- Evento
  evento VARCHAR(100) NOT NULL,
  categoria ENUM(
    'auth',           -- Login, logout, password change
    'cantiere',       -- Operazioni cantiere
    'task',           -- Operazioni task
    'safety',         -- Eventi sicurezza
    'document',       -- Documenti
    'team',           -- Squadre e membri
    'compliance',     -- Violazioni compliance
    'system'          -- Eventi sistema
  ) NOT NULL,

  -- Severita
  severita ENUM('info', 'warning', 'critical') DEFAULT 'info',

  -- Entita coinvolta
  entita_tipo VARCHAR(50),
  entita_id INT UNSIGNED,

  -- Dati evento (JSON)
  dati_prima JSON,
  dati_dopo JSON,
  metadata JSON,

  -- Descrizione leggibile
  descrizione TEXT,

  -- Tracciamento
  ip_address VARCHAR(45),
  user_agent VARCHAR(500),

  -- Timestamp immutabile
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- NO foreign keys per garantire immutabilita anche se entita vengono cancellate
  INDEX idx_audit_company (company_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_cantiere (cantiere_id),
  INDEX idx_audit_evento (evento),
  INDEX idx_audit_categoria (categoria),
  INDEX idx_audit_severita (severita),
  INDEX idx_audit_entita (entita_tipo, entita_id),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger per impedire UPDATE e DELETE sull'audit_log
-- (MySQL non supporta trigger su stesso evento, useremo permessi a livello applicativo)

-- Vista per eventi critici recenti
CREATE OR REPLACE VIEW audit_critical_events AS
SELECT
  al.*,
  u.nome as user_nome,
  u.cognome as user_cognome,
  c.nome as cantiere_nome
FROM audit_log al
LEFT JOIN users u ON al.user_id = u.id
LEFT JOIN cantieri c ON al.cantiere_id = c.id
WHERE al.severita IN ('warning', 'critical')
ORDER BY al.created_at DESC;

-- Eventi predefiniti da tracciare
-- Questi sono i tipi di evento che il sistema dovra loggare:

/*
CATEGORIA: auth
- user.login
- user.logout
- user.password_change
- user.failed_login

CATEGORIA: cantiere
- cantiere.created
- cantiere.updated
- cantiere.stato_changed
- cantiere.deleted

CATEGORIA: task
- task.created
- task.assigned
- task.stato_changed
- task.completed
- task.time_logged

CATEGORIA: safety
- safety.checklist_completed
- safety.checklist_failed
- safety.incident_reported
- safety.near_miss_reported
- safety.violation_detected
- safety.work_blocked
- safety.dpi_missing

CATEGORIA: document
- document.uploaded
- document.approved
- document.rejected
- document.expired
- document.expiring_soon

CATEGORIA: team
- membro.created
- membro.assigned_squadra
- membro.removed_squadra
- membro.qualification_expired

CATEGORIA: compliance
- compliance.document_missing
- compliance.qualification_expired
- compliance.work_unauthorized
- compliance.safety_violation

CATEGORIA: system
- system.migration_run
- system.backup_completed
- system.error
*/
