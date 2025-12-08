-- Migration 0003: Fix Schema Mismatch & Backup Legacy Data
-- Criado em: 2025-12-08

-- 1. Backup das tabelas antigas (se existirem)
DROP TABLE IF EXISTS exibidoras_backup_legacy;
DROP TABLE IF EXISTS ooh_backup_legacy;
DROP TABLE IF EXISTS produtos_backup_legacy;
DROP TABLE IF EXISTS imagens_backup_legacy;
DROP TABLE IF EXISTS historico_backup_legacy;

ALTER TABLE exibidoras RENAME TO exibidoras_backup_legacy;
ALTER TABLE ooh RENAME TO ooh_backup_legacy;
ALTER TABLE produtos RENAME TO produtos_backup_legacy;
ALTER TABLE imagens RENAME TO imagens_backup_legacy;
ALTER TABLE historico RENAME TO historico_backup_legacy;

-- 2. Recriar Schema Correto (copiado de 0001_initial.sql)

-- Tabela de Exibidoras
CREATE TABLE IF NOT EXISTS exibidoras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE,
  razao_social TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  logo_r2_key TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela principal de Pontos OOH
CREATE TABLE IF NOT EXISTS pontos_ooh (
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
  observacoes TEXT,
  status TEXT DEFAULT 'ativo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_exibidora) REFERENCES exibidoras(id) ON DELETE SET NULL
);

-- Tabela de Imagens dos Pontos
CREATE TABLE IF NOT EXISTS imagens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ponto INTEGER NOT NULL,
  nome_arquivo TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  eh_capa BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE CASCADE
);

-- Tabela de Produtos/Preços
CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ponto INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  valor REAL NOT NULL,
  periodo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE CASCADE
);

-- Tabela de Histórico de Alterações
CREATE TABLE IF NOT EXISTS historico (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ponto INTEGER NOT NULL,
  campo_alterado TEXT NOT NULL,
  valor_anterior TEXT,
  valor_novo TEXT,
  usuario TEXT DEFAULT 'sistema',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE CASCADE
);

-- 3. Reaplicar Índices (de 0002_indexes.sql)
CREATE INDEX IF NOT EXISTS idx_pontos_cidade ON pontos_ooh(cidade);
CREATE INDEX IF NOT EXISTS idx_pontos_uf ON pontos_ooh(uf);
CREATE INDEX IF NOT EXISTS idx_pontos_status ON pontos_ooh(status);
CREATE INDEX IF NOT EXISTS idx_pontos_exibidora ON pontos_ooh(id_exibidora);
CREATE INDEX IF NOT EXISTS idx_pontos_coords ON pontos_ooh(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_imagens_ponto ON imagens(id_ponto);
CREATE INDEX IF NOT EXISTS idx_imagens_capa ON imagens(id_ponto, eh_capa);
CREATE INDEX IF NOT EXISTS idx_produtos_ponto ON produtos(id_ponto);
CREATE INDEX IF NOT EXISTS idx_produtos_tipo ON produtos(tipo);
CREATE INDEX IF NOT EXISTS idx_historico_ponto ON historico(id_ponto);
CREATE INDEX IF NOT EXISTS idx_historico_data ON historico(created_at);

-- 4. Tentativa de Migração de Dados (Best Effort)
-- Tenta copiar ID e Nome das exibidoras antigas se a coluna 'nome' existir
INSERT OR IGNORE INTO exibidoras (id, nome) 
SELECT id, nome FROM exibidoras_backup_legacy;

-- Dados da tabela 'ooh' antiga para 'pontos_ooh' é arriscado copiar automaticamente sem saber o schema.
-- Os dados estão salvos em 'ooh_backup_legacy' para recuperação manual posterior se necessário.
