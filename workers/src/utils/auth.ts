import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Env } from '../index';

// JWT Secret - In production, use environment variable
const JWT_SECRET = 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'master' | 'viewer';
}

export interface JWTPayload {
    userId: number;
    email: string;
    role: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: User): string {
    const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as JWTPayload;
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

    const payload = verifyToken(token);
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
