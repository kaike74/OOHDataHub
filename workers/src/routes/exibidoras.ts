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

    // GET /api/exibidoras/:id/propostas - Listar propostas com pontos desta exibidora
    if (request.method === 'GET' && path.match(/^\/api\/exibidoras\/\d+\/propostas$/)) {
        const id = parseInt(path.split('/')[3]);

        try {
            const { results } = await env.DB.prepare(`
                SELECT 
                    p.id, 
                    p.nome, 
                    p.status, 
                    COUNT(i.id) as pontos_count
                FROM propostas p
                JOIN proposta_itens i ON i.id_proposta = p.id
                JOIN pontos_ooh po ON i.id_ooh = po.id
                WHERE po.id_exibidora = ?
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `).bind(id).all();

            return new Response(JSON.stringify(results), { headers });
        } catch (e: any) {
            console.error('Erro ao buscar propostas da exibidora:', e);
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers,
            });
        }
    }

    // DELETE /api/exibidoras/:id - Deletar exibidora (e seus pontos/contatos)
    if (request.method === 'DELETE' && path.match(/^\/api\/exibidoras\/\d+$/)) {
        const id = parseInt(path.split('/')[3]);

        try {
            // Deletar contatos associados
            await env.DB.prepare('DELETE FROM contatos WHERE id_exibidora = ?').bind(id).run();

            // Deletar pontos associados (cascade manual para garantir)
            // Nota: Se houver imagens associadas aos pontos, elas podem ficar orfãs no R2 se não tratadas aqui.
            // Por simplicidade e segurança imediata, deletamos os registros do banco.
            await env.DB.prepare('DELETE FROM pontos_ooh WHERE id_exibidora = ?').bind(id).run();

            // Deletar a exibidora
            await env.DB.prepare('DELETE FROM exibidoras WHERE id = ?').bind(id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e: any) {
            console.error('Erro ao deletar exibidora:', e);
            return new Response(JSON.stringify({ error: e.message }), {
                status: 500,
                headers,
            });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers,
    });
}

