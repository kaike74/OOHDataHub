import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export async function handleExibidoras(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/exibidoras - Lista todas
    if (request.method === 'GET' && path === '/api/exibidoras') {
        const { results } = await env.DB.prepare(
            'SELECT * FROM exibidoras ORDER BY nome'
        ).all();

        return new Response(JSON.stringify(results), { headers });
    }

    // POST /api/exibidoras - Criar nova
    if (request.method === 'POST' && path === '/api/exibidoras') {
        const data = await request.json() as any;

        if (!data.nome) {
            return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), {
                status: 400,
                headers,
            });
        }

        const result = await env.DB.prepare(`
      INSERT INTO exibidoras (nome, cnpj, razao_social, endereco, observacoes, logo_r2_key)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
            data.nome,
            data.cnpj || null,
            data.razao_social || null,
            data.endereco || null,
            data.observacoes || null,
            data.logo_r2_key || null
        ).run();

        return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), {
            status: 201,
            headers,
        });
    }

    // PUT /api/exibidoras/:id - Atualizar existente
    if (request.method === 'PUT' && path.match(/^\/api\/exibidoras\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);
        const data = await request.json() as any;

        if (!data.nome) {
            return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), {
                status: 400,
                headers,
            });
        }

        await env.DB.prepare(`
      UPDATE exibidoras 
      SET nome = ?, cnpj = ?, razao_social = ?, endereco = ?, observacoes = ?
      WHERE id = ?
    `).bind(
            data.nome,
            data.cnpj || null,
            data.razao_social || null,
            data.endereco || null,
            data.observacoes || null,
            id
        ).run();

        return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers,
    });
}
