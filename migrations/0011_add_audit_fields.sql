-- Migration: Add audit fields to pontos_ooh and exibidoras
-- Track who created and last updated each record

-- Add audit fields to pontos_ooh
ALTER TABLE pontos_ooh ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE pontos_ooh ADD COLUMN updated_by INTEGER REFERENCES users(id);

-- Add audit fields to exibidoras
ALTER TABLE exibidoras ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE exibidoras ADD COLUMN updated_by INTEGER REFERENCES users(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pontos_created_by ON pontos_ooh(created_by);
CREATE INDEX IF NOT EXISTS idx_pontos_updated_by ON pontos_ooh(updated_by);
CREATE INDEX IF NOT EXISTS idx_exibidoras_created_by ON exibidoras(created_by);
CREATE INDEX IF NOT EXISTS idx_exibidoras_updated_by ON exibidoras(updated_by);
