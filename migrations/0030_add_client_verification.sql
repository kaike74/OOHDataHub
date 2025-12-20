-- Add verification columns to usuarios_externos
ALTER TABLE usuarios_externos
ADD COLUMN verified BOOLEAN DEFAULT 0;
ALTER TABLE usuarios_externos
ADD COLUMN verification_token TEXT;