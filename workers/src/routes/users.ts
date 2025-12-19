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
    User,
    generateClientToken,
    ClientUser
} from '../utils/auth';

export async function handleUsers(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    try {
        // POST /api/auth/setup - Initial setup (only works if no users exist)
        if (request.method === 'POST' && path === '/api/auth/setup') {
            // Check if any users exist
            const existingUsers = await env.DB.prepare(
                'SELECT COUNT(*) as count FROM usuarios_internos'
            ).first() as { count: number } | null;

            if (existingUsers && existingUsers.count > 0) {
                return new Response(JSON.stringify({ error: 'Setup already completed' }), {
                    status: 403,
                    headers,
                });
            }

            // Create master user
            const masterEmail = 'kaike@hubradios.com';
            const masterPassword = 'Teste123';
            const passwordHash = await hashPassword(masterPassword);

            await env.DB.prepare(
                'INSERT INTO usuarios_internos (email, password_hash, name, role) VALUES (?, ?, ?, ?)'
            ).bind(masterEmail, passwordHash, 'Kaike Master', 'master').run();

            return new Response(JSON.stringify({
                success: true,
                message: 'Master user created successfully',
                email: masterEmail,
            }), {
                status: 201,
                headers,
            });
        }

        // POST /api/auth/login - Login
        if (request.method === 'POST' && path === '/api/auth/login') {
            const { email, password } = await request.json() as { email: string; password: string };

            if (!email || !password) {
                return new Response(JSON.stringify({ error: 'Email and password required' }), {
                    status: 400,
                    headers,
                });
            }

            // Validate email domain
            if (!validateEmailDomain(email)) {
                return new Response(JSON.stringify({ error: 'Only @hubradios.com emails are allowed' }), {
                    status: 403,
                    headers,
                });
            }

            // Find user in INTERNAL users table
            const user = await env.DB.prepare(
                'SELECT id, email, password_hash, name, role FROM usuarios_internos WHERE email = ?'
            ).bind(email).first() as any;

            if (user) {
                // Verify password
                const isValid = await verifyPassword(password, user.password_hash);
                if (!isValid) {
                    return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
                        status: 401,
                        headers,
                    });
                }

                // Generate token
                const token = await generateToken({
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                });

                return new Response(JSON.stringify({
                    token,
                    user: {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                    },
                }), { headers });
            }

            // If not found in internal users, check CLIENT users
            const clientUser = await env.DB.prepare(
                'SELECT id, name, email, password_hash FROM usuarios_externos WHERE email = ?'
            ).bind(email).first() as any;

            if (clientUser) {
                const isValid = await verifyPassword(password, clientUser.password_hash);
                if (!isValid) {
                    return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
                        status: 401,
                        headers,
                    });
                }

                // Generate Client Token
                const token = await generateClientToken({
                    id: clientUser.id,
                    name: clientUser.name,
                    email: clientUser.email,
                    role: 'client'
                });

                return new Response(JSON.stringify({
                    token,
                    user: {
                        id: clientUser.id,
                        email: clientUser.email,
                        name: clientUser.name,
                        role: 'client'
                    },
                }), { headers });
            }

            return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), {
                status: 401,
                headers,
            });
        }

        // POST /api/auth/change-password - Change own password
        if (request.method === 'POST' && path === '/api/auth/change-password') {
            const user = await requireAuth(request, env);
            const { currentPassword, newPassword } = await request.json() as {
                currentPassword: string;
                newPassword: string;
            };

            if (!currentPassword || !newPassword) {
                return new Response(JSON.stringify({ error: 'Current and new password required' }), {
                    status: 400,
                    headers,
                });
            }

            // Get user with password hash
            const userWithHash = await env.DB.prepare(
                'SELECT password_hash FROM usuarios_internos WHERE id = ?'
            ).bind(user.id).first() as any;

            // Verify current password
            const isValid = await verifyPassword(currentPassword, userWithHash.password_hash);
            if (!isValid) {
                return new Response(JSON.stringify({ error: 'Current password is incorrect' }), {
                    status: 401,
                    headers,
                });
            }

            // Hash new password
            const newHash = await hashPassword(newPassword);

            // Update password
            await env.DB.prepare(
                'UPDATE usuarios_internos SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(newHash, user.id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // POST /api/auth/forgot-password - Request password reset
        if (request.method === 'POST' && path === '/api/auth/forgot-password') {
            const { email } = await request.json() as { email: string };

            if (!email) {
                return new Response(JSON.stringify({ error: 'Email required' }), {
                    status: 400,
                    headers,
                });
            }

            // Validate email domain
            if (!validateEmailDomain(email)) {
                return new Response(JSON.stringify({ error: 'Only @hubradios.com emails are allowed' }), {
                    status: 403,
                    headers,
                });
            }

            // Find user
            const user = await env.DB.prepare(
                'SELECT id FROM usuarios_internos WHERE email = ?'
            ).bind(email).first() as any;

            // Always return success to prevent email enumeration
            if (!user) {
                return new Response(JSON.stringify({
                    success: true,
                    message: 'If the email exists, a reset link will be sent'
                }), { headers });
            }

            // Generate reset token
            const resetToken = generateResetToken();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

            // Save token to database
            await env.DB.prepare(
                'UPDATE usuarios_internos SET reset_token = ?, reset_token_expires = ? WHERE id = ?'
            ).bind(resetToken, expiresAt.toISOString(), user.id).run();

            // Send password reset email
            try {
                await sendPasswordResetEmail(env, email, resetToken);
            } catch (error) {
                console.error('Error sending reset email:', error);
                // Don't fail the request if email fails
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'If the email exists, a reset link will be sent'
            }), { headers });
        }

        // POST /api/auth/reset-password - Reset password with token
        if (request.method === 'POST' && path === '/api/auth/reset-password') {
            const { token, newPassword } = await request.json() as {
                token: string;
                newPassword: string;
            };

            if (!token || !newPassword) {
                return new Response(JSON.stringify({ error: 'Token and new password required' }), {
                    status: 400,
                    headers,
                });
            }

            if (newPassword.length < 6) {
                return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), {
                    status: 400,
                    headers,
                });
            }

            // Find user with valid token
            const user = await env.DB.prepare(
                'SELECT id FROM usuarios_internos WHERE reset_token = ? AND reset_token_expires > ?'
            ).bind(token, new Date().toISOString()).first() as any;

            if (!user) {
                return new Response(JSON.stringify({ error: 'Invalid or expired reset token' }), {
                    status: 400,
                    headers,
                });
            }

            // Hash new password
            const passwordHash = await hashPassword(newPassword);

            // Update password and clear reset token
            await env.DB.prepare(
                'UPDATE usuarios_internos SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(passwordHash, user.id).run();

            return new Response(JSON.stringify({
                success: true,
                message: 'Password reset successfully'
            }), { headers });
        }

        // GET /api/users/me - Get current user
        if (request.method === 'GET' && path === '/api/users/me') {
            const user = await requireAuth(request, env);
            return new Response(JSON.stringify(user), { headers });
        }

        // GET /api/users - List all users (Master only)
        if (request.method === 'GET' && path === '/api/users') {
            await requireMaster(request, env);

            const { results } = await env.DB.prepare(
                'SELECT id, email, name, role, created_at FROM usuarios_internos ORDER BY created_at DESC'
            ).all();

            return new Response(JSON.stringify(results), { headers });
        }

        // POST /api/users/invite - Invite new user (Master only)
        if (request.method === 'POST' && path === '/api/users/invite') {
            await requireMaster(request, env);

            const { email, role } = await request.json() as {
                email: string;
                role?: string;
            };

            if (!email) {
                return new Response(JSON.stringify({ error: 'Email required' }), {
                    status: 400,
                    headers,
                });
            }

            // Validate email domain
            if (!validateEmailDomain(email)) {
                return new Response(JSON.stringify({ error: 'Only @hubradios.com emails are allowed' }), {
                    status: 403,
                    headers,
                });
            }

            // Check if user already exists
            const existing = await env.DB.prepare(
                'SELECT id FROM usuarios_internos WHERE email = ?'
            ).bind(email).first();

            if (existing) {
                return new Response(JSON.stringify({ error: 'User already exists' }), {
                    status: 409,
                    headers,
                });
            }

            // Generate default password (user will change it)
            const defaultPassword = 'HubRadios123!';
            const passwordHash = await hashPassword(defaultPassword);

            // Insert user
            const result = await env.DB.prepare(
                'INSERT INTO usuarios_internos (email, password_hash, role) VALUES (?, ?, ?)'
            ).bind(email, passwordHash, role || 'viewer').run();

            // Send welcome email
            try {
                await sendWelcomeEmail(env, email, defaultPassword);
            } catch (error) {
                console.error('Error sending welcome email:', error);
                // Don't fail the request if email fails
            }

            return new Response(JSON.stringify({
                success: true,
                userId: result.meta.last_row_id,
                message: 'Usuário criado! Um email foi enviado com as credenciais de acesso.',
            }), {
                status: 201,
                headers,
            });
        }

        // PATCH /api/users/:id/role - Update user role (Master only)
        if (request.method === 'PATCH' && path.match(/^\/api\/users\/\d+\/role$/)) {
            const currentUser = await requireMaster(request, env);
            const userId = parseInt(path.split('/')[3]);

            // Prevent changing your own role
            if (userId === currentUser.id) {
                return new Response(JSON.stringify({ error: 'Cannot change your own role' }), {
                    status: 400,
                    headers,
                });
            }

            const { role } = await request.json() as { role: string };

            // Validate role
            if (!['master', 'editor', 'viewer'].includes(role)) {
                return new Response(JSON.stringify({ error: 'Invalid role. Must be master, editor, or viewer' }), {
                    status: 400,
                    headers,
                });
            }

            // Check if user exists
            const userExists = await env.DB.prepare(
                'SELECT id FROM usuarios_internos WHERE id = ?'
            ).bind(userId).first();

            if (!userExists) {
                return new Response(JSON.stringify({ error: 'User not found' }), {
                    status: 404,
                    headers,
                });
            }

            // Update role
            await env.DB.prepare(
                'UPDATE usuarios_internos SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
            ).bind(role, userId).run();

            return new Response(JSON.stringify({
                success: true,
                message: 'User role updated successfully'
            }), { headers });
        }

        // DELETE /api/users/:id - Delete user (Master only)
        if (request.method === 'DELETE' && path.match(/^\/api\/users\/\d+$/)) {
            const currentUser = await requireMaster(request, env);
            const userId = parseInt(path.split('/').pop()!);

            // Prevent deleting yourself
            if (userId === currentUser.id) {
                return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
                    status: 400,
                    headers,
                });
            }

            await env.DB.prepare('DELETE FROM usuarios_internos WHERE id = ?').bind(userId).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers,
        });
    } catch (error: any) {
        console.error('Error in handleUsers:', error);

        // Handle authentication errors
        if (error.message.includes('token') || error.message.includes('permissions')) {
            return new Response(JSON.stringify({ error: error.message }), {
                status: 401,
                headers,
            });
        }

        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
            status: 500,
            headers,
        });
    }
}
