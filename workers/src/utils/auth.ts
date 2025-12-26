import * as jose from 'jose';
import { Env } from '../index';

// JWT Secret - In production, use environment variable
// JWT Secret - In production, use environment variable
const JWT_SECRET = new TextEncoder().encode('your-secret-key-change-in-production');
const JWT_EXPIRES_IN = '7d';

export interface User {
    id: number;
    email: string;
    name: string | null;
    type: 'internal' | 'external';
    role: 'master' | 'editor' | 'viewer' | 'client' | string;
}

// Deprecated but kept for compatibility during refactor if needed, mapped to User
export type ClientUser = User;

export interface CustomJWTPayload {
    userId: number;
    email: string;
    role: string;
    type: 'internal' | 'external';
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
        type: user.type
    };

    return await new jose.SignJWT(payload as any)
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime(JWT_EXPIRES_IN)
        .sign(JWT_SECRET);
}

/**
 * Generate a JWT token for a Client User (Wrapper for backward compat or specific logic)
 */
export async function generateClientToken(user: User): Promise<string> {
    return generateToken(user);
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

    // Find user in unified table
    const user = await env.DB.prepare(
        'SELECT id, email, name, role, type FROM users WHERE id = ?'
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
    return true; // Allow all domains to support client access
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

    console.log('[PASSWORD RESET] Starting email send process...');
    console.log('[PASSWORD RESET] Reset URL:', resetUrl);

    try {
        // Create JWT for Gmail API authentication
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = {
            alg: 'RS256',
            typ: 'JWT'
        };

        // IMPORTANT: Add 'sub' field to impersonate a user from the domain
        // Service Account needs to send email "as" a real user
        const jwtClaim = {
            iss: gmailClientEmail,
            sub: 'emidias@hubradios.com', // User to impersonate - must exist in Google Workspace
            scope: 'https://www.googleapis.com/auth/gmail.send',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        console.log('[PASSWORD RESET] JWT Claim:', { ...jwtClaim, iss: jwtClaim.iss.substring(0, 20) + '...' });

        // Import private key for signing
        console.log('[PASSWORD RESET] Importing private key...');
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
        console.log('[PASSWORD RESET] Private key imported successfully');

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
        console.log('[PASSWORD RESET] Exchanging JWT for access token...');
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `grant_type=urn:ietf:params:oauth:grant-type=jwt-bearer&assertion=${jwt}`,
        });

        const tokenResponseText = await tokenResponse.text();
        console.log('[PASSWORD RESET] Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
            console.error('[PASSWORD RESET] Token error response:', tokenResponseText);
            throw new Error(`Failed to get access token: ${tokenResponseText}`);
        }

        const tokenData = JSON.parse(tokenResponseText);
        const { access_token } = tokenData;
        console.log('[PASSWORD RESET] Access token obtained successfully');

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
        console.log('[PASSWORD RESET] Sending email via Gmail API...');
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

        const sendResponseText = await sendResponse.text();
        console.log('[PASSWORD RESET] Send response status:', sendResponse.status);

        if (!sendResponse.ok) {
            console.error('[PASSWORD RESET] Send error response:', sendResponseText);
            throw new Error(`Failed to send email: ${sendResponseText}`);
        }

        console.log('[PASSWORD RESET] ✅ Email sent successfully to:', email);
    } catch (error) {
        console.error('[PASSWORD RESET] ❌ Error:', error);
        console.error('[PASSWORD RESET] Error details:', {
            name: (error as any).name,
            message: (error as any).message,
            stack: (error as any).stack?.substring(0, 500)
        });
        console.error('[PASSWORD RESET] Manual reset URL:', resetUrl);
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

/**
 * Send welcome email to new user with temporary password
 */
export async function sendWelcomeEmail(
    env: Env,
    email: string,
    temporaryPassword: string
): Promise<void> {
    const gmailClientEmail = (env as any).GMAIL_CLIENT_EMAIL;
    const gmailPrivateKey = (env as any).GMAIL_PRIVATE_KEY;
    const frontendUrl = (env as any).FRONTEND_URL || 'http://localhost:3000';

    if (!gmailClientEmail || !gmailPrivateKey) {
        console.warn('Email not configured. User created with password:', temporaryPassword);
        console.warn('Login URL:', `${frontendUrl}/login`);
        return;
    }

    try {
        console.log('[WELCOME EMAIL] Starting email send process...');

        // Create JWT for Gmail API authentication
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = { alg: 'RS256', typ: 'JWT' };
        const jwtClaim = {
            iss: gmailClientEmail,
            sub: 'emidias@hubradios.com', // User to impersonate
            scope: 'https://www.googleapis.com/auth/gmail.send',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        console.log('[WELCOME EMAIL] Importing private key...');

        const privateKeyPem = gmailPrivateKey.replace(/\\n/g, '\n');
        const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);

        const cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
        );

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

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });

        const tokenResponseText = await tokenResponse.text();
        console.log('[WELCOME EMAIL] Token response status:', tokenResponse.status);

        if (!tokenResponse.ok) {
            console.error('[WELCOME EMAIL] Token error response:', tokenResponseText);
            throw new Error(`Failed to get access token: ${tokenResponseText}`);
        }

        const tokenData = JSON.parse(tokenResponseText);
        const { access_token } = tokenData;
        console.log('[WELCOME EMAIL] Access token obtained successfully');

        // Create welcome email
        const subject = 'Bem-vindo ao OOH Data Hub!';
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ec4899; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ec4899 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fef3c7; padding: 10px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Bem-vindo!</h1>
        </div>
        <div class="content">
            <p>Olá,</p>
            <p>Você foi convidado para acessar o <strong>OOH Data Hub</strong> - Sistema de Gestão E-MÍDIAS.</p>
            
            <div class="credentials">
                <p style="margin: 0 0 10px 0;"><strong>Suas credenciais de acesso:</strong></p>
                <p style="margin: 5px 0;">📧 <strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;">🔑 <strong>Senha temporária:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 14px;">${temporaryPassword}</code></p>
            </div>

            <div class="warning">
                <p style="margin: 0;"><strong>⚠️ Importante:</strong> Por segurança, altere sua senha no primeiro acesso através do menu Configurações.</p>
            </div>

            <p style="text-align: center;">
                <a href="${frontendUrl}/login" class="button">Acessar Sistema</a>
            </p>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Se você tiver alguma dúvida, entre em contato com o administrador do sistema.
            </p>
        </div>
        <div class="footer">
            <p>OOH Data Hub - Sistema de Gestão E-MÍDIAS</p>
        </div>
    </div>
</body>
</html>`;

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
        const encodedEmail = base64UrlEncode(rawEmail);

        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: encodedEmail }),
        });

        const sendResponseText = await sendResponse.text();
        console.log('[WELCOME EMAIL] Send response status:', sendResponse.status);

        if (!sendResponse.ok) {
            console.error('[WELCOME EMAIL] Send error response:', sendResponseText);
            throw new Error(`Failed to send email: ${sendResponseText}`);
        }

        console.log('[WELCOME EMAIL] ✅ Email sent successfully to:', email);
    } catch (error) {
        console.error('[WELCOME EMAIL] ❌ Error:', error);
        console.error('[WELCOME EMAIL] Error details:', {
            name: (error as any).name,
            message: (error as any).message
        });
        console.error('[WELCOME EMAIL] User credentials (manual):', email, temporaryPassword);
    }
}

/**
 * Send welcome email to new CLIENT user with temporary password
 */
export async function sendClientWelcomeEmail(
    env: Env,
    email: string,
    temporaryPassword: string
): Promise<void> {
    const gmailClientEmail = (env as any).GMAIL_CLIENT_EMAIL;
    const gmailPrivateKey = (env as any).GMAIL_PRIVATE_KEY;
    const frontendUrl = (env as any).FRONTEND_URL || 'http://localhost:3000';

    if (!gmailClientEmail || !gmailPrivateKey) {
        console.warn('Email not configured. Client User created with password:', temporaryPassword);
        console.warn('Portal Login URL:', `${frontendUrl}/login`);
        return;
    }

    try {
        console.log('[CLIENT EMAIL] Starting email send process...');

        // Create JWT for Gmail API authentication
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = { alg: 'RS256', typ: 'JWT' };
        const jwtClaim = {
            iss: gmailClientEmail,
            sub: 'emidias@hubradios.com', // User to impersonate
            scope: 'https://www.googleapis.com/auth/gmail.send',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        const privateKeyPem = gmailPrivateKey.replace(/\\n/g, '\n');
        const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);

        const cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
        );

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

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });

        if (!tokenResponse.ok) {
            const tokenResponseText = await tokenResponse.text();
            throw new Error(`Failed to get access token: ${tokenResponseText}`);
        }

        const tokenData = await tokenResponse.json() as any;
        const access_token = tokenData.access_token;

        // Create welcome email
        const subject = 'Acesso ao Portal de Propostas - OOH Data Hub';
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ec4899 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .credentials { background: white; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ec4899; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #ec4899 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Acesso ao Portal</h1>
        </div>
        <div class="content">
            <p>Olá,</p>
            <p>Uma nova conta foi criada para você acessar suas propostas no <strong>OOH Data Hub</strong>.</p>
            
            <div class="credentials">
                <p style="margin: 0 0 10px 0;"><strong>Suas credenciais de acesso:</strong></p>
                <p style="margin: 5px 0;">📧 <strong>Email:</strong> ${email}</p>
                <p style="margin: 5px 0;">🔑 <strong>Senha:</strong> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 3px; font-size: 14px;">${temporaryPassword}</code></p>
            </div>

            <p style="text-align: center;">
                <a href="${frontendUrl}/login" class="button">Acessar Portal</a>
            </p>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
                Use essas credenciais para fazer login e visualizar as propostas compartilhadas com você.
            </p>
        </div>
        <div class="footer">
            <p>OOH Data Hub - Sistema de Gestão E-MÍDIAS</p>
        </div>
    </div>
</body>
</html>`;

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
        const encodedEmail = base64UrlEncode(rawEmail);

        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: encodedEmail }),
        });

        if (!sendResponse.ok) {
            const sendResponseText = await sendResponse.text();
            throw new Error(`Failed to send email: ${sendResponseText}`);
        }

        console.log('[CLIENT EMAIL] ✅ Email sent successfully to:', email);
    } catch (error) {
        console.error('[CLIENT EMAIL] ❌ Error:', error);
        console.error('[CLIENT EMAIL] User credentials (manual):', email, temporaryPassword);
    }
}

