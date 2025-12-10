import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { verifyGoogleToken, createOrUpdateUser, getUserFromEmail, requireAuth, requireMaster, AuthUser } from '../middleware/auth';

export async function handleUsers(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // POST /api/auth/google - Login with Google
    if (request.method === 'POST' && path === '/api/auth/google') {
        try {
            const { token } = await request.json() as { token: string };

            // Verify Google token
            const googleUser = await verifyGoogleToken(token, env);

            // Create or update user in database
            const user = await createOrUpdateUser(
                googleUser.email,
                googleUser.name,
                googleUser.picture,
                env
            );

            return new Response(JSON.stringify({
                success: true,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    role: user.role
                }
            }), { headers });
        } catch (error: any) {
            console.error('Google auth error:', error);
            return new Response(JSON.stringify({
                error: error.message || 'Authentication failed'
            }), {
                status: 401,
                headers
            });
        }
    }

    // GET /api/auth/me - Get current user
    if (request.method === 'GET' && path === '/api/auth/me') {
        const token = requireAuth(request);

        if (!token) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), {
                status: 401,
                headers
            });
        }

        try {
            const googleUser = await verifyGoogleToken(token, env);
            const user = await getUserFromEmail(googleUser.email, env);

            if (!user) {
                return new Response(JSON.stringify({ error: 'User not found' }), {
                    status: 404,
                    headers
                });
            }

            return new Response(JSON.stringify({ user }), { headers });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Invalid token' }), {
                status: 401,
                headers
            });
        }
    }

    // GET /api/users - List all users (Master only)
    if (request.method === 'GET' && path === '/api/users') {
        const token = requireAuth(request);

        if (!token) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), {
                status: 401,
                headers
            });
        }

        try {
            const googleUser = await verifyGoogleToken(token, env);
            const currentUser = await getUserFromEmail(googleUser.email, env);

            if (!requireMaster(currentUser)) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers
                });
            }

            const { results } = await env.DB.prepare(`
                SELECT id, email, name, picture, role, created_at, last_login
                FROM users
                ORDER BY created_at DESC
            `).all();

            return new Response(JSON.stringify(results), { headers });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Authentication failed' }), {
                status: 401,
                headers
            });
        }
    }

    // PUT /api/users/:id/role - Update user role (Master only)
    if (request.method === 'PUT' && path.match(/^\/api\/users\/\d+\/role$/)) {
        const token = requireAuth(request);

        if (!token) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), {
                status: 401,
                headers
            });
        }

        try {
            const googleUser = await verifyGoogleToken(token, env);
            const currentUser = await getUserFromEmail(googleUser.email, env);

            if (!requireMaster(currentUser)) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers
                });
            }

            const userId = path.split('/')[3];
            const { role } = await request.json() as { role: string };

            if (!['master', 'viewer'].includes(role)) {
                return new Response(JSON.stringify({ error: 'Invalid role' }), {
                    status: 400,
                    headers
                });
            }

            await env.DB.prepare(`
                UPDATE users SET role = ? WHERE id = ?
            `).bind(role, userId).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Failed to update role' }), {
                status: 500,
                headers
            });
        }
    }

    // DELETE /api/users/:id - Delete user (Master only)
    if (request.method === 'DELETE' && path.match(/^\/api\/users\/\d+$/)) {
        const token = requireAuth(request);

        if (!token) {
            return new Response(JSON.stringify({ error: 'Not authenticated' }), {
                status: 401,
                headers
            });
        }

        try {
            const googleUser = await verifyGoogleToken(token, env);
            const currentUser = await getUserFromEmail(googleUser.email, env);

            if (!requireMaster(currentUser)) {
                return new Response(JSON.stringify({ error: 'Forbidden' }), {
                    status: 403,
                    headers
                });
            }

            const userId = path.split('/')[3];

            // Prevent deleting yourself
            if (parseInt(userId) === currentUser.id) {
                return new Response(JSON.stringify({ error: 'Cannot delete yourself' }), {
                    status: 400,
                    headers
                });
            }

            await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (error) {
            return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
                status: 500,
                headers
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers
    });
}
