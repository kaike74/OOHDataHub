import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { hashPassword, validateEmail, generateRandomPassword } from '../utils/auth';
import { requireRole } from '../middleware/auth';

export async function handleUsers(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/users - List all users (master only)
    if (request.method === 'GET' && path === '/api/users') {
        try {
            await requireRole(request, env, ['master']);

            const { results } = await env.DB.prepare(`
                SELECT 
                    u.id, u.email, u.name, u.role, u.status, u.created_at, u.last_login,
                    inviter.name as invited_by_name
                FROM users u
                LEFT JOIN users inviter ON u.invited_by = inviter.id
                ORDER BY u.created_at DESC
            `).all();

            return new Response(JSON.stringify(results), { headers });

        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: error.message.includes('Forbidden') ? 403 : 401,
                headers,
            });
        }
    }

    // POST /api/users/invite - Invite new user (master only)
    if (request.method === 'POST' && path === '/api/users/invite') {
        try {
            const authUser = await requireRole(request, env, ['master']);
            const { email, name, role } = await request.json() as any;

            if (!email || !name || !role) {
                return new Response(JSON.stringify({ error: 'Email, nome e nível são obrigatórios' }), {
                    status: 400,
                    headers,
                });
            }

            if (!validateEmail(email)) {
                return new Response(JSON.stringify({ error: 'Apenas emails @hubradios.com são permitidos' }), {
                    status: 400,
                    headers,
                });
            }

            if (!['master', 'manager', 'editor', 'viewer'].includes(role)) {
                return new Response(JSON.stringify({ error: 'Nível inválido' }), {
                    status: 400,
                    headers,
                });
            }

            // Check if user already exists
            const existing = await env.DB.prepare(
                'SELECT id FROM users WHERE email = ?'
            ).bind(email).first();

            if (existing) {
                return new Response(JSON.stringify({ error: 'Usuário já existe' }), {
                    status: 409,
                    headers,
                });
            }

            // Generate random password
            const tempPassword = generateRandomPassword();
            const passwordHash = await hashPassword(tempPassword);

            // Insert user
            const result = await env.DB.prepare(`
                INSERT INTO users (email, password_hash, name, role, status, invited_by)
                VALUES (?, ?, ?, ?, 'pending', ?)
            `).bind(email, passwordHash, name, role, authUser.userId).run();

            // TODO: Send email with temporary password
            console.log(`Temporary password for ${email}: ${tempPassword}`);

            return new Response(JSON.stringify({
                success: true,
                userId: result.meta.last_row_id,
                tempPassword // In production, this should be sent via email only
            }), {
                status: 201,
                headers,
            });

        } catch (error: any) {
            console.error('Invite user error:', error);
            return new Response(JSON.stringify({ error: error.message || 'Erro ao convidar usuário' }), {
                status: error.message.includes('Forbidden') ? 403 : 500,
                headers,
            });
        }
    }

    // PUT /api/users/:id - Update user (master only)
    if (request.method === 'PUT' && path.match(/^\/api\/users\/\d+$/)) {
        try {
            await requireRole(request, env, ['master']);
            const id = path.split('/').pop();
            const { name, role, status } = await request.json() as any;

            const updates: string[] = [];
            const params: any[] = [];

            if (name) {
                updates.push('name = ?');
                params.push(name);
            }
            if (role && ['master', 'manager', 'editor', 'viewer'].includes(role)) {
                updates.push('role = ?');
                params.push(role);
            }
            if (status && ['active', 'pending', 'inactive'].includes(status)) {
                updates.push('status = ?');
                params.push(status);
            }

            if (updates.length === 0) {
                return new Response(JSON.stringify({ error: 'Nenhum campo para atualizar' }), {
                    status: 400,
                    headers,
                });
            }

            updates.push('updated_at = CURRENT_TIMESTAMP');
            params.push(id);

            await env.DB.prepare(`
                UPDATE users SET ${updates.join(', ')} WHERE id = ?
            `).bind(...params).run();

            return new Response(JSON.stringify({ success: true }), { headers });

        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: error.message.includes('Forbidden') ? 403 : 500,
                headers,
            });
        }
    }

    // DELETE /api/users/:id - Delete user (master only)
    if (request.method === 'DELETE' && path.match(/^\/api\/users\/\d+$/)) {
        try {
            await requireRole(request, env, ['master']);
            const id = path.split('/').pop();

            // Don't allow deleting yourself
            const authUser = await requireRole(request, env, ['master']);
            if (authUser.userId.toString() === id) {
                return new Response(JSON.stringify({ error: 'Você não pode deletar sua própria conta' }), {
                    status: 400,
                    headers,
                });
            }

            await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

            return new Response(JSON.stringify({ success: true }), { headers });

        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: error.message.includes('Forbidden') ? 403 : 500,
                headers,
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers,
    });
}
