-- Dados de exemplo para testar o sistema
-- Execute após aplicar as migrations

-- Inserir exibidoras de exemplo
INSERT INTO exibidoras (nome, cnpj, razao_social, endereco, email) VALUES
('Clear Channel', '12.345.678/0001-90', 'Clear Channel Brasil Ltda', 'Av. Paulista, 1000 - São Paulo, SP', 'contato@clearchannel.com.br'),
('JCDecaux', '98.765.432/0001-10', 'JCDecaux Brasil S.A.', 'Rua Vergueiro, 2000 - São Paulo, SP', 'vendas@jcdecaux.com.br'),
('Elemidia', '11.222.333/0001-44', 'Elemídia Outdoor Ltda', 'Av. Brigadeiro Faria Lima, 1500 - São Paulo, SP', 'comercial@elemidia.com.br');

-- Inserir pontos de exemplo
INSERT INTO pontos_ooh (codigo_ooh, endereco, latitude, longitude, cidade, uf, id_exibidora, medidas, fluxo, observacoes) VALUES
('OOH-001', 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', -23.5629, -46.6556, 'São Paulo', 'SP', 1, '9x3m', 500000, 'Ponto premium na Paulista'),
('OOH-002', 'Av. Faria Lima, 3477 - Itaim Bibi, São Paulo - SP', -23.5754, -46.6897, 'São Paulo', 'SP', 2, '6x3m', 300000, 'Alto padrão, próximo ao shopping'),
('OOH-003', 'Av. Pres. Juscelino Kubitschek, 1726 - Vila Nova Conceição, SP', -23.5985, -46.6732, 'São Paulo', 'SP', 3, '12x4m', 450000, 'Ponto digital LED'),
('OOH-004', 'R. Augusta, 2690 - Consolação, São Paulo - SP', -23.5545, -46.6631, 'São Paulo', 'SP', 1, '9x3m', 250000, 'Região de bares e restaurantes'),
('OOH-005', 'Av. Rebouças, 3970 - Pinheiros, São Paulo - SP', -23.5679, -46.6911, 'São Paulo', 'SP', 2, '6x3m', 200000, 'Próximo ao metrô');

-- Inserir produtos
INSERT INTO produtos (id_ponto, tipo, valor, periodo) VALUES
(1, 'Outdoor Premium', 8500.00, 'Mensal'),
(2, 'Outdoor Padrão', 6000.00, 'Mensal'),
(3, 'Painel Digital', 12000.00, 'Mensal'),
(4, 'Outdoor Padrão', 5500.00, 'Mensal'),
(5, 'Outdoor Compacto', 4000.00, 'Mensal');

-- Dados inseridos com sucesso!
-- Agora você pode testar o sistema com dados reais
