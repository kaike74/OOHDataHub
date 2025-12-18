
import { Env } from '../index';
import {
    hashPassword,
    verifyPassword,
    sendClientWelcomeEmail,
    requireAuth,
    generateClientToken,
    ClientUser
} from '../utils/auth';

import { corsHeaders } from '../utils/cors';

export const handleClients = async (request: Request, env: Env, path: string) => {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/clients - List ALL client users (Requires Agency Auth)
    if (path === '/api/clients' && request.method === 'GET') {
        try {
            await requireAuth(request, env);
            const { results } = await env.DB.prepare(`
                SELECT cu.id, cu.name, cu.email, cu.created_at, cu.last_login, c.nome as client_name
                FROM client_users cu
                JOIN clientes c ON cu.client_id = c.id
                ORDER BY cu.created_at DESC
            `).all();
            return new Response(JSON.stringify(results), { headers });
        } catch (e: any) {
            console.error(e);
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // POST /api/clients/login - Public endpoint for client login
    if (path === '/api/clients/login' && request.method === 'POST') {
        const { email, password } = await request.json() as any;

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers });
        }

        const stmt = env.DB.prepare('SELECT * FROM client_users WHERE email = ?').bind(email);
        const user = await stmt.first();

        if (!user || !await verifyPassword(password, user.password_hash as string)) {
            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401, headers });
        }

        // Generate Token using consistent auth helper
        const clientUser: ClientUser = {
            id: user.id as number,
            client_id: user.client_id as number,
            name: user.name as string,
            email: user.email as string,
            role: 'client'
        };

        const token = await generateClientToken(clientUser);

        // Update last login
        await env.DB.prepare('UPDATE client_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();

        return new Response(JSON.stringify({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                client_id: user.client_id
            }
        }), {
            headers
        });
    }

    // POST /api/clients/register - Register a new client user (Requires Agency Auth)
    if (path === '/api/clients/register' && request.method === 'POST') {
        try {
            await requireAuth(request, env); // Agency user only

            const { client_id, email, name } = await request.json() as any;

            if (!client_id || !email || !name) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
            }

            // Check if email exists
            const existing = await env.DB.prepare('SELECT id FROM client_users WHERE email = ?').bind(email).first();
            if (existing) {
                return new Response(JSON.stringify({ error: 'Email já cadastrado' }), { status: 409, headers });
            }

            // Generate password: Name + 4 digits
            // Remove spaces from name for the password part
            const cleanName = name.replace(/\s+/g, '').slice(0, 10); // First 10 chars of name
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const generatedPassword = `${cleanName}${randomDigits}`;

            const passwordHash = await hashPassword(generatedPassword);

            const result = await env.DB.prepare(
                'INSERT INTO client_users (client_id, email, password_hash, name) VALUES (?, ?, ?, ?)'
            ).bind(client_id, email, passwordHash, name).run();

            // Send Email
            // Send Email
            await sendClientWelcomeEmail(env, email, generatedPassword);


            return new Response(JSON.stringify({
                success: true,
                message: "Usuário criado. Credenciais enviadas por email.",
                userId: result.meta.last_row_id
            }), {
                headers
            });

        } catch (e: any) {
            console.error(e);
            return new Response(JSON.stringify({ error: e.message || 'Error registering client' }), { status: 500, headers });
        }
    }

    // GET /api/clients/by-client/:clientId - List users for a client (Requires Agency Auth)
    if (path.startsWith('/api/clients/by-client/') && request.method === 'GET') {
        try {
            await requireAuth(request, env);

            const clientId = path.split('/').pop();

            const { results } = await env.DB.prepare(
                'SELECT id, name, email, created_at, last_login FROM client_users WHERE client_id = ? ORDER BY created_at DESC'
            ).bind(clientId).all();

            return new Response(JSON.stringify(results), { headers });
        } catch (e: any) {
            console.error(e);
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // GET /api/admin/accounts - List ALL client users with stats (Requires Agency Auth)
    if (path === '/api/admin/accounts' && request.method === 'GET') {
        try {
            await requireAuth(request, env);
            const { results } = await env.DB.prepare(`
                SELECT cu.id, cu.name, cu.email, cu.created_at, cu.last_login, c.nome as client_name, c.id as client_id,
                (SELECT COUNT(*) FROM proposta_shares ps WHERE ps.client_user_id = cu.id) as shared_count
                FROM client_users cu
                LEFT JOIN clientes c ON cu.client_id = c.id
                ORDER BY cu.created_at DESC
            `).all();
            return new Response(JSON.stringify(results), { headers });
        } catch (e: any) {
            console.error(e);
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // GET /api/admin/accounts/:id/shares - List proposals shared with specific user
    if (path.match(/\/api\/admin\/accounts\/\d+\/shares/) && request.method === 'GET') {
        try {
            await requireAuth(request, env);
            const userId = path.split('/')[4];
            const { results } = await env.DB.prepare(`
                SELECT ps.id as share_id, p.id as proposal_id, p.nome as proposal_name, p.created_at, p.status
                FROM proposta_shares ps
                JOIN propostas p ON ps.proposal_id = p.id
                WHERE ps.client_user_id = ?
                ORDER BY p.created_at DESC
            `).bind(userId).all();
            return new Response(JSON.stringify(results), { headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // DELETE /api/admin/accounts/:id - Delete user and their shares
    if (path.match(/\/api\/admin\/accounts\/\d+$/) && request.method === 'DELETE') {
        try {
            await requireAuth(request, env);
            const userId = path.split('/')[4];

            // Delete shares first
            await env.DB.prepare('DELETE FROM proposta_shares WHERE client_user_id = ?').bind(userId).run();
            // Delete user
            const res = await env.DB.prepare('DELETE FROM client_users WHERE id = ?').bind(userId).run();

            if (res.meta.changes === 0) {
                return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers });
            }

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // POST /api/admin/accounts/:id/reset - Reset password
    if (path.match(/\/api\/admin\/accounts\/\d+\/reset/) && request.method === 'POST') {
        try {
            await requireAuth(request, env);
            const userId = path.split('/')[4];

            // Get user info for email
            const user = await env.DB.prepare('SELECT * FROM client_users WHERE id = ?').bind(userId).first();
            if (!user) {
                return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers });
            }

            // Generate new password
            const cleanName = (user.name as string).replace(/\s+/g, '').slice(0, 10);
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const newPassword = `${cleanName}${randomDigits}`;

            const passwordHash = await hashPassword(newPassword);

            await env.DB.prepare('UPDATE client_users SET password_hash = ? WHERE id = ?')
                .bind(passwordHash, userId)
                .run();

            // Send Email
            await sendClientWelcomeEmail(env, user.email as string, newPassword);

            return new Response(JSON.stringify({ success: true, message: 'Senha resetada e enviada por e-mail' }), { headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // DELETE /api/admin/shares/:id - Delete a share
    if (path.match(/\/api\/admin\/shares\/\d+$/) && request.method === 'DELETE') {
        try {
            await requireAuth(request, env);
            const shareId = path.split('/')[4];
            await env.DB.prepare('DELETE FROM proposta_shares WHERE id = ?').bind(shareId).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
};
