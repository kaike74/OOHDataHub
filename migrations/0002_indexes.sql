-- Migration 0002: Índices para performance
-- Criado em: 2025-12-08

-- Índices para pontos_ooh
CREATE INDEX IF NOT EXISTS idx_pontos_cidade ON pontos_ooh(cidade);
CREATE INDEX IF NOT EXISTS idx_pontos_uf ON pontos_ooh(uf);
CREATE INDEX IF NOT EXISTS idx_pontos_status ON pontos_ooh(status);
CREATE INDEX IF NOT EXISTS idx_pontos_exibidora ON pontos_ooh(id_exibidora);
CREATE INDEX IF NOT EXISTS idx_pontos_coords ON pontos_ooh(latitude, longitude);

-- Índices para imagens
CREATE INDEX IF NOT EXISTS idx_imagens_ponto ON imagens(id_ponto);
CREATE INDEX IF NOT EXISTS idx_imagens_capa ON imagens(id_ponto, eh_capa);

-- Índices para produtos
CREATE INDEX IF NOT EXISTS idx_produtos_ponto ON produtos(id_ponto);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS idx_historico_ponto ON historico(id_ponto);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico(created_at);
