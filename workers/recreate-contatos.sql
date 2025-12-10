-- Recreate contatos table with correct schema
-- Step 1: Rename old table
ALTER TABLE contatos RENAME TO contatos_old;

-- Step 2: Create new table with correct schema
CREATE TABLE contatos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_exibidora INTEGER NOT NULL,
    nome TEXT,
    telefone TEXT,
    email TEXT,
    observacoes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_exibidora) REFERENCES exibidoras(id)
);

-- Step 3: Copy data from old table (only columns that exist)
INSERT INTO contatos (id, id_exibidora, nome, created_at)
SELECT id, id_exibidora, nome, created_at FROM contatos_old;

-- Step 4: Drop old table
DROP TABLE contatos_old;
