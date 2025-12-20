-- Migration 0028: Proposal Sharing & Validation Lifecycle
-- Support for Google Sheets style sharing and validation workflow
-- 1. Create table for pending invites (emails that may or may not exist yet)
CREATE TABLE IF NOT EXISTS proposta_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL REFERENCES propostas(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_by INTEGER,
    -- ID of the user who sent the invite (internal or client)
    created_by_type TEXT,
    -- 'internal' or 'client'
    token TEXT NOT NULL UNIQUE,
    -- For the invite link
    status TEXT DEFAULT 'pending',
    -- pending, accepted
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(proposal_id, email)
);
-- 2. Add Status to Proposals (to track overall lifecycle)
-- RASCUNHO: Draft
-- EM_ANALISE: Pre-approved/Submitted for validation
-- APROVADO: Approved
ALTER TABLE propostas
ADD COLUMN status TEXT DEFAULT 'RASCUNHO';
-- 3. Add Validation fields to Proposal Items
-- status: 'PENDING' (Default), 'VALIDATION' (In check), 'APPROVED' (Valid), 'UNAVAILABLE' (Not available)
-- approved_until: If valid, until when?
ALTER TABLE proposta_itens
ADD COLUMN status_validacao TEXT DEFAULT 'PENDING';
ALTER TABLE proposta_itens
ADD COLUMN approved_until DATETIME;
-- 4. Audit/History for status changes (optional but good)
-- We'll reuse the existing audit_logs or historico if available, or just keep it simple for now.
-- Indexes
CREATE INDEX IF NOT EXISTS idx_proposta_invites_email ON proposta_invites(email);
CREATE INDEX IF NOT EXISTS idx_proposta_invites_token ON proposta_invites(token);
CREATE INDEX IF NOT EXISTS idx_propostas_status ON propostas(status);