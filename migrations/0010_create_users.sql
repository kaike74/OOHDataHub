-- Migration: Create users table for authentication
-- This table stores user credentials and roles

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer', -- 'master' or 'viewer'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert master user
-- Email: kaike@hubradios.com
-- Password: Teste123
-- Hash generated with bcrypt (cost factor 10)
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'kaike@hubradios.com', 
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  'Kaike',
  'master'
);
