-- Migration to remove stricter CHECK constraint on propostas.comissao
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;
-- 1. Rename existing table
ALTER TABLE propostas
    RENAME TO propostas_old;
-- 2. Create new table without the CHECK constraint on comissao
CREATE TABLE propostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER,
    nome TEXT NOT NULL,
    comissao TEXT,
    -- Constraint removed to allow 'CLIENT' and future types
    status TEXT DEFAULT 'rascunho',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);
-- 3. Copy data
INSERT INTO propostas (
        id,
        id_cliente,
        nome,
        comissao,
        status,
        created_at
    )
SELECT id,
    id_cliente,
    nome,
    comissao,
    status,
    created_at
FROM propostas_old;
-- 4. Drop old table
DROP TABLE propostas_old;
COMMIT;
PRAGMA foreign_keys = on;