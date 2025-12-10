import bcrypt from 'bcryptjs';
import jwt from '@tsndr/cloudflare-worker-jwt';

const JWT_SECRET = 'ooh-system-secret-key-change-in-production'; // TODO: Move to env variable

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

export async function generateToken(userId: number, email: string, role: string): Promise<string> {
    return await jwt.sign({
        userId,
        email,
        role,
        exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
    }, JWT_SECRET);
}

export async function verifyToken(token: string): Promise<any> {
    try {
        const isValid = await jwt.verify(token, JWT_SECRET);
        if (!isValid) return null;
        return jwt.decode(token);
    } catch (error) {
        return null;
    }
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return false;
    return email.endsWith('@hubradios.com');
}

export function generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
