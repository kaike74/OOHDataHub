-- Add created_by column to propostas table to track creator (Client User ID)
ALTER TABLE propostas
ADD COLUMN created_by INTEGER;