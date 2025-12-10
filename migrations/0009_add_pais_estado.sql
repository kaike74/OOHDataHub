-- Migration: Add pais and estado fields to pontos table
-- This allows international points and full state names

ALTER TABLE pontos ADD COLUMN pais TEXT;
ALTER TABLE pontos ADD COLUMN estado TEXT;

-- Update existing Brazilian points with default country
UPDATE pontos SET pais = 'Brasil' WHERE pais IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_pontos_pais ON pontos(pais);
CREATE INDEX IF NOT EXISTS idx_pontos_estado ON pontos(estado);
