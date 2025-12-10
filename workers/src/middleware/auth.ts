import { Env } from '../index';
import { verifyToken } from '../utils/auth';

export interface AuthUser {
    userId: number;
    email: string;
    role: string;
}

export async function requireAuth(request: Request, env: Env): Promise<AuthUser> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error('Unauthorized: No token provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await verifyToken(token);

    if (!decoded) {
        throw new Error('Unauthorized: Invalid token');
    }

    // Verify user still exists and is active
    const user = await env.DB.prepare(
        'SELECT id, email, role, status FROM users WHERE id = ? AND status = ?'
    ).bind(decoded.payload.userId, 'active').first();

    if (!user) {
        throw new Error('Unauthorized: User not found or inactive');
    }

    return {
        userId: decoded.payload.userId,
        email: decoded.payload.email,
        role: decoded.payload.role
    };
}

export async function requireRole(request: Request, env: Env, allowedRoles: string[]): Promise<AuthUser> {
    const user = await requireAuth(request, env);

    if (!allowedRoles.includes(user.role)) {
        throw new Error('Forbidden: Insufficient permissions');
    }

    return user;
}

export function isMaster(user: AuthUser): boolean {
    return user.role === 'master';
}
