import { Env } from '../index';

export interface AuthUser {
    id: number;
    email: string;
    name: string | null;
    picture: string | null;
    role: 'master' | 'viewer';
}

export async function verifyGoogleToken(token: string, env: Env): Promise<any> {
    try {
        // Verify Google OAuth token
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        const data = await response.json();

        // Check if email is from allowed domain
        const email = data.email as string;
        if (!email.endsWith('@hubradios.com')) {
            throw new Error('Email domain not allowed');
        }

        return {
            email: data.email,
            name: data.name,
            picture: data.picture,
            email_verified: data.email_verified
        };
    } catch (error) {
        console.error('Token verification failed:', error);
        throw error;
    }
}

export async function getUserFromEmail(email: string, env: Env): Promise<AuthUser | null> {
    const user = await env.DB.prepare(
        'SELECT id, email, name, picture, role FROM users WHERE email = ?'
    ).bind(email).first();

    if (!user) return null;

    return user as AuthUser;
}

export async function createOrUpdateUser(
    email: string,
    name: string,
    picture: string,
    env: Env
): Promise<AuthUser> {
    // Check if user exists
    let user = await getUserFromEmail(email, env);

    if (user) {
        // Update last login and user info
        await env.DB.prepare(`
      UPDATE users 
      SET name = ?, picture = ?, last_login = CURRENT_TIMESTAMP 
      WHERE email = ?
    `).bind(name, picture, email).run();

        user.name = name;
        user.picture = picture;
        return user;
    }

    // Create new user with viewer role by default
    const result = await env.DB.prepare(`
    INSERT INTO users (email, name, picture, role, last_login)
    VALUES (?, ?, ?, 'viewer', CURRENT_TIMESTAMP)
  `).bind(email, name, picture).run();

    return {
        id: result.meta.last_row_id as number,
        email,
        name,
        picture,
        role: 'viewer'
    };
}

export function requireAuth(request: Request): string | null {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.substring(7);
}

export function requireMaster(user: AuthUser | null): boolean {
    return user?.role === 'master';
}
