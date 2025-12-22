-- Migration number: 0002 	 2025-12-22T21:03:00.000Z
ALTER TABLE proposta_itens
ADD COLUMN last_validated_by INTEGER REFERENCES usuarios_internos(id);
ALTER TABLE proposta_itens
ADD COLUMN last_validated_at DATETIME;