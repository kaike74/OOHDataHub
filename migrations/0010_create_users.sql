-- Migration: Create users table
-- This table stores all system users with authentication and role information

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'master', 'manager', 'editor', 'viewer'
  status TEXT NOT NULL DEFAULT 'pending', -- 'active', 'pending', 'inactive'
  invited_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  FOREIGN KEY (invited_by) REFERENCES users(id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- Insert master user (password: Teste123)
-- Password hash generated with bcrypt rounds=10
INSERT INTO users (email, password_hash, name, role, status) 
VALUES (
  'kaike@hubradios.com', 
  '$2b$10$rnM.wIKmR.G7hgK527EkWOZ1mZGojqMAW2s8BWlUouKpjQAaaWAO1q',
  'Kaike', 
  'master', 
  'active'
);
