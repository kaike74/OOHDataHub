-- Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    logo_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Propostas  
CREATE TABLE IF NOT EXISTS propostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER,
    nome TEXT NOT NULL,
    comissao TEXT CHECK (comissao IN ('V2', 'V3', 'V4')),
    status TEXT DEFAULT 'rascunho',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);
-- Itens da Proposta (carrinho)
CREATE TABLE IF NOT EXISTS proposta_itens (
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
    FOREIGN KEY (id_proposta) REFERENCES propostas(id),
    FOREIGN KEY (id_ooh) REFERENCES pontos_ooh(id)
);