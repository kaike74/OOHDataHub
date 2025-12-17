-- Migration number: 0021 	 2024-12-17T22:30:00.000Z
ALTER TABLE proposal_layers
ADD COLUMN config TEXT;
-- JSON: { addressCols: [], nameCol: '' }