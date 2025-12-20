
import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export async function handleClientes(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/clientes - Lista todos os clientes
    if (request.method === 'GET' && path === '/api/clientes') {
        const { results } = await env.DB.prepare(
            'SELECT * FROM clientes ORDER BY created_at DESC'
        ).all();
        return new Response(JSON.stringify(results), { headers });
    }

    // POST /api/clientes - Criar novo cliente
    if (request.method === 'POST' && path === '/api/clientes') {
        try {
            const data = await request.json() as any;
            if (!data.nome) {
                return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), { status: 400, headers });
            }

            const result = await env.DB.prepare(
                'INSERT INTO clientes (nome, logo_url) VALUES (?, ?)'
            ).bind(data.nome, data.logo_url || null).run();

            return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), { status: 201, headers });
        } catch (error: any) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
        }
    }

    // GET /api/clientes/:id/propostas - Propostas do cliente
    if (request.method === 'GET' && path.match(/^\/api\/clientes\/\d+\/propostas$/)) {
        const id = path.split('/')[3]; // /api/clientes/ID/propostas

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

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}
