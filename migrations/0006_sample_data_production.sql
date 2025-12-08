-- Migration 0006: Dados de Exemplo para Produção
-- Criado em: 2025-12-08

-- Inserir exibidoras de exemplo (se não existirem)
INSERT OR IGNORE INTO exibidoras (id, nome, cnpj) VALUES 
  (1, 'Clear Channel', '12.345.678/0001-90'),
  (2, 'JCDecaux', '98.765.432/0001-10'),
  (3, 'Eletromidia', '11.222.333/0001-44');

-- Inserir pontos de exemplo (se não existirem)
INSERT OR IGNORE INTO pontos_ooh (id, codigo_ooh, endereco, latitude, longitude, cidade, uf, id_exibidora, medidas, fluxo) VALUES
  (1, 'OOH-001', 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', -23.5629, -46.6544, 'São Paulo', 'SP', 1, '9x3m', 50000),
  (2, 'OOH-002', 'Av. Faria Lima, 2000 - Pinheiros, São Paulo - SP', -23.5745, -46.6889, 'São Paulo', 'SP', 2, '6x3m', 35000),
  (3, 'OOH-003', 'Av. Rebouças, 3000 - Pinheiros, São Paulo - SP', -23.5651, -46.6734, 'São Paulo', 'SP', 3, '12x4m', 45000);

-- Inserir produtos de exemplo
INSERT OR IGNORE INTO produtos (id_ponto, tipo, valor, periodo) VALUES
  (1, 'Outdoor', 5000.00, 'Mensal'),
  (2, 'Digital', 8000.00, 'Mensal'),
  (3, 'Backlight', 6500.00, 'Mensal');
