-- Migration 0014: Adicionar campo ponto_referencia aos pontos OOH
-- Criado em: 2025-12-15
-- Campo auto-preenchido via Google Places API e editável pelo usuário

ALTER TABLE pontos_ooh ADD COLUMN ponto_referencia TEXT;

-- Criar índice para busca por ponto de referência
CREATE INDEX IF NOT EXISTS idx_pontos_ponto_referencia ON pontos_ooh(ponto_referencia);
