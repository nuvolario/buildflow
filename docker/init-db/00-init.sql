-- BuildFlow - Initial Database Setup
-- This file runs on first MySQL container startup

-- Grant privileges to app user
GRANT ALL PRIVILEGES ON buildflow.* TO 'buildflow_user'@'%';
FLUSH PRIVILEGES;

-- Create migrations tracking table
CREATE TABLE IF NOT EXISTS migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT 'BuildFlow database initialized successfully' AS status;
