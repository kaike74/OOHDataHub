-- Migration: Add pais field to pontos table
-- UF field already exists and will remain optional for countries without states

ALTER TABLE pontos_ooh ADD COLUMN pais TEXT;

-- Update existing Brazilian points with default country
UPDATE pontos_ooh SET pais = 'Brasil' WHERE pais IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pontos_pais ON pontos_ooh(pais);
