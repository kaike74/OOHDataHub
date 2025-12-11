-- Migration: Add password reset functionality and editor role
-- Add columns for password reset tokens and update role enum

ALTER TABLE users ADD COLUMN reset_token TEXT;
ALTER TABLE users ADD COLUMN reset_token_expires DATETIME;

-- Note: SQLite doesn't support ALTER COLUMN, so role is already TEXT
-- The application will enforce the role values: 'master', 'editor', 'viewer'