/**
 * Send verification email to new CLIENT user
 */
export async function sendVerificationEmail(
    env: Env,
    email: string,
    token: string
): Promise<void> {
    const gmailClientEmail = (env as any).GMAIL_CLIENT_EMAIL;
    const gmailPrivateKey = (env as any).GMAIL_PRIVATE_KEY;
    const frontendUrl = (env as any).FRONTEND_URL || 'http://localhost:3000';

    if (!gmailClientEmail || !gmailPrivateKey) {
        console.warn('Email not configured. Verification Token:', token);
        console.warn('Verify URL:', `${frontendUrl}/verify?token=${token}`);
        return;
    }

    try {
        console.log('[VERIFY EMAIL] Starting email send process...');

        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = { alg: 'RS256', typ: 'JWT' };
        const jwtClaim = {
            iss: gmailClientEmail,
            sub: 'emidias@hubradios.com',
            scope: 'https://www.googleapis.com/auth/gmail.send',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        const privateKeyPem = gmailPrivateKey.replace(/\\n/g, '\n');
        const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);

        const cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
        );

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

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });

        if (!tokenResponse.ok) {
            const tokenResponseText = await tokenResponse.text();
            throw new Error(`Failed to get access token: ${tokenResponseText}`);
        }

        const tokenData = await tokenResponse.json() as any;
        const access_token = tokenData.access_token;

        const verifyUrl = `${frontendUrl}/verify?token=${token}`;
        const subject = 'Verifique seu email - OOH Data Hub';
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
            <h1>Verifique seu Email</h1>
        </div>
        <div class="content">
            <p>Olá,</p>
            <p>Obrigado por criar sua conta no <strong>OOH Data Hub</strong>.</p>
            <p>Para ativar sua conta, clique no botão abaixo:</p>
            
            <p style="text-align: center;">
                <a href="${verifyUrl}" class="button">Verificar Email</a>
            </p>

            <p>Ou copie este link:</p>
            <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">${verifyUrl}</p>
        </div>
        <div class="footer">
            <p>OOH Data Hub - Sistema de Gestão E-MÍDIAS</p>
        </div>
    </div>
