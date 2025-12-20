-- Migration 0029: Proposal Access Requests
-- Allow users to request access to a proposal
CREATE TABLE IF NOT EXISTS proposta_access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    -- The user requesting access (can be internal or client, usually client)
    user_type TEXT NOT NULL,
    -- 'client' or 'internal'
    status TEXT DEFAULT 'pending',
    -- pending, approved, rejected
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proposal_id, user_id, user_type)
);
CREATE INDEX IF NOT EXISTS idx_access_requests_proposal ON proposta_access_requests(proposal_id);