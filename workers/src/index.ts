export interface Env {
    DB: D1Database;
    R2: R2Bucket;
    ALLOWED_ORIGINS?: string;
    GMAIL_CLIENT_EMAIL?: string;
    GMAIL_PRIVATE_KEY?: string;
    FRONTEND_URL?: string;
}

import { handlePontos } from './routes/pontos';
import { handleExibidoras } from './routes/exibidoras';
import { handleContatos } from './routes/contatos';
import { handleUpload, handleImage, handleUploadLogo } from './routes/upload';
import { handleStats } from './routes/stats';
import { handleUsers } from './routes/users';
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

            if (path === '/api/upload') {
                return await handleUpload(request, env);
            }

            if (path === '/api/upload-logo') {
                return await handleUploadLogo(request, env);
            }

            if (path.startsWith('/api/images/')) {
                return await handleImage(request, env, path);
            }

            if (path === '/api/stats') {
                return await handleStats(request, env);
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
};
