import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { verifyAuth } from '../utils/auth';

export async function handleClientes(request: Request, env: Env, path: string): Promise<Response> {
    try {
        // Verificar autenticação
        const authResult = await verifyAuth(request, env);
        if (!authResult.authorized) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        const url = new URL(request.url);
        const method = request.method;

        // GET /api/clientes - Listar todos os clientes
        if (method === 'GET' && path === '/api/clientes') {
            const clientes = await env.DB.prepare(
                'SELECT * FROM clientes ORDER BY nome ASC'
            ).all();

            return new Response(JSON.stringify(clientes.results), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // GET /api/clientes/:id - Buscar cliente específico
        if (method === 'GET' && path.match(/^\/api\/clientes\/\d+$/)) {
            const id = path.split('/')[3];
            const cliente = await env.DB.prepare(
                'SELECT * FROM clientes WHERE id = ?'
            ).bind(id).first();

            if (!cliente) {
                return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                    status: 404,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify(cliente), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // POST /api/clientes - Criar novo cliente
        if (method === 'POST' && path === '/api/clientes') {
            const data = await request.json() as any;

            if (!data.nome) {
                return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), {
                    status: 400,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            const result = await env.DB.prepare(
                'INSERT INTO clientes (nome, logo_r2_key) VALUES (?, ?) RETURNING *'
            ).bind(data.nome, data.logo_r2_key || null).first();

            return new Response(JSON.stringify(result), {
                status: 201,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // PUT /api/clientes/:id - Atualizar cliente
        if (method === 'PUT' && path.match(/^\/api\/clientes\/\d+$/)) {
            const id = path.split('/')[3];
            const data = await request.json() as any;

            const result = await env.DB.prepare(
                'UPDATE clientes SET nome = ?, logo_r2_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? RETURNING *'
            ).bind(data.nome, data.logo_r2_key || null, id).first();

            if (!result) {
                return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), {
                    status: 404,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // DELETE /api/clientes/:id - Deletar cliente
        if (method === 'DELETE' && path.match(/^\/api\/clientes\/\d+$/)) {
            const id = path.split('/')[3];

            await env.DB.prepare('DELETE FROM clientes WHERE id = ?').bind(id).run();

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error in handleClientes:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
        });
    }
}
