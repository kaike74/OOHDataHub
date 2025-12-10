import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { hashPassword, verifyPassword, generateToken, validateEmail } from '../utils/auth';
import { requireAuth } from '../middleware/auth';

export async function handleAuth(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // POST /api/auth/login
    if (request.method === 'POST' && path === '/api/auth/login') {
        try {
            const { email, password } = await request.json() as any;

            if (!email || !password) {
                return new Response(JSON.stringify({ error: 'Email e senha são obrigatórios' }), {
                    status: 400,
                    headers,
                });
            }

            if (!validateEmail(email)) {
                return new Response(JSON.stringify({ error: 'Apenas emails @hubradios.com são permitidos' }), {
                    status: 403,
                    headers,
                });
            }

            // Find user
            const user = await env.DB.prepare(
                'SELECT id, email, password_hash, name, role, status FROM users WHERE email = ?'
            ).bind(email).first() as any;

            if (!user) {
                return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
                    status: 401,
                    headers,
                });
            }

            if (user.status !== 'active') {
                return new Response(JSON.stringify({ error: 'Usuário inativo' }), {
                    status: 403,
                    headers,
                });
            }

            // Verify password
            const isValid = await verifyPassword(password, user.password_hash);
            if (!isValid) {
                return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
                    status: 401,
                    headers,
                });
            }

            // Update last login
            await env.DB.prepare(
                'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(user.id).run();

            // Generate token
            const token = await generateToken(user.id, user.email, user.role);

            return new Response(JSON.stringify({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }
            }), { headers });

        } catch (error: any) {
            console.error('Login error:', error);
            return new Response(JSON.stringify({ error: 'Erro ao fazer login' }), {
                status: 500,
                headers,
            });
        }
    }

    // GET /api/auth/me
    if (request.method === 'GET' && path === '/api/auth/me') {
        try {
            const authUser = await requireAuth(request, env);

            const user = await env.DB.prepare(
                'SELECT id, email, name, role, last_login FROM users WHERE id = ?'
            ).bind(authUser.userId).first() as any;

            return new Response(JSON.stringify(user), { headers });

        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 401,
                headers,
            });
        }
    }

    // POST /api/auth/change-password
    if (request.method === 'POST' && path === '/api/auth/change-password') {
        try {
            const authUser = await requireAuth(request, env);
            const { currentPassword, newPassword } = await request.json() as any;

            if (!currentPassword || !newPassword) {
                return new Response(JSON.stringify({ error: 'Senhas são obrigatórias' }), {
                    status: 400,
                    headers,
                });
            }

            if (newPassword.length < 6) {
                return new Response(JSON.stringify({ error: 'Nova senha deve ter no mínimo 6 caracteres' }), {
                    status: 400,
                    headers,
                });
            }

            // Get current password hash
            const user = await env.DB.prepare(
                'SELECT password_hash FROM users WHERE id = ?'
            ).bind(authUser.userId).first() as any;

            // Verify current password
            const isValid = await verifyPassword(currentPassword, user.password_hash);
            if (!isValid) {
                return new Response(JSON.stringify({ error: 'Senha atual incorreta' }), {
                    status: 401,
                    headers,
                });
            }

            // Hash new password
            const newHash = await hashPassword(newPassword);

            // Update password
            await env.DB.prepare(
                'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(newHash, authUser.userId).run();

            return new Response(JSON.stringify({ success: true }), { headers });

        } catch (error: any) {
            console.error('Change password error:', error);
            return new Response(JSON.stringify({ error: error.message || 'Erro ao trocar senha' }), {
                status: error.message.includes('Unauthorized') ? 401 : 500,
                headers,
            });
        }
    }

    // POST /api/auth/logout
    if (request.method === 'POST' && path === '/api/auth/logout') {
        // Client-side will remove token
        return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers,
    });
}
