-- Migration: Create users table for authentication
-- Stores user information from Google OAuth

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  picture TEXT,
  role TEXT DEFAULT 'viewer' CHECK(role IN ('master', 'viewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Insert master user (you) - update email after first Google login
-- This will be updated automatically on first login
INSERT INTO users (email, name, role) 
VALUES ('master@hubradios.com', 'Master User', 'master')
ON CONFLICT(email) DO NOTHING;
