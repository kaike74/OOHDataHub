-- Migration number: 0010 	 2024-12-29T21:40:00.000Z
ALTER TABLE proposal_layers
ADD COLUMN config TEXT DEFAULT '{}';