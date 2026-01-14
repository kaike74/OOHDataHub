-- Migration number: 0006 	 2026-01-14T19:30:00.000Z
-- Add selected_periods column to proposta_itens to store non-contiguous selections logic
ALTER TABLE proposta_itens
ADD COLUMN selected_periods TEXT;