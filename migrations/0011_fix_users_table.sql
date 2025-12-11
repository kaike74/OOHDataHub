-- Migration: Fix users table and create initial user
-- Drop existing table and recreate with correct structure

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);

-- Insert master user
-- Email: kaike@hubradios.com
-- Password: Teste123
-- Hash: SHA-256 hash of "Teste123"
INSERT INTO users (email, password_hash, name, role) 
VALUES (
  'kaike@hubradios.com', 
  'ebdf496f67651cddf6aaa1f0b130f1b99ce9e2e93dc2503d926edcff15aee668',
  'Kaike',
  'master'
);
