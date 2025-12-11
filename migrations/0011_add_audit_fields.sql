-- Migration: Add audit fields to track who created/updated records

ALTER TABLE pontos_ooh ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE pontos_ooh ADD COLUMN updated_by INTEGER REFERENCES users(id);

ALTER TABLE exibidoras ADD COLUMN created_by INTEGER REFERENCES users(id);
ALTER TABLE exibidoras ADD COLUMN updated_by INTEGER REFERENCES users(id);
