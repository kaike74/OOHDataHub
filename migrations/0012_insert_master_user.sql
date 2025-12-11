-- Inserir usuário master inicial
-- Email: kaike@hubradios.com
-- Senha: Teste123
-- Role: master

INSERT OR IGNORE INTO users (email, password_hash, name, role, created_at, updated_at)
VALUES (
    'kaike@hubradios.com',
    'ebdf496f67651cddf6aaa1f0b130f1b99ce9e2e93dc2503d926edcff15aee668',
    'Kaike Master',
    'master',
    datetime('now'),
    datetime('now')
);
