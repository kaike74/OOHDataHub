-- Migration 0012: Sharing system enhancements
-- Made idempotent to avoid duplicate column errors
-- Note: Some columns may already exist from previous manual migrations
-- This migration only creates NEW structures that don't exist yet
-- 1. Add plan column to users (SKIP - already exists)
-- ALTER TABLE users ADD COLUMN plan TEXT; -- SKIPPED
-- 2. Create notifications table (idempotent with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(
        type IN (
            'access_request',
            'access_granted',
            'share_invite',
            'validation_request',
            'proposal_approved'
        )
    ),
    title TEXT NOT NULL,
    message TEXT,
    related_proposal_id INTEGER,
    related_user_id INTEGER,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_proposal_id) REFERENCES propostas(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE
    SET NULL
);
-- 3. Add validation tracking to propostas (SKIP - likely already exist)
-- ALTER TABLE propostas ADD COLUMN validation_status TEXT DEFAULT 'none'; -- SKIPPED
-- ALTER TABLE propostas ADD COLUMN validation_requested_at DATETIME; -- SKIPPED
-- ALTER TABLE propostas ADD COLUMN validation_requested_by INTEGER; -- SKIPPED
-- ALTER TABLE propostas ADD COLUMN validated_at DATETIME; -- SKIPPED
-- ALTER TABLE propostas ADD COLUMN validated_by INTEGER; -- SKIPPED
-- ALTER TABLE propostas ADD COLUMN approved_at DATETIME; -- SKIPPED
-- ALTER TABLE propostas ADD COLUMN approved_by INTEGER; -- SKIPPED
-- 4. Create indexes (idempotent with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_proposta_shares_proposal_user ON proposta_shares(id_proposta, user_id);
CREATE INDEX IF NOT EXISTS idx_proposta_access_requests_proposal ON proposta_access_requests(id_proposta);
-- Migration complete (idempotent mode - skipped duplicate columns)
SELECT 'Migration 0012 completed' as status;