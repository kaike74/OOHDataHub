-- Fix Foreign Keys manually
PRAGMA foreign_keys = OFF;
-- 1. Fix proposta_itens
CREATE TABLE IF NOT EXISTS proposta_itens_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_proposta INTEGER,
    id_ooh INTEGER,
    periodo_inicio DATE,
    periodo_fim DATE,
    valor_locacao DECIMAL(10, 2),
    valor_papel DECIMAL(10, 2),
    valor_lona DECIMAL(10, 2),
    periodo_comercializado TEXT CHECK (
        periodo_comercializado IN ('bissemanal', 'mensal')
    ),
    observacoes TEXT,
    fluxo_diario INTEGER,
    status TEXT DEFAULT 'ativo',
    client_comment TEXT,
    status_validacao TEXT DEFAULT 'PENDING',
    approved_until DATETIME,
    last_validated_by INTEGER REFERENCES users(id),
    last_validated_at DATETIME,
    FOREIGN KEY (id_proposta) REFERENCES propostas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_ooh) REFERENCES pontos_ooh(id)
);
INSERT INTO proposta_itens_new
SELECT *
FROM proposta_itens;
UPDATE proposta_itens_new
SET last_validated_by = (
        SELECT id
        FROM users
        WHERE legacy_id = proposta_itens_new.last_validated_by
            AND legacy_source = 'internal'
    )
WHERE last_validated_by IS NOT NULL;
DROP TABLE proposta_itens;
ALTER TABLE proposta_itens_new
    RENAME TO proposta_itens;
-- 2. Fix pontos_ooh
CREATE TABLE IF NOT EXISTS pontos_ooh_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo_ooh TEXT UNIQUE NOT NULL,
    endereco TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    cidade TEXT,
    uf TEXT,
    id_exibidora INTEGER,
    medidas TEXT,
    fluxo INTEGER,
    tipo TEXT,
    observacoes TEXT,
    status TEXT DEFAULT 'ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    pais TEXT,
    created_by INTEGER REFERENCES users(id),
    updated_by INTEGER REFERENCES users(id),
    ponto_referencia TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (id_exibidora) REFERENCES exibidoras(id) ON DELETE
    SET NULL
);
INSERT INTO pontos_ooh_new
SELECT *
FROM pontos_ooh;
UPDATE pontos_ooh_new
SET created_by = (
        SELECT id
        FROM users
        WHERE legacy_id = pontos_ooh_new.created_by
            AND legacy_source = 'internal'
    )
WHERE created_by IS NOT NULL;
UPDATE pontos_ooh_new
SET updated_by = (
        SELECT id
        FROM users
        WHERE legacy_id = pontos_ooh_new.updated_by
            AND legacy_source = 'internal'
    )
WHERE updated_by IS NOT NULL;
DROP TABLE pontos_ooh;
ALTER TABLE pontos_ooh_new
    RENAME TO pontos_ooh;
PRAGMA foreign_keys = ON;