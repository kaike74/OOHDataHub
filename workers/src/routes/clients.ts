
import { Env } from '../index';
import jwt from '@tsndr/cloudflare-worker-jwt';
import { hashPassword, verifyPassword } from '../utils/auth'; // Assumptions on utils

export const handleClients = async (request: Request, env: Env, path: string) => {
    // POST /api/clients/login
    if (path === '/api/clients/login' && request.method === 'POST') {
        const { email, password } = await request.json() as any;

        const stmt = env.DB.prepare('SELECT * FROM client_users WHERE email = ?').bind(email);
        const user = await stmt.first();

        if (!user || !await verifyPassword(password, user.password_hash as string)) {
            return new Response('Invalid credentials', { status: 401 });
        }

        // Generate Token
        const token = await jwt.sign({
            id: user.id,
            client_id: user.client_id,
            role: 'client'
        }, 'SECRET_KEY_ENV'); // Use env var in real app

        return new Response(JSON.stringify({ token, user }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    // POST /api/clients/invite (Requires Agency Auth - handled by middleware or check)
    // For now we assume this is protected by agency token check which we skip for brevity here
    if (path === '/api/clients/invite' && request.method === 'POST') {
        const { client_id, email, name } = await request.json() as any;

        // Mock password gen
        const tempPassword = Math.random().toString(36).slice(-8);
        const passwordHash = await hashPassword(tempPassword);

        try {
            await env.DB.prepare(
                'INSERT INTO client_users (client_id, email, password_hash, name) VALUES (?, ?, ?, ?)'
            ).bind(client_id, email, passwordHash, name).run();

            // In real app: Send Email via Resend/Mailgun
            return new Response(JSON.stringify({
                success: true,
                temp_password: tempPassword,
                message: "User created. Send this password to client."
            }), {
                headers: { 'Content-Type': 'application/json' }
            });

        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500 });
        }
    }

    return new Response('Not found', { status: 404 });
};
