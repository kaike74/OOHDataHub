import * as jose from 'jose';
import { Env } from '../index';

// JWT Secret - In production, use environment variable
const JWT_SECRET = new TextEncoder().encode('your-secret-key-change-in-production');
const JWT_EXPIRES_IN = '7d';

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'master' | 'viewer';
}

export interface CustomJWTPayload {
    userId: number;
    email: string;
    role: string;
}

/**
 * Hash a password using Web Crypto API (SHA-256)
 */
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

/**
 * Generate a JWT token for a user
 */
export async function generateToken(user: User): Promise<string> {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    return await new jose.SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
export async function verifyToken(token: string): Promise<CustomJWTPayload | null> {
    try {
        const { payload } = await jose.jwtVerify(token, JWT_SECRET);
        return payload as unknown as CustomJWTPayload;
    } catch (error) {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Middleware to require authentication
 * Returns user if authenticated, throws error otherwise
 */
export async function requireAuth(request: Request, env: Env): Promise<User> {
    const token = extractToken(request);

    if (!token) {
        throw new Error('No token provided');
    }

    const payload = await verifyToken(token);
    if (!payload) {
        throw new Error('Invalid token');
    }

    // Fetch user from database
    const user = await env.DB.prepare(
        'SELECT id, email, name, role FROM users WHERE id = ?'
    ).bind(payload.userId).first() as User | null;

    if (!user) {
        throw new Error('User not found');
    }

    return user;
}

/**
 * Middleware to require master role
 */
export async function requireMaster(request: Request, env: Env): Promise<User> {
    const user = await requireAuth(request, env);

    if (user.role !== 'master') {
        throw new Error('Insufficient permissions');
    }

    return user;
}

/**
 * Validate email domain
 */
export function validateEmailDomain(email: string): boolean {
    return email.endsWith('@hubradios.com');
}
