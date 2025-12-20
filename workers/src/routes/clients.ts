
import { Env } from '../index';
import {
    hashPassword,
    verifyPassword,
    sendClientWelcomeEmail,
    requireAuth,
    generateClientToken,
    verifyToken,
    ClientUser
} from '../utils/auth';

import { corsHeaders } from '../utils/cors';

export const handleClients = async (request: Request, env: Env, path: string) => {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/clients - List ALL client users (Requires Agency Auth OR Client Auth)
    if (path === '/api/clients' && request.method === 'GET') {
        try {
            let isAgency = false;
            let currentClientUser: any = null;

            // Try Agency Auth
            try {
                await requireAuth(request, env);
                isAgency = true;
            } catch (e) {
                // Try Client Auth if Agency failed
                const token = request.headers.get('Authorization')?.replace('Bearer ', '');
                if (token) {
                    const payload = await verifyToken(token);
                    if (payload && payload.role === 'client') {
                        currentClientUser = await env.DB.prepare('SELECT * FROM usuarios_externos WHERE id = ?').bind(payload.userId).first();
                        if (!currentClientUser) throw new Error('User not found');
                    } else {
                        throw new Error('Unauthorized');
                    }
                } else {
                    throw new Error('Unauthorized');
                }
            }

            if (isAgency) {
                // Agency gets everything
                const { results } = await env.DB.prepare(`
                    SELECT cu.id, cu.name, cu.email, cu.created_at, cu.last_login
                    FROM usuarios_externos cu
                    ORDER BY cu.created_at DESC
                `).all();
                return new Response(JSON.stringify(results), { headers });
            } else {
                // Client User gets only themselves (and potentially others from same company if we had that link explicit)
                // For now, to allow "sharing", we might want to return users they have already shared with?
                // Or simply return just themselves so the UI works and they can add new people by email.
                // Returning empty list or just themselves avoids leaking other clients' data.

                const results = [{
                    id: currentClientUser.id,
                    name: currentClientUser.name,
                    email: currentClientUser.email,
                    created_at: currentClientUser.created_at,
                    last_login: currentClientUser.last_login
                }];
                return new Response(JSON.stringify(results), { headers });
            }

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

        const stmt = env.DB.prepare('SELECT * FROM usuarios_externos WHERE email = ?').bind(email);
        const user = await stmt.first();

        if (!user || !await verifyPassword(password, user.password_hash as string)) {
            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401, headers });
        }

        // Generate Token using consistent auth helper
        const clientUser: ClientUser = {
            id: user.id as number,
            name: user.name as string,
            email: user.email as string,
            role: 'client'
        };

        const token = await generateClientToken(clientUser);

        // Update last login
        await env.DB.prepare('UPDATE usuarios_externos SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();

        return new Response(JSON.stringify({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: 'client'
            }
        }), {
            headers
        });
    }

    // POST /api/clients/register - Register a new client user (Requires Agency Auth)
    if (path === '/api/clients/register' && request.method === 'POST') {
        try {
            await requireAuth(request, env); // Agency user only

            const { email, name } = await request.json() as any;

            if (!email || !name) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
            }

            // Check if email exists
            const existing = await env.DB.prepare('SELECT id FROM usuarios_externos WHERE email = ?').bind(email).first();
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
                'INSERT INTO usuarios_externos (email, password_hash, name) VALUES (?, ?, ?)'
            ).bind(email, passwordHash, name).run();

            const userId = result.meta.last_row_id;

            // Check for pending invites and accept them
            const invites = await env.DB.prepare('SELECT * FROM proposta_invites WHERE email = ? AND status = "pending"').bind(email).all();
            if (invites.results.length > 0) {
                const batch = [];
                for (const invite of invites.results) {
                    batch.push(env.DB.prepare('INSERT OR IGNORE INTO proposta_shares (proposal_id, client_user_id) VALUES (?, ?)').bind(invite.proposal_id, userId));
                    batch.push(env.DB.prepare('UPDATE proposta_invites SET status = "accepted" WHERE id = ?').bind(invite.id));
                }
                await env.DB.batch(batch);
            }

            // Send Email
            await sendClientWelcomeEmail(env, email, generatedPassword);


            return new Response(JSON.stringify({
                success: true,
                message: "Usuário criado. Credenciais enviadas por email.",
                userId: userId
            }), {
                headers
            });

        } catch (e: any) {
            console.error(e);
            return new Response(JSON.stringify({ error: e.message || 'Error registering client' }), { status: 500, headers });
        }
    }

    // POST /api/clients/signup - Public Registration
    if (path === '/api/clients/signup' && request.method === 'POST') {
        try {
            const { email, password, name } = await request.json() as any;

            if (!email || !password || !name) {
                return new Response(JSON.stringify({ error: 'Todos os campos são obrigatórios' }), { status: 400, headers });
            }

            if (password.length < 6) {
                return new Response(JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }), { status: 400, headers });
            }

            // Check if email exists
            const existing = await env.DB.prepare('SELECT id FROM usuarios_externos WHERE email = ?').bind(email).first();
            if (existing) {
                return new Response(JSON.stringify({ error: 'Email já cadastrado' }), { status: 409, headers });
            }

            const passwordHash = await hashPassword(password);

            const result = await env.DB.prepare(
                'INSERT INTO usuarios_externos (email, password_hash, name) VALUES (?, ?, ?)'
            ).bind(email, passwordHash, name).run();

            const userId = result.meta.last_row_id;

            // Check for pending invites and accept them automatically
            const invites = await env.DB.prepare('SELECT * FROM proposta_invites WHERE email = ? AND status = "pending"').bind(email).all();

            if (invites.results.length > 0) {
                const batch = [];
                for (const invite of invites.results) {
                    // Create share
                    batch.push(env.DB.prepare('INSERT OR IGNORE INTO proposta_shares (proposal_id, client_user_id) VALUES (?, ?)').bind(invite.proposal_id, userId));
                    // Update invite status
                    batch.push(env.DB.prepare('UPDATE proposta_invites SET status = "accepted" WHERE id = ?').bind(invite.id));
                }
                await env.DB.batch(batch);
            }

            // Generate token for immediate login
            const clientUser: ClientUser = {
                id: userId as number,
                name: name,
                email: email,
                role: 'client'
            };
            const token = await generateClientToken(clientUser);

            return new Response(JSON.stringify({
                success: true,
                token,
                user: clientUser,
                message: "Conta criada com sucesso!"
            }), { headers });

        } catch (e: any) {
            console.error(e);
            return new Response(JSON.stringify({ error: e.message || 'Erro ao criar conta' }), { status: 500, headers });
        }
    }

    // GET /api/clients/by-client/:clientId - List users for a client (Requires Agency Auth)
    if (path.startsWith('/api/clients/by-client/') && request.method === 'GET') {
        try {
            await requireAuth(request, env);

            const clientId = path.split('/').pop();

            // List users who have access to proposals from this client
            // via proposta_shares (not directly linked to client)
            const { results } = await env.DB.prepare(`
                SELECT DISTINCT cu.id, cu.name, cu.email, cu.created_at, cu.last_login
                FROM usuarios_externos cu
                JOIN proposta_shares ps ON cu.id = ps.client_user_id
                JOIN propostas p ON ps.proposal_id = p.id
                WHERE p.id_cliente = ?
                ORDER BY cu.created_at DESC
            `).bind(clientId).all();

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
                SELECT cu.id, cu.name, cu.email, cu.created_at, cu.last_login,
                (SELECT COUNT(*) FROM proposta_shares ps WHERE ps.client_user_id = cu.id) as shared_count
                FROM usuarios_externos cu
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
            const res = await env.DB.prepare('DELETE FROM usuarios_externos WHERE id = ?').bind(userId).run();

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
            const user = await env.DB.prepare('SELECT * FROM usuarios_externos WHERE id = ?').bind(userId).first();
            if (!user) {
                return new Response(JSON.stringify({ error: 'User not found' }), { status: 404, headers });
            }

            // Generate new password
            const cleanName = (user.name as string).replace(/\s+/g, '').slice(0, 10);
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const newPassword = `${cleanName}${randomDigits}`;

            const passwordHash = await hashPassword(newPassword);

            await env.DB.prepare('UPDATE usuarios_externos SET password_hash = ? WHERE id = ?')
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
