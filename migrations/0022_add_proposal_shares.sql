-- Link between Proposals and Client Users
CREATE TABLE IF NOT EXISTS proposta_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    client_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES propostas(id) ON DELETE CASCADE,
    FOREIGN KEY (client_user_id) REFERENCES client_users(id) ON DELETE CASCADE,
    UNIQUE(proposal_id, client_user_id)
);
-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_proposta_shares_user ON proposta_shares(client_user_id);
CREATE INDEX IF NOT EXISTS idx_proposta_shares_prop ON proposta_shares(proposal_id);