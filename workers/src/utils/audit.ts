import { Env } from '../index';

export interface AuditLogEntry {
    tableName: string;
    recordId: number;
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
    changedBy: number;
    userType: 'agency' | 'client';
    changes?: Record<string, any>;
}

export async function logAudit(env: Env, entry: AuditLogEntry) {
    try {
        await env.DB.prepare(`
            INSERT INTO audit_logs (table_name, record_id, action, changed_by, user_type, changes)
            VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
            entry.tableName,
            entry.recordId,
            entry.action,
            entry.changedBy,
            entry.userType,
            entry.changes ? JSON.stringify(entry.changes) : null
        ).run();
    } catch (e) {
        console.error('Failed to create audit log:', e);
        // Don't throw error to avoid blocking the main action
    }
}
