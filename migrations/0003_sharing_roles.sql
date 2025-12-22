-- Add role to proposta_shares
ALTER TABLE proposta_shares
ADD COLUMN role TEXT DEFAULT 'viewer';
-- Add public_access_level to propostas
ALTER TABLE propostas
ADD COLUMN public_access_level TEXT DEFAULT 'none';
-- 'none', 'view'