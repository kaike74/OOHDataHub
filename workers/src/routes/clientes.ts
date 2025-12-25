
import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { extractToken, verifyToken } from '../utils/auth';

export async function handleClientes(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // Helper to get current user
    const getUser = async (req: Request) => {
        const token = extractToken(req);
        if (!token) return null;
        return await verifyToken(token);
    };

    // GET /api/clientes - Lista clientes (Filtrado por user role)
    if (request.method === 'GET' && path === '/api/clientes') {
        try {
            const user = await getUser(request);
            // If no user (or public?), for now assume strict auth or default to internal public?
            // Existing system might rely on public access? The previous code didn't check auth.
            // But for external data protection, we MUST now check auth.
            // If no auth, return empty or error? To preserve backward compatibility if any, 
            // we might default to internal if that was the behavior, but safer to return empty if not sure.
            // However, the previous code was: "SELECT * FROM clientes". This implies public or internal-only assuming firewall.
            // Let's assume we need auth now.

            let query = 'SELECT * FROM clientes WHERE ';
            const params: any[] = [];

            if (!user) {
                // Fallback for legacy/public if needed, or restricted. 
                // Let's restrict to 'internal' for now to be safe, or just public ones?
                // Given the prompt "Internal users maintain current flow", effectively public-ish for them.
                // But for external users getting in, we must hide internal clients.
                // If no token, maybe it's an internal tool without auth? 
                // But `propostas.ts` uses auth. Let's assume auth is available.
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
            }

            if (user.role === 'client') {
                // External User: Only their own clients
                query += "origin = 'external' AND created_by = ?";
                params.push(user.userId);
            } else {
                // Internal User (Admin/Editor/Viewer): Only internal clients
                query += "origin = 'internal'";
            }

            query += ' ORDER BY created_at DESC';

            const { results } = await env.DB.prepare(query).bind(...params).all();
            return new Response(JSON.stringify(results), { headers });

        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // POST /api/clientes - Criar novo cliente
    if (request.method === 'POST' && path === '/api/clientes') {
        try {
            const user = await getUser(request);
            if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

            const data = await request.json() as any;

            // Validation
            if (!data.nome) return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), { status: 400, headers });
            if (!data.cnpj) return new Response(JSON.stringify({ error: 'CNPJ é obrigatório' }), { status: 400, headers });

            const origin = user.role === 'client' ? 'external' : 'internal';
            const createdBy = user.userId;

            // Check Uniqueness
            // External: Unique CNPJ per User
            // Internal: Unique CNPJ global for internal
            let existing: any = null;
            if (origin === 'external') {
                existing = await env.DB.prepare('SELECT id FROM clientes WHERE cnpj = ? AND created_by = ? AND origin = ?')
                    .bind(data.cnpj, createdBy, 'external').first();
            } else {
                existing = await env.DB.prepare('SELECT id FROM clientes WHERE cnpj = ? AND origin = ?')
                    .bind(data.cnpj, 'internal').first();
            }

            if (existing) {
                return new Response(JSON.stringify({ error: 'Cliente com este CNPJ já existe.' }), { status: 409, headers });
            }

            const result = await env.DB.prepare(`
                INSERT INTO clientes (
                    nome, logo_url, cnpj, origin, created_by, 
                    segmento, publico_alvo, regiao, pacote_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                data.nome,
                data.logo_url || null,
                data.cnpj,
                origin,
                createdBy,
                data.segmento || null,
                data.publico_alvo || null,
                data.regiao || null,
                data.pacote_id || null
            ).run();

            return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), { status: 201, headers });

        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    // GET /api/clientes/:id/propostas - Propostas do cliente
    if (request.method === 'GET' && path.match(/^\/api\/clientes\/\d+\/propostas$/)) {
        const id = path.split('/')[3];
        const user = await getUser(request);

        // Security Check: Is user allowed to see this client?
        if (user) {
            const client = await env.DB.prepare('SELECT origin, created_by FROM clientes WHERE id = ?').bind(id).first();
            if (client) {
                if (user.role === 'client') {
                    if (client.origin !== 'external' || client.created_by !== user.userId) {
                        return new Response(JSON.stringify({ error: 'Access Denied' }), { status: 403, headers });
                    }
                } else {
                    // Internal can see internal. What about external? 
                    // Valid question. Usually admins can see everything. 
                    // But prompt said: "Usuários internos... não acessam clientes externos"
                    if (client.origin === 'external') {
                        return new Response(JSON.stringify({ error: 'Access Denied (Client is External)' }), { status: 403, headers });
                    }
                }
            }
        }

        const { results } = await env.DB.prepare(`
            SELECT 
                p.*,
                COUNT(pi.id) as total_itens,
                SUM(pi.valor_locacao + pi.valor_papel + pi.valor_lona) as total_valor
            FROM propostas p
            LEFT JOIN proposta_itens pi ON p.id = pi.id_proposta
            WHERE p.id_cliente = ? AND p.deleted_at IS NULL
            GROUP BY p.id
            ORDER BY p.created_at DESC
        `).bind(id).all();

        return new Response(JSON.stringify(results), { headers });
    }

    // PUT /api/clientes/:id - Editar Cliente (New)
    if (request.method === 'PUT' && path.match(/^\/api\/clientes\/\d+$/)) {
        try {
            const id = path.split('/')[3];
            const user = await getUser(request);
            if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

            const data = await request.json() as any;

            // Fetch Client first for permission
            const client = await env.DB.prepare('SELECT origin, created_by FROM clientes WHERE id = ?').bind(id).first();
            if (!client) return new Response(JSON.stringify({ error: 'Client not found' }), { status: 404, headers });

            if (user.role === 'client') {
                if (client.origin !== 'external' || client.created_by !== user.userId) {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
                }
            } else {
                if (client.origin !== 'internal') {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
                }
            }

            // Update
            // Allow updating optional fields and name/logo. CNPJ update usually restricted or careful.
            // Let's allow simple updates.
            const updates = [];
            const values = [];

            if (data.nome) { updates.push('nome = ?'); values.push(data.nome); }
            if (data.logo_url !== undefined) { updates.push('logo_url = ?'); values.push(data.logo_url); } // Allow clearing
            if (data.segmento !== undefined) { updates.push('segmento = ?'); values.push(data.segmento); }
            if (data.publico_alvo !== undefined) { updates.push('publico_alvo = ?'); values.push(data.publico_alvo); }
            if (data.regiao !== undefined) { updates.push('regiao = ?'); values.push(data.regiao); }
            // CNPJ update logic need check uniqueness... skip for now to simplify or assume user knows.

            if (updates.length > 0) {
                values.push(id);
                await env.DB.prepare(`UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run();
            }

            return new Response(JSON.stringify({ success: true }), { headers });

        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // DELETE /api/clientes/:id (New)
    if (request.method === 'DELETE' && path.match(/^\/api\/clientes\/\d+$/)) {
        try {
            const id = path.split('/')[3];
            const user = await getUser(request);
            if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });

            // Fetch Permission
            const client = await env.DB.prepare('SELECT origin, created_by FROM clientes WHERE id = ?').bind(id).first();
            if (!client) return new Response(JSON.stringify({ error: 'Client not found' }), { status: 404, headers });

            if (user.role === 'client') {
                if (client.origin !== 'external' || client.created_by !== user.userId) {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
                }
            } else {
                if (client.origin !== 'internal') {
                    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers });
                }
            }

            // Check if has proposals
            const propCount = await env.DB.prepare('SELECT count(*) as count FROM propostas WHERE id_cliente = ? AND deleted_at IS NULL').bind(id).first();
            if ((propCount as any).count > 0) {
                return new Response(JSON.stringify({ error: 'Não é possível excluir cliente com propostas ativas.' }), { status: 400, headers });
            }

            await env.DB.prepare('DELETE FROM clientes WHERE id = ?').bind(id).run();
            return new Response(JSON.stringify({ success: true }), { headers });

        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}
