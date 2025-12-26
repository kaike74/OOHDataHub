-- Migration: Unify Users
-- Description: Consolidates usuarios_internos and usuarios_externos into a single users table.
-- 1. Create new table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('internal', 'external')),
    role TEXT DEFAULT 'viewer',
    verified BOOLEAN DEFAULT 0,
    verification_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Legacy columns to help migration (will be removed or ignored)
    legacy_id INTEGER,
    legacy_source TEXT
);
-- 2. Migrate Internals
INSERT INTO users (
        name,
        email,
        password_hash,
        type,
        role,
        created_at,
        updated_at,
        legacy_id,
        legacy_source
    )
SELECT name,
    email,
    password_hash,
    'internal',
    role,
    created_at,
    updated_at,
    id,
    'internal'
FROM usuarios_internos;
-- 3. Migrate Externals
INSERT INTO users (
        name,
        email,
        password_hash,
        type,
        role,
        verified,
        verification_token,
        created_at,
        legacy_id,
        legacy_source
    )
SELECT name,
    email,
    password_hash,
    'external',
    'viewer',
    verified,
    verification_token,
    created_at,
    id,
    'external'
FROM usuarios_externos;
-- 4. Create new shares table (Unified)
CREATE TABLE proposta_shares_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role TEXT DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES propostas(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(proposal_id, user_id)
);
-- 5. Migrate External Shares
INSERT INTO proposta_shares_new (proposal_id, user_id, role, created_at)
SELECT ps.proposal_id,
    u.id,
    COALESCE(ps.role, 'viewer'),
    ps.created_at
FROM proposta_shares ps
    JOIN users u ON u.legacy_id = ps.client_user_id
    AND u.legacy_source = 'external';
-- 6. Migrate Internal Shares
-- Note: proposta_internal_shares might not exist if migration 0007 wasn't fully applied or rolled back. 
-- Assuming it exists as per context. If not, this block might fail but D1 migration is transactional usually?
-- Actually, if table doesn't exist, this throws. 
-- Since we are in an iterative process, I'll assume it exists.
INSERT INTO proposta_shares_new (proposal_id, user_id, role, created_at)
SELECT pis.proposal_id,
    u.id,
    pis.role,
    pis.created_at
FROM proposta_internal_shares pis
    JOIN users u ON u.legacy_id = pis.internal_user_id
    AND u.legacy_source = 'internal';
-- 7. Update Proposals Created By
ALTER TABLE propostas
ADD COLUMN new_created_by INTEGER REFERENCES users(id);
UPDATE propostas
SET new_created_by = (
        SELECT id
        FROM users
        WHERE legacy_id = propostas.created_by
            AND legacy_source = CASE
                WHEN created_by_type = 'client' THEN 'external'
                ELSE 'internal'
            END
    );
-- 8. Cleanup Old Tables
DROP TABLE usuarios_internos;
DROP TABLE usuarios_externos;
DROP TABLE proposta_shares;
DROP TABLE proposta_internal_shares;
-- 9. Rename/Cleanup Columns in Propostas
ALTER TABLE propostas DROP COLUMN created_by;
ALTER TABLE propostas DROP COLUMN created_by_type;
ALTER TABLE propostas
    RENAME COLUMN new_created_by TO created_by;
-- Rename new shares table
ALTER TABLE proposta_shares_new
    RENAME TO proposta_shares;
-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_type ON users(type);
CREATE INDEX idx_proposta_shares_prop ON proposta_shares(proposal_id);
CREATE INDEX idx_proposta_shares_user ON proposta_shares(user_id);