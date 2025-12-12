-- Migration: Add Cloudflare Images support
-- Description: Add columns to store Cloudflare Images IDs alongside R2 keys
-- This enables automatic image optimization while keeping R2 as backup

-- Add cf_image_id to imagens table
ALTER TABLE imagens ADD COLUMN cf_image_id TEXT;

-- Add cf_logo_id to exibidoras table
ALTER TABLE exibidoras ADD COLUMN cf_logo_id TEXT;

-- Create index for faster lookups by Cloudflare Image ID
CREATE INDEX IF NOT EXISTS idx_imagens_cf_image_id ON imagens(cf_image_id);
CREATE INDEX IF NOT EXISTS idx_exibidoras_cf_logo_id ON exibidoras(cf_logo_id);
