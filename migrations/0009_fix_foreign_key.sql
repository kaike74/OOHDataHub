-- Migration 0009: Corrigir Foreign Key de pontos_ooh
-- A tabela pontos_ooh foi criada com FK apontando para exibidoras_backup_legacy
-- Precisamos recriar a tabela com a FK correta

-- 1. Criar tabela temporária com estrutura correta
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
  FOREIGN KEY (id_exibidora) REFERENCES exibidoras(id) ON DELETE SET NULL
);

-- 2. Copiar dados da tabela antiga para a nova
INSERT INTO pontos_ooh_new 
SELECT * FROM pontos_ooh;

-- 3. Dropar tabela antiga
DROP TABLE pontos_ooh;

-- 4. Renomear tabela nova
ALTER TABLE pontos_ooh_new RENAME TO pontos_ooh;

-- 5. Recriar índices
CREATE INDEX IF NOT EXISTS idx_pontos_codigo ON pontos_ooh(codigo_ooh);
CREATE INDEX IF NOT EXISTS idx_pontos_exibidora ON pontos_ooh(id_exibidora);
CREATE INDEX IF NOT EXISTS idx_pontos_status ON pontos_ooh(status);
