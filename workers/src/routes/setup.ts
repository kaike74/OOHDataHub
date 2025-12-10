import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { hashPassword } from '../utils/auth';

// Temporary setup endpoint - DELETE AFTER FIRST RUN
export async function handleSetup(request: Request, env: Env): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers,
        });
    }

    try {
        // Create users table
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'viewer',
                status TEXT NOT NULL DEFAULT 'pending',
                invited_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                FOREIGN KEY (invited_by) REFERENCES users(id)
            )
        `).run();

        // Create indexes
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)').run();

        // Check if master user exists
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?')
            .bind('kaike@hubradios.com').first();

        if (!existing) {
            // Create master user
            const passwordHash = await hashPassword('Teste123');
            await env.DB.prepare(`
                INSERT INTO users (email, password_hash, name, role, status)
                VALUES (?, ?, ?, ?, ?)
            `).bind('kaike@hubradios.com', passwordHash, 'Kaike', 'master', 'active').run();
        }

        // Add audit fields to pontos_ooh
        try {
            await env.DB.prepare('ALTER TABLE pontos_ooh ADD COLUMN created_by INTEGER').run();
        } catch (e) {
            // Column might already exist
        }

        try {
            await env.DB.prepare('ALTER TABLE pontos_ooh ADD COLUMN updated_by INTEGER').run();
        } catch (e) {
            // Column might already exist
        }

        // Create indexes for audit fields
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_pontos_created_by ON pontos_ooh(created_by)').run();
        await env.DB.prepare('CREATE INDEX IF NOT EXISTS idx_pontos_updated_by ON pontos_ooh(updated_by)').run();

        return new Response(JSON.stringify({
            success: true,
            message: 'Database setup completed successfully'
        }), { headers });

    } catch (error: any) {
        console.error('Setup error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Setup failed',
            details: error.toString()
        }), {
            status: 500,
            headers,
        });
    }
}
