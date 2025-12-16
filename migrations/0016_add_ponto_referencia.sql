-- Migration 0016: Adicionar campo ponto_referencia
-- Adiciona campo para armazenar ponto de referência dos locais OOH
ALTER TABLE pontos_ooh
ADD COLUMN ponto_referencia TEXT;