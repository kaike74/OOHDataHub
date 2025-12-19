-- Create Audit Logs table for tracking changes
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (
        action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')
    ),
    changed_by INTEGER,
    -- User ID
    user_type TEXT CHECK (user_type IN ('agency', 'client')),
    changes TEXT,
    -- JSON string of changes
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);