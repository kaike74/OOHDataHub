import { Env } from '../index';
import { sendPasswordResetEmail } from './email';

/**
 * Queue message types
 */
export enum QueueMessageType {
    PASSWORD_RESET_EMAIL = 'password_reset_email',
    AUDIT_LOG = 'audit_log',
}

/**
 * Queue message payload interfaces
 */
export interface PasswordResetEmailPayload {
    type: QueueMessageType.PASSWORD_RESET_EMAIL;
    email: string;
    resetToken: string;
}

export interface AuditLogPayload {
    type: QueueMessageType.AUDIT_LOG;
    pontoId: number;
    campo: string;
    valorAntigo: string | null;
    valorNovo: string;
    usuario: string;
}

export type QueueMessage = PasswordResetEmailPayload | AuditLogPayload;

/**
 * Process queue message based on type
 */
export async function processQueueMessage(message: QueueMessage, env: Env): Promise<void> {
    console.log('Processing queue message:', message.type);

    switch (message.type) {
        case QueueMessageType.PASSWORD_RESET_EMAIL:
            await processPasswordResetEmail(message, env);
            break;

        case QueueMessageType.AUDIT_LOG:
            await processAuditLog(message, env);
            break;

        default:
            console.warn('Unknown message type:', (message as any).type);
    }
}

/**
 * Process password reset email
 */
async function processPasswordResetEmail(
    message: PasswordResetEmailPayload,
    env: Env
): Promise<void> {
    try {
        await sendPasswordResetEmail(env, message.email, message.resetToken);
        console.log('Password reset email sent to:', message.email);
    } catch (error) {
        console.error('Failed to send password reset email:', error);
        throw error; // Re-throw to trigger retry
    }
}

/**
 * Process audit log entry
 */
async function processAuditLog(message: AuditLogPayload, env: Env): Promise<void> {
    try {
        const stmt = env.DB.prepare(`
            INSERT INTO historico (id_ponto, campo, valor_antigo, valor_novo, usuario, data_alteracao)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
        `);

        await stmt.bind(
            message.pontoId,
            message.campo,
            message.valorAntigo,
            message.valorNovo,
            message.usuario
        ).run();

        console.log('Audit log created for ponto:', message.pontoId);
    } catch (error) {
        console.error('Failed to create audit log:', error);
        throw error; // Re-throw to trigger retry
    }
}

/**
 * Enqueue a message to the queue
 */
export async function enqueueMessage(env: Env, message: QueueMessage): Promise<void> {
    try {
        await env.QUEUE.send(message);
        console.log('Message enqueued:', message.type);
    } catch (error) {
        console.error('Failed to enqueue message:', error);
        // Don't throw - we don't want to fail the request if queue is down
    }
}
