-- Migration: Fix Broken Foreign Keys (DATA WIPE EDITION)
-- Description: Recreates tables with strict foreign keys.
-- NOTE: Wipes data from proposta_itens and pontos_ooh to resolve FK violations,
-- as authorized by user: "not important" / "just in testing".
-- 1. Wipe old data immediately
DELETE FROM proposta_itens;
DELETE FROM pontos_ooh;
-- 2. Fix proposta_itens
CREATE TABLE proposta_itens_new (
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
-- Copy (0 rows)
INSERT INTO proposta_itens_new (
        id,
        id_proposta,
        id_ooh,
        periodo_inicio,
        periodo_fim,
        valor_locacao,
        valor_papel,
        valor_lona,
        periodo_comercializado,
        observacoes,
        fluxo_diario,
        status,
        client_comment,
        status_validacao,
        approved_until,
        last_validated_by,
        last_validated_at
    )
SELECT id,
    id_proposta,
    id_ooh,
    periodo_inicio,
    periodo_fim,
    valor_locacao,
    valor_papel,
    valor_lona,
    periodo_comercializado,
    observacoes,
    fluxo_diario,
    status,
    client_comment,
    status_validacao,
    approved_until,
    last_validated_by,
    last_validated_at
FROM proposta_itens;
DROP TABLE proposta_itens;
ALTER TABLE proposta_itens_new
    RENAME TO proposta_itens;
-- 3. Fix pontos_ooh
CREATE TABLE pontos_ooh_new (
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
-- Copy (0 rows)
INSERT INTO pontos_ooh_new (
        id,
        codigo_ooh,
        endereco,
        latitude,
        longitude,
        cidade,
        uf,
        id_exibidora,
        medidas,
        fluxo,
        tipo,
        observacoes,
        status,
        created_at,
        updated_at,
        pais,
        created_by,
        updated_by,
        ponto_referencia,
        deleted_at
    )
SELECT id,
    codigo_ooh,
    endereco,
    latitude,
    longitude,
    cidade,
    uf,
    id_exibidora,
    medidas,
    fluxo,
    tipo,
    observacoes,
    status,
    created_at,
    updated_at,
    pais,
    created_by,
    updated_by,
    ponto_referencia,
    deleted_at
FROM pontos_ooh;
DROP TABLE pontos_ooh;
ALTER TABLE pontos_ooh_new
    RENAME TO pontos_ooh;
-- 4. Recreate indices for pontos_ooh
CREATE INDEX idx_pontos_codigo ON pontos_ooh(codigo_ooh);
CREATE INDEX idx_pontos_deleted_at ON pontos_ooh(deleted_at);
CREATE INDEX idx_pontos_exibidora ON pontos_ooh(id_exibidora);
CREATE INDEX idx_pontos_pais ON pontos_ooh(pais);
CREATE INDEX idx_pontos_ponto_referencia ON pontos_ooh(ponto_referencia);
CREATE INDEX idx_pontos_status ON pontos_ooh(status);