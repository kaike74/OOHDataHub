-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    logo_r2_key TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de Contas (Agências/Empresas que acessam propostas)
CREATE TABLE IF NOT EXISTS contas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- Tabela de Propostas
CREATE TABLE IF NOT EXISTS propostas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente INTEGER NOT NULL,
    id_conta INTEGER,
    nome TEXT NOT NULL,
    comissao TEXT NOT NULL CHECK (comissao IN ('V2', 'V3', 'V4')),
    status TEXT DEFAULT 'rascunho' CHECK (
        status IN (
            'rascunho',
            'enviada',
            'aprovada',
            'rejeitada',
            'editada_cliente'
        )
    ),
    editado_por TEXT,
    editado_em DATETIME,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cliente) REFERENCES clientes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_conta) REFERENCES contas(id) ON DELETE
    SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE
    SET NULL
);
-- Tabela de Itens da Proposta (Carrinho)
CREATE TABLE IF NOT EXISTS proposta_itens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    id_proposta INTEGER NOT NULL,
    id_ponto INTEGER NOT NULL,
    periodo_inicio DATE NOT NULL,
    periodo_fim DATE NOT NULL,
    valor_locacao DECIMAL(10, 2) NOT NULL,
    valor_papel DECIMAL(10, 2) DEFAULT 0,
    valor_lona DECIMAL(10, 2) DEFAULT 0,
    periodo_comercializado TEXT NOT NULL CHECK (
        periodo_comercializado IN ('bissemanal', 'mensal')
    ),
    quantidade_periodos INTEGER,
    total_investimento DECIMAL(10, 2),
    fluxo_diario INTEGER,
    total_impactos INTEGER,
    observacoes TEXT,
    ponto_referencia TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_proposta) REFERENCES propostas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE RESTRICT
);
-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_contas_email ON contas(email);
CREATE INDEX IF NOT EXISTS idx_propostas_cliente ON propostas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_propostas_conta ON propostas(id_conta);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_proposta ON proposta_itens(id_proposta);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_ponto ON proposta_itens(id_ponto);
-- Adicionar campo ponto_referencia aos pontos OOH
ALTER TABLE pontos_ooh
ADD COLUMN ponto_referencia TEXT;
CREATE INDEX IF NOT EXISTS idx_pontos_ponto_referencia ON pontos_ooh(ponto_referencia);