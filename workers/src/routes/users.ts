import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import {
    hashPassword,
    verifyPassword,
    generateToken,
    requireAuth,
    requireMaster,
    validateEmailDomain,
    generateResetToken,
    sendPasswordResetEmail,
    sendWelcomeEmail,
    verifyToken,
    sendVerificationEmail
} from '../utils/auth';

export async function handleUsers(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    try {
        // POST /api/auth/setup - Initial setup (only works if no users exist)
        if (request.method === 'POST' && path === '/api/auth/setup') {
            const existingUsers = await env.DB.prepare(
                'SELECT COUNT(*) as count FROM users'
            ).first() as { count: number } | null;

            if (existingUsers && existingUsers.count > 0) {
                return new Response(JSON.stringify({ error: 'Setup already completed' }), { status: 403, headers });
            }

            const masterEmail = 'kaike@hubradios.com';
            const masterPassword = 'Teste123';
            const passwordHash = await hashPassword(masterPassword);

            await env.DB.prepare(
                'INSERT INTO users (email, password_hash, name, type, role, verified) VALUES (?, ?, ?, ?, ?, 1)'
            ).bind(masterEmail, passwordHash, 'Kaike Master', 'internal', 'master').run();

            return new Response(JSON.stringify({
                success: true,
                message: 'Master user created successfully',
                email: masterEmail,
            }), { status: 201, headers });
        }

        // POST /api/auth/login - Unified Login
        if (request.method === 'POST' && path === '/api/auth/login') {
            const { email, password } = await request.json() as { email: string; password: string };

            if (!email || !password) {
                return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400, headers });
            }

            // Find user
            const user = await env.DB.prepare(
                'SELECT id, email, password_hash, name, type, role, verified FROM users WHERE email = ?'
            ).bind(email).first() as any;

            if (user) {
                const isValid = await verifyPassword(password, user.password_hash);
                if (!isValid) {
                    return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401, headers });
                }

                if (!user.verified && user.type === 'external') {
                    return new Response(JSON.stringify({ error: 'Email não verificado.' }), { status: 403, headers });
                }

                // Generate token
                const token = await generateToken({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role, // master, admin, viewer, client
                    type: user.type   // internal, external
                });

                return new Response(JSON.stringify({
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        type: user.type
                    },
                }), { headers });
            }

            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 401, headers });
        }

        // POST /api/auth/signup - External Registration (Self-service)
        if (request.method === 'POST' && path === '/api/auth/signup') {
            let { email, password, name, inviteToken } = await request.json() as any;
            if (email) email = email.toLowerCase().trim();

            if (!email || !password || !name) return new Response(JSON.stringify({ error: 'Todos os campos são obrigatórios' }), { status: 400, headers });
            if (password.length < 6) return new Response(JSON.stringify({ error: 'A senha deve ter pelo menos 6 caracteres' }), { status: 400, headers });

            const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
            if (existing) return new Response(JSON.stringify({ error: 'Email já cadastrado' }), { status: 409, headers });

            const passwordHash = await hashPassword(password);

            // Generate verification token
            const array = new Uint8Array(32);
            crypto.getRandomValues(array);
            const verificationToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

            const result = await env.DB.prepare(
                'INSERT INTO users (email, password_hash, name, type, role, verified, verification_token) VALUES (?, ?, ?, ?, ?, 0, ?)'
            ).bind(email, passwordHash, name, 'external', 'viewer', verificationToken).run();

            const userId = result.meta.last_row_id;

            // Handle Invite Token if present (Legacy support or new invite system?)
            // Assuming inviteToken logic maps to proposals, similar to clients.ts
            if (inviteToken) {
                // Logic to link invite to user if needed. 
                // For now, consistent with unified users, invites should be checked by email mostly.
                // But if we want to support token directly:
                // TODO: check invite token
            }

            // Check for pending invites by email
            const invites = await env.DB.prepare('SELECT * FROM proposta_invites WHERE LOWER(email) = ? AND status = "pending"').bind(email).all();
            if (invites.results.length > 0) {
                const batch = [];
                for (const invite of invites.results) {
                    batch.push(env.DB.prepare('INSERT OR IGNORE INTO proposta_shares (proposal_id, user_id, role) VALUES (?, ?, ?)').bind(invite.proposal_id, userId, invite.role || 'viewer'));
                    batch.push(env.DB.prepare('UPDATE proposta_invites SET status = "accepted" WHERE id = ?').bind(invite.id));
                }
                try {
                    await env.DB.batch(batch);
                } catch (e) {
                    console.error('Error processing invites:', e);
                }
            }

            // Send Verification Email
            try {
                await sendVerificationEmail(env, email, verificationToken);
            } catch (e) {
                console.error('Error sending verification email:', e);
            }

            return new Response(JSON.stringify({
                success: true,
                message: "Conta criada! Verifique seu email para ativar."
            }), { headers });
        }

        // POST /api/auth/verify-email
        if (request.method === 'POST' && path === '/api/auth/verify-email') {
            const { token } = await request.json() as any;
            if (!token) return new Response(JSON.stringify({ error: 'Token required' }), { status: 400, headers });

            const user = await env.DB.prepare('SELECT * FROM users WHERE verification_token = ?').bind(token).first();
            if (!user) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400, headers });

            await env.DB.prepare('UPDATE users SET verified = 1, verification_token = NULL WHERE id = ?').bind(user.id).run();

            // Auto-login
            const userToken = await generateToken({
                id: user.id as number,
                email: user.email as string,
                name: user.name as string,
                role: user.role as string,
                type: user.type as 'internal' | 'external'
            });

            return new Response(JSON.stringify({
                success: true,
                token: userToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    type: user.type
                }
            }), { headers });
        }

        // POST /api/auth/forgot-password
        if (request.method === 'POST' && path === '/api/auth/forgot-password') {
            const { email } = await request.json() as any;
            if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers });

            const user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
            if (user) {
                const token = generateResetToken();
                // We need a place to store reset token. users table doesn't have it in migration 0008?
                // Migration 0008 has verification_token. Can we reuse it or did we forget reset_token?
                // Migration 0008 didn't include reset_token explicitly.
                // We can abuse verification_token OR use KV.
                // Let's use verification_token for now as it makes sense (verifying identity).
                await env.DB.prepare('UPDATE users SET verification_token = ? WHERE id = ?').bind(token, user.id).run();
                await sendPasswordResetEmail(env, email, token);
            }
            // Always return success to prevent enumeration
            return new Response(JSON.stringify({ success: true, message: 'Se o email existir, as instruções foram enviadas.' }), { headers });
        }

        // POST /api/auth/reset-password
        if (request.method === 'POST' && path === '/api/auth/reset-password') {
            const { token, newPassword } = await request.json() as any;
            if (!token || !newPassword) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers });

            const user = await env.DB.prepare('SELECT id, email FROM users WHERE verification_token = ?').bind(token).first();
            if (!user) return new Response(JSON.stringify({ error: 'Invalid or expired token' }), { status: 400, headers });

            const hash = await hashPassword(newPassword);
            await env.DB.prepare('UPDATE users SET password_hash = ?, verification_token = NULL WHERE id = ?').bind(hash, user.id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // POST /api/users/invite - Internal Invite (Master/Admin only)
        if (request.method === 'POST' && path === '/api/users/invite') {
            await requireMaster(request, env); // Enforces master check

            const { email, role } = await request.json() as { email: string; role?: string };
            if (!email) return new Response(JSON.stringify({ error: 'Email required' }), { status: 400, headers });

            // Enforce domain check
            if (!validateEmailDomain(email)) {
                return new Response(JSON.stringify({ error: 'Apenas emails @hubradios.com são permitidos para usuários internos.' }), { status: 403, headers });
            }

            const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
            if (existing) return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409, headers });

            const defaultPassword = 'HubRadios123!';
            const passwordHash = await hashPassword(defaultPassword);

            await env.DB.prepare(
                'INSERT INTO users (email, password_hash, type, role, verified) VALUES (?, ?, ?, ?, 1)'
            ).bind(email, passwordHash, 'internal', role || 'viewer').run();

            // Send Welcome Email
            try {
                await sendWelcomeEmail(env, email, defaultPassword);
            } catch (error) {
                console.error('Error sending welcome email:', error);
            }

            return new Response(JSON.stringify({ success: true, message: 'Usuário interno convidado!' }), { status: 201, headers });
        }

        // GET /api/users/me
        if (request.method === 'GET' && path === '/api/users/me') {
            const user = await requireAuth(request, env);
            // requireAuth returns { id, role, ... } from token
            // Fetch full details if needed
            const dbUser: any = await env.DB.prepare('SELECT id, name, email, role, type FROM users WHERE id = ?').bind(user.id).first();
            return new Response(JSON.stringify(dbUser), { headers });
        }

        // POST /api/auth/change-password
        if (request.method === 'POST' && path === '/api/auth/change-password') {
            const user = await requireAuth(request, env);
            const { currentPassword, newPassword } = await request.json() as any;
            if (!currentPassword || !newPassword) return new Response(JSON.stringify({ error: 'Required fields missing' }), { status: 400, headers });

            const userWithHash: any = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?').bind(user.id).first();
            const isValid = await verifyPassword(currentPassword, userWithHash.password_hash);
            if (!isValid) return new Response(JSON.stringify({ error: 'Senha incorreta' }), { status: 401, headers });

            const newHash = await hashPassword(newPassword);
            await env.DB.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(newHash, user.id).run();
            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    } catch (error: any) {
        console.error('Error in handleUsers:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500, headers });
    }
}
