CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
CREATE INDEX IF NOT EXISTS idx_contas_email ON contas(email);
CREATE INDEX IF NOT EXISTS idx_propostas_cliente ON propostas(id_cliente);
CREATE INDEX IF NOT EXISTS idx_propostas_conta ON propostas(id_conta);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_proposta ON proposta_itens(id_proposta);
CREATE INDEX IF NOT EXISTS idx_proposta_itens_ponto ON proposta_itens(id_ponto);