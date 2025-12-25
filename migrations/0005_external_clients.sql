-- Migration: Add External Clients Support
-- Description: Adds origin, cnpj, created_by, and other fields to clientes table. Matches requirements for SaaS evolution.
-- 1. Add new columns to clientes table
ALTER TABLE clientes
ADD COLUMN origin TEXT DEFAULT 'internal' CHECK (origin IN ('internal', 'external'));
ALTER TABLE clientes
ADD COLUMN cnpj TEXT;
ALTER TABLE clientes
ADD COLUMN created_by INTEGER;
-- ID of the user (external or internal)
ALTER TABLE clientes
ADD COLUMN segmento TEXT;
ALTER TABLE clientes
ADD COLUMN publico_alvo TEXT;
ALTER TABLE clientes
ADD COLUMN regioes_atuacao TEXT;
ALTER TABLE clientes
ADD COLUMN cidade TEXT;
ALTER TABLE clientes
ADD COLUMN uf TEXT;
ALTER TABLE clientes
ADD COLUMN pacote_id INTEGER;
-- 2. Create Indexes for performance and uniqueness constraints
-- Uniqueness for External Users: CNPJ must be unique per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_external_cnpj ON clientes(cnpj, created_by)
WHERE origin = 'external';
-- Uniqueness for Internal Users: CNPJ should be unique globally for internal records
-- Note: Assuming internal clients are shared globally.
CREATE UNIQUE INDEX IF NOT EXISTS idx_clientes_internal_cnpj ON clientes(cnpj)
WHERE origin = 'internal';
-- Index for filtering by user/origin
CREATE INDEX IF NOT EXISTS idx_clientes_origin_user ON clientes(origin, created_by);