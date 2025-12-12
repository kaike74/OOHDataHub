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
 * Send password reset email using Gmail API with Service Account
 */
export async function sendPasswordResetEmail(
    env: Env,
    email: string,
    resetToken: string
): Promise<void> {
    // Check if email configuration exists
    const gmailClientEmail = (env as any).GMAIL_CLIENT_EMAIL;
    const gmailPrivateKey = (env as any).GMAIL_PRIVATE_KEY;
    const frontendUrl = (env as any).FRONTEND_URL || 'http://localhost:3000';

    if (!gmailClientEmail || !gmailPrivateKey) {
        console.warn('Email not configured. Reset token:', resetToken);
        console.warn('Reset URL would be:', `${frontendUrl}/reset-password?token=${resetToken}`);
        return; // Silently fail if email not configured
    }

    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    try {
        // Create JWT for Gmail API authentication
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = {
            alg: 'RS256',
            typ: 'JWT'
        };

        const jwtClaim = {
            iss: gmailClientEmail,
            scope: 'https://www.googleapis.com/auth/gmail.send',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        // Import private key for signing
        const privateKeyPem = gmailPrivateKey.replace(/\\n/g, '\n');
        const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);

        const cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            {
                name: 'RSASSA-PKCS1-v1_5',
                hash: 'SHA-256',
            },
            false,
            ['sign']
        );

        // Create JWT
        const jwtHeaderB64 = base64UrlEncode(JSON.stringify(jwtHeader));
        const jwtClaimB64 = base64UrlEncode(JSON.stringify(jwtClaim));
        const jwtUnsigned = `${jwtHeaderB64}.${jwtClaimB64}`;

        const signature = await crypto.subtle.sign(
            'RSASSA-PKCS1-v1_5',
            cryptoKey,
            new TextEncoder().encode(jwtUnsigned)
        );

        const jwtSignatureB64 = base64UrlEncode(signature);
        const jwt = `${jwtUnsigned}.${jwtSignatureB64}`;

        // Exchange JWT for access token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type=jwt-bearer&assertion=${jwt}`,
        });

        if (!tokenResponse.ok) {
            throw new Error(`Failed to get access token: ${await tokenResponse.text()}`);
        }

        const { access_token } = await tokenResponse.json() as { access_token: string };

        // Create email content
        const subject = 'Redefinição de Senha - OOH Data Hub';
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ec4899 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
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
</html>`;

        // Create email in RFC 2822 format
        const emailLines = [
            `To: ${email}`,
            `From: ${gmailClientEmail}`,
            `Subject: ${subject}`,
            'MIME-Version: 1.0',
            'Content-Type: text/html; charset=utf-8',
            '',
            htmlBody
        ];
        const rawEmail = emailLines.join('\r\n');

        // Base64url encode the email
        const encodedEmail = base64UrlEncode(rawEmail);

        // Send email via Gmail API
        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                raw: encodedEmail
            }),
        });

        if (!sendResponse.ok) {
            throw new Error(`Failed to send email: ${await sendResponse.text()}`);
        }

        console.log('Password reset email sent successfully to:', email);
    } catch (error) {
        console.error('Error sending email:', error);
        console.error('Reset URL (manual):', resetUrl);
        // Don't throw - fail silently and log the URL
    }
}

/**
 * Helper function to convert PEM to ArrayBuffer
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem
        .replace(/-----BEGIN PRIVATE KEY-----/, '')
        .replace(/-----END PRIVATE KEY-----/, '')
        .replace(/\s/g, '');
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Helper function to base64url encode
 */
function base64UrlEncode(data: string | ArrayBuffer): string {
    let base64: string;

    if (typeof data === 'string') {
        base64 = btoa(unescape(encodeURIComponent(data)));
    } else {
        const bytes = new Uint8Array(data);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        base64 = btoa(binary);
    }

    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}
