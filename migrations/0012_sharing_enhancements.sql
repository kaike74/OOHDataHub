-- Migration 0012: Sharing System Enhancements
-- Adds plan field to users, creates notifications table, and optimizes indexes
-- Add plan column to users table (for external users)
ALTER TABLE users
ADD COLUMN plan TEXT DEFAULT 'Gratuito';
-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    -- 'access_request', 'access_granted', 'share_invite', 'validation_request', 'proposal_approved'
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
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_proposta_shares_proposal_user ON proposta_shares(proposal_id, user_id);
CREATE INDEX IF NOT EXISTS idx_proposta_access_requests_proposal ON proposta_access_requests(proposal_id);
-- Add validation status fields to propostas table
ALTER TABLE propostas
ADD COLUMN validation_status TEXT DEFAULT 'none';
-- 'none', 'pending', 'validated', 'approved'
ALTER TABLE propostas
ADD COLUMN validation_requested_at DATETIME;
ALTER TABLE propostas
ADD COLUMN validation_requested_by INTEGER;
ALTER TABLE propostas
ADD COLUMN validated_at DATETIME;
ALTER TABLE propostas
ADD COLUMN validated_by INTEGER;
ALTER TABLE propostas
ADD COLUMN approved_at DATETIME;
ALTER TABLE propostas
ADD COLUMN approved_by INTEGER;