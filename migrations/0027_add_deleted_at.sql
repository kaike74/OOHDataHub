-- Add deleted_at for soft delete
ALTER TABLE propostas
ADD COLUMN deleted_at DATETIME;
ALTER TABLE pontos_ooh
ADD COLUMN deleted_at DATETIME;
CREATE INDEX IF NOT EXISTS idx_propostas_deleted_at ON propostas(deleted_at);
CREATE INDEX IF NOT EXISTS idx_pontos_deleted_at ON pontos_ooh(deleted_at);