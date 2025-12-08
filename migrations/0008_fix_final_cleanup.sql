-- Migration 0008: Correção Final - Garantir Schema Limpo
-- Criado em: 2025-12-08
-- Remove qualquer referência a tabelas backup e garante schema correto

-- Verificar se as tabelas principais existem, se não, criar
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
  tipo TEXT,
  observacoes TEXT,
  status TEXT DEFAULT 'ativo',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_exibidora) REFERENCES exibidoras(id) ON DELETE SET NULL
);

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

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_ponto INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  valor REAL NOT NULL,
  periodo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_ponto) REFERENCES pontos_ooh(id) ON DELETE CASCADE
);

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

-- Garantir que não existem tabelas backup
DROP TABLE IF EXISTS exibidoras_backup_legacy;
DROP TABLE IF EXISTS ooh_backup_legacy;
DROP TABLE IF EXISTS produtos_backup_legacy;
DROP TABLE IF EXISTS imagens_backup_legacy;
DROP TABLE IF EXISTS historico_backup_legacy;
