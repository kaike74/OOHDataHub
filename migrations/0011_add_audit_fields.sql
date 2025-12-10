-- Migration: Add audit fields to pontos_ooh
-- Track who created and last updated each point

ALTER TABLE pontos_ooh ADD COLUMN created_by INTEGER;
ALTER TABLE pontos_ooh ADD COLUMN updated_by INTEGER;

CREATE INDEX idx_pontos_created_by ON pontos_ooh(created_by);
CREATE INDEX idx_pontos_updated_by ON pontos_ooh(updated_by);
