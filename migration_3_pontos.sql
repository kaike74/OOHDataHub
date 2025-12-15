ALTER TABLE pontos_ooh
ADD COLUMN ponto_referencia TEXT;
CREATE INDEX IF NOT EXISTS idx_pontos_ponto_referencia ON pontos_ooh(ponto_referencia);