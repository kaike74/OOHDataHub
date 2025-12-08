-- Migration 0004: Cleanup Legacy Backups
-- Criado em: 2025-12-08

DROP TABLE IF EXISTS exibidoras_backup_legacy;
DROP TABLE IF EXISTS ooh_backup_legacy;
DROP TABLE IF EXISTS produtos_backup_legacy;
DROP TABLE IF EXISTS imagens_backup_legacy;
DROP TABLE IF EXISTS historico_backup_legacy;
