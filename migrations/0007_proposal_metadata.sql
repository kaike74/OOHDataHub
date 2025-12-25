-- Add created_by_type to propostas
ALTER TABLE propostas
ADD COLUMN created_by_type TEXT DEFAULT 'agency';
-- Create table for internal shares (Agency Users)
CREATE TABLE proposta_internal_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    internal_user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES propostas(id) ON DELETE CASCADE,
    FOREIGN KEY (internal_user_id) REFERENCES usuarios_internos(id) ON DELETE CASCADE,
    UNIQUE(proposal_id, internal_user_id)
);
CREATE INDEX idx_proposta_internal_shares_prop ON proposta_internal_shares(proposal_id);
CREATE INDEX idx_proposta_internal_shares_user ON proposta_internal_shares(internal_user_id);