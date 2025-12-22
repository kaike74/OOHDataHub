-- Migration: Sync with production schema
-- Generated from sqlite_master dump
-- Tables
CREATE TABLE "usuarios_internos" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reset_token TEXT,
    reset_token_expires DATETIME
);
CREATE TABLE "usuarios_externos" (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    verified BOOLEAN DEFAULT 0,
    verification_token TEXT
);
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    logo_r2_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    logo_url TEXT
);
CREATE TABLE exibidoras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    razao_social TEXT,
    endereco TEXT,
    telefone TEXT,
    email TEXT,
    logo_r2_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    observacoes TEXT
);
CREATE TABLE "pontos_ooh" (
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
    created_by INTEGER REFERENCES "usuarios_internos"(id),
    updated_by INTEGER REFERENCES "usuarios_internos"(id),
    ponto_referencia TEXT,
    deleted_at DATETIME,
    FOREIGN KEY (id_exibidora) REFERENCES exibidoras(id) ON DELETE
    SET NULL
);
CREATE TABLE "arquivos" (
    IDArquivo INTEGER PRIMARY KEY AUTOINCREMENT,
    ExibidoraID INTEGER,
    Titulo TEXT NOT NULL,
    Arquivo TEXT NOT NULL,
    Observacoes TEXT,
    FOREIGN KEY (ExibidoraID) REFERENCES "exibidoras"(id)
);
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    table_name TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL CHECK (
        action IN ('CREATE', 'UPDATE', 'DELETE', 'RESTORE')
    ),
    changed_by INTEGER,
    user_type TEXT CHECK (user_type IN ('agency', 'client')),
    changes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
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
CREATE TABLE historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ponto INTEGER NOT NULL,
    campo_alterado TEXT NOT NULL,
    valor_anterior TEXT,
    valor_novo TEXT,
    usuario TEXT DEFAULT 'sistema',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE CASCADE
);
CREATE TABLE imagens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ponto INTEGER NOT NULL,
    nome_arquivo TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    eh_capa BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE CASCADE
);
CREATE TABLE produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_ponto INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    valor REAL NOT NULL,
    periodo TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE CASCADE
);
CREATE TABLE propostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER,
    nome TEXT NOT NULL,
    comissao TEXT,
    status TEXT DEFAULT 'rascunho',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    public_token TEXT,
    created_by INTEGER,
    deleted_at DATETIME,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);
CREATE TABLE proposal_layers (
    id TEXT PRIMARY KEY,
    id_proposta INTEGER NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    markers TEXT NOT NULL,
    data TEXT,
    visible BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proposta) REFERENCES propostas(id) ON DELETE CASCADE
);
CREATE TABLE proposta_access_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    user_type TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proposal_id, user_id, user_type)
);
CREATE TABLE proposta_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_by INTEGER,
    created_by_type TEXT,
    token TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proposal_id, email)
);
CREATE TABLE proposta_itens (
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
    FOREIGN KEY (id_proposta) REFERENCES propostas(id),
    FOREIGN KEY (id_ooh) REFERENCES pontos_ooh(id)
);
CREATE TABLE proposta_shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL,
    client_user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES propostas(id) ON DELETE CASCADE,
    FOREIGN KEY (client_user_id) REFERENCES "usuarios_externos"(id) ON DELETE CASCADE,
    UNIQUE(proposal_id, client_user_id)
);
-- Indices
CREATE INDEX idx_access_requests_proposal ON proposta_access_requests(proposal_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_clientes_nome ON clientes(nome);
CREATE INDEX idx_historico_data ON historico(created_at);
CREATE INDEX idx_historico_ponto ON historico(id_ponto);
CREATE INDEX idx_imagens_capa ON imagens(id_ponto, eh_capa);
CREATE INDEX idx_imagens_ponto ON imagens(id_ponto);
CREATE INDEX idx_pontos_codigo ON pontos_ooh(codigo_ooh);
CREATE INDEX idx_pontos_deleted_at ON pontos_ooh(deleted_at);
CREATE INDEX idx_pontos_exibidora ON pontos_ooh(id_exibidora);
CREATE INDEX idx_pontos_pais ON pontos_ooh(pais);
CREATE INDEX idx_pontos_ponto_referencia ON pontos_ooh(ponto_referencia);
CREATE INDEX idx_pontos_status ON pontos_ooh(status);
CREATE INDEX idx_produtos_ponto ON produtos(id_ponto);
CREATE INDEX idx_produtos_tipo ON produtos(tipo);
CREATE INDEX idx_proposal_layers_proposta ON proposal_layers(id_proposta);
CREATE INDEX idx_proposta_invites_email ON proposta_invites(email);
CREATE INDEX idx_proposta_invites_token ON proposta_invites(token);
CREATE INDEX idx_proposta_shares_prop ON proposta_shares(proposal_id);
CREATE INDEX idx_proposta_shares_user ON proposta_shares(client_user_id);
CREATE INDEX idx_propostas_deleted_at ON propostas(deleted_at);
CREATE INDEX idx_propostas_status ON propostas(status);
CREATE INDEX idx_users_email ON "usuarios_internos"(email);