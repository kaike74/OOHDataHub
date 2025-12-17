-- Migration number: 0020 	 2024-12-17T21:10:00.000Z
DROP TABLE IF EXISTS proposal_layers;
CREATE TABLE proposal_layers (
    id TEXT PRIMARY KEY,
    id_proposta INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    markers TEXT NOT NULL,
    -- JSON string of markers
    data TEXT,
    -- JSON string of raw row data (for table view)
    visible BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proposta) REFERENCES propostas(id) ON DELETE CASCADE
);
CREATE INDEX idx_proposal_layers_proposta ON proposal_layers(id_proposta);