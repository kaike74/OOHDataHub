-- Migration 0017: Adicionar fluxo_diario em proposta_itens
-- Armazena o fluxo diário do ponto no momento da adição ao carrinho
-- Isso garante que os cálculos de impacto sejam consistentes mesmo se o ponto for atualizado
ALTER TABLE proposta_itens
ADD COLUMN fluxo_diario INTEGER;