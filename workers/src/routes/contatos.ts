import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export async function handleContatos(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/contatos?id_exibidora=X - Lista contatos de uma exibidora
    if (request.method === 'GET' && path === '/api/contatos') {
        const url = new URL(request.url);
        const idExibidora = url.searchParams.get('id_exibidora');

        if (!idExibidora) {
            return new Response(JSON.stringify({ error: 'id_exibidora é obrigatório' }), {
                status: 400,
                headers,
            });
        }

        const { results } = await env.DB.prepare(
            'SELECT * FROM contatos WHERE id_exibidora = ? ORDER BY id'
        ).bind(idExibidora).all();

        return new Response(JSON.stringify(results), { headers });
    }

    // POST /api/contatos - Criar novo contato
    if (request.method === 'POST' && path === '/api/contatos') {
        const data = await request.json() as any;

        if (!data.id_exibidora) {
            return new Response(JSON.stringify({ error: 'id_exibidora é obrigatório' }), {
                status: 400,
                headers,
            });
        }

        const result = await env.DB.prepare(`
      INSERT INTO contatos (id_exibidora, nome, telefone, email, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
            data.id_exibidora,
            data.nome || null,
            data.telefone || null,
            data.email || null,
            data.observacoes || null
        ).run();

        return new Response(JSON.stringify({ id: result.meta.last_row_id, success: true }), {
            status: 201,
            headers,
        });
    }

    // PUT /api/contatos/:id - Atualizar contato
    if (request.method === 'PUT' && path.match(/^\/api\/contatos\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);
        const data = await request.json() as any;

        await env.DB.prepare(`
      UPDATE contatos 
      SET nome = ?, telefone = ?, email = ?, observacoes = ?
      WHERE id = ?
    `).bind(
            data.nome || null,
            data.telefone || null,
            data.email || null,
            data.observacoes || null,
            id
        ).run();

        return new Response(JSON.stringify({ success: true }), { headers });
    }

    // DELETE /api/contatos/:id - Deletar contato
    if (request.method === 'DELETE' && path.match(/^\/api\/contatos\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);

        await env.DB.prepare('DELETE FROM contatos WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers,
    });
}
