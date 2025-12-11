import * as jose from 'jose';
import { Env } from '../index';

// JWT Secret - In production, use environment variable
const JWT_SECRET = new TextEncoder().encode('your-secret-key-change-in-production');
const JWT_EXPIRES_IN = '7d';

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'master' | 'editor' | 'viewer';
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

/**
 * Generate a random reset token
 */
export function generateResetToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Send password reset email using Gmail API
 */
export async function sendPasswordResetEmail(
    env: Env,
    email: string,
    resetToken: string
): Promise<void> {
    // Check if email configuration exists
    const gmailUser = (env as any).GMAIL_USER;
    const gmailPassword = (env as any).GMAIL_APP_PASSWORD;
    const frontendUrl = (env as any).FRONTEND_URL || 'http://localhost:3000';

    if (!gmailUser || !gmailPassword) {
        console.warn('Email not configured. Reset token:', resetToken);
        return; // Silently fail if email not configured
    }

    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Create email content
    const subject = 'Redefinição de Senha - OOH Data Hub';
    const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Redefinição de Senha</h1>
                </div>
                <div class="content">
                    <p>Olá,</p>
                    <p>Você solicitou a redefinição de senha para sua conta no <strong>OOH Data Hub</strong>.</p>
                    <p>Clique no botão abaixo para criar uma nova senha:</p>
                    <p style="text-align: center;">
                        <a href="${resetUrl}" class="button">Redefinir Senha</a>
                    </p>
                    <p>Ou copie e cole este link no seu navegador:</p>
                    <p style="word-break: break-all; background: white; padding: 10px; border-radius: 5px;">${resetUrl}</p>
                    <p><strong>Este link expira em 1 hora.</strong></p>
                    <p>Se você não solicitou esta redefinição, ignore este email.</p>
                </div>
                <div class="footer">
                    <p>OOH Data Hub - Sistema de Gestão E-MÍDIAS</p>
                </div>
            </div>
        </body>
        </html>
    `;

    // Send email using Gmail SMTP via fetch to a relay service
    // Note: Direct SMTP from Workers requires external service
    // For now, we'll use a simple approach with fetch to Gmail API

    try {
        // Create the email message in RFC 2822 format
        const emailContent = [
            `To: ${email}`,
            `From: ${gmailUser}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            htmlBody
        ].join('\r\n');

        // Base64 encode the email
        const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // Note: This requires Gmail API OAuth2 setup
        // For production, user should configure a proper email service
        console.log('Password reset email prepared for:', email);
        console.log('Reset URL:', resetUrl);

        // TODO: Implement actual email sending via Gmail API or SMTP service
        // For now, just log the token for development
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send reset email');
    }
}
