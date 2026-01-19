export interface Env {
    DB: D1Database;
    R2: R2Bucket;
    KV: KVNamespace;
    ALLOWED_ORIGINS?: string;
    GMAIL_CLIENT_EMAIL?: string;
    GMAIL_PRIVATE_KEY?: string;
    FRONTEND_URL?: string;
}

import { handlePontos } from './routes/pontos';
import { handleExibidoras } from './routes/exibidoras';
import { handleContatos } from './routes/contatos';
import { handleUpload, handleImage, handleUploadLogo, handleUploadClientLogo } from './routes/upload';
import { handleStats } from './routes/stats';
import { handleUsers } from './routes/users';
import { handleClientes } from './routes/clientes';
import { handlePropostas } from './routes/propostas';
import { handleSearch } from './routes/search';
import { handleAIChat } from './routes/ai';
import { handlePublicProposal } from './routes/proposal_public';
import { handlePublicProposalView } from './routes/proposal_public_view';
import { handleClients } from './routes/client_users';
import { handlePortal } from './routes/portal';
import { handleTrash } from './routes/trash';
import { handleNotifications } from './routes/notifications';
import { handleBulkImport } from './routes/bulk-import';
import { corsHeaders, handleOptions } from './utils/cors';

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return handleOptions(request, env);
        }

        try {
            // Auth routes (no authentication required for login)
            if (path.startsWith('/api/auth') || path.startsWith('/api/users')) {
                return await handleUsers(request, env, path);
            }

            // Routes
            if (path.startsWith('/api/pontos')) {
                return await handlePontos(request, env, path);
            }

            if (path.startsWith('/api/exibidoras')) {
                return await handleExibidoras(request, env, path);
            }

            if (path.startsWith('/api/contatos')) {
                return await handleContatos(request, env, path);
            }

            if (path.startsWith('/api/clientes')) {
                return await handleClientes(request, env, path);
            }

            if (path.startsWith('/api/propostas')) {
                return await handlePropostas(request, env, path);
            }

            if (path === '/api/upload') {
                return await handleUpload(request, env);
            }

            if (path === '/api/upload-logo') {
                return await handleUploadLogo(request, env);
            }

            if (path === '/api/upload-client-logo') {
                return await handleUploadClientLogo(request, env);
            }

            if (path.startsWith('/api/images/')) {
                return await handleImage(request, env, path);
            }

            if (path === '/api/stats') {
                return await handleStats(request, env);
            }

            if (path === '/api/search') {
                return await handleSearch(request, env);
            }

            if (path === '/api/ai/chat') {
                return await handleAIChat(request, env);
            }

            // Public Routes (HTML views - must come before API routes)
            if (path.startsWith('/public/') && !path.startsWith('/api/public/')) {
                return await handlePublicProposalView(request, env);
            }

            // Public API Routes (JSON)
            if (path.startsWith('/api/public/proposals/')) {
                return await handlePublicProposal(request, env);
            }

            if (path.startsWith('/api/clients') || path.startsWith('/api/admin')) {
                return await handleClients(request, env, path);
            }

            if (path.startsWith('/api/portal')) {
                return await handlePortal(request, env, path);
            }

            if (path.startsWith('/api/trash')) {
                return await handleTrash(request, env, path);
            }

            if (path.startsWith('/api/bulk-import')) {
                return await handleBulkImport(request, env, path);
            }

            if (path.startsWith('/api/notifications')) {
                return await handleNotifications(request, env, path);
            }

            // Not found
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error:', error);
            return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
                status: 500,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }
    },

    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
        // Cron trigger: 0 0 * * * (Daily)
        console.log('[CRON] Starting daily cleanup...');

        try {
            // Delete proposals older than 30 days in trash
            const resPropostas = await env.DB.prepare(`
                DELETE FROM propostas 
                WHERE deleted_at IS NOT NULL 
                AND deleted_at < datetime('now', '-30 days')
            `).run();

            // Delete points older than 30 days in trash
            const resPoints = await env.DB.prepare(`
                DELETE FROM pontos_ooh 
                WHERE deleted_at IS NOT NULL 
                AND deleted_at < datetime('now', '-30 days')
            `).run();

            console.log(`[CRON] Deleted ${resPropostas.meta.changes} proposals and ${resPoints.meta.changes} points.`);
        } catch (e) {
            console.error('[CRON] Error during cleanup:', e);
        }
    },
};