</body>
</html>`;

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
        const encodedEmail = base64UrlEncode(rawEmail);

        const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: encodedEmail }),
        });

        if (!sendResponse.ok) {
            const sendResponseText = await sendResponse.text();
            throw new Error(`Failed to send email: ${sendResponseText}`);
        }

        console.log('[VERIFY EMAIL] ✅ Email sent successfully to:', email);
    } catch (error) {
        console.error('[VERIFY EMAIL] ❌ Error:', error);
    }
}

/**
 * Send invite email to external user
 */
export async function sendUserInviteEmail(
    env: Env,
    email: string,
    token: string,
    proposalId: number
): Promise<void> {
    const gmailClientEmail = (env as any).GMAIL_CLIENT_EMAIL;
    const gmailPrivateKey = (env as any).GMAIL_PRIVATE_KEY;
    const frontendUrl = (env as any).FRONTEND_URL || 'http://localhost:3000';

    if (!gmailClientEmail || !gmailPrivateKey) {
        console.warn('Email not configured. Invite Token:', token);
        return;
    }

    try {
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = { alg: 'RS256', typ: 'JWT' };
        const jwtClaim = {
            iss: gmailClientEmail,
            sub: 'emidias@hubradios.com',
            scope: 'https://www.googleapis.com/auth/gmail.send',
            aud: 'https://oauth2.googleapis.com/token',
            exp: now + 3600,
            iat: now
        };

        const privateKeyPem = gmailPrivateKey.replace(/\\n/g, '\n');
        const privateKeyBuffer = pemToArrayBuffer(privateKeyPem);

        const cryptoKey = await crypto.subtle.importKey(
            'pkcs8',
            privateKeyBuffer,
            { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            false,
            ['sign']
        );

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

        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
        });

        if (!tokenResponse.ok) throw new Error('Failed to get access token');
        const tokenData = await tokenResponse.json() as any;
        const access_token = tokenData.access_token;

        // NEW LINK: Direct to Proposal. Backend handles pending invite via email match on signup.
        const inviteUrl = `${frontendUrl}/propostas?id=${proposalId}&email=${encodeURIComponent(email)}`;
        const subject = 'Convite para visualizar proposta - OOH Data Hub';
        const htmlBody = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Você recebeu um convite!</h1>
        </div>
        <div class="content">
            <p>Olá,</p>
            <p>Você foi convidado para visualizar uma proposta no <strong>OOH Data Hub</strong>.</p>
            <p>Para acessar a proposta, clique no botão abaixo:</p>
            
            <p style="text-align: center;">
                <a href="${inviteUrl}" class="button">Visualizar Proposta</a>
            </p>

            <p style="font-size: 14px; color: #666; margin-top: 20px;">
                <strong>Nota:</strong> Se você ainda não tem uma conta, será necessário criar uma (use este mesmo email) para acessar o documento.
            </p>
        </div>
        <div class="footer">
            <p>OOH Data Hub - Sistema de Gestão E-MÍDIAS</p>
        </div>
    </div>
</body>
</html>`;

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
        const encodedEmail = base64UrlEncode(rawEmail);

        await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ raw: encodedEmail }),
        });

        console.log('[INVITE EMAIL] Sent to:', email);
    } catch (error) {
        console.error('[INVITE EMAIL] Error:', error);
    }
}
