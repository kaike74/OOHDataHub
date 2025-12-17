-- Client Access
CREATE TABLE IF NOT EXISTS client_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER NOT NULL REFERENCES clientes(id),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
-- Public Token for Proposals (for shareable links)
ALTER TABLE propostas
ADD COLUMN public_token TEXT;
-- Item Status (Approved/Rejected/Pending) and Comments
ALTER TABLE proposta_itens
ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE proposta_itens
ADD COLUMN client_comment TEXT;