-- Migration 0007: Adicionar campo tipo na tabela pontos_ooh
-- Criado em: 2025-12-08

-- Adicionar coluna tipo (pode armazenar múltiplos tipos separados por vírgula)
ALTER TABLE pontos_ooh ADD COLUMN tipo TEXT;
