import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export async function handlePontos(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/pontos - Lista todos os pontos
    if (request.method === 'GET' && path === '/api/pontos') {
        const { results } = await env.DB.prepare(`
      SELECT 
        p.*,
        e.nome as exibidora_nome,
        e.cnpj as exibidora_cnpj,
        GROUP_CONCAT(DISTINCT i.r2_key) as imagens,
        GROUP_CONCAT(DISTINCT pr.tipo || ':' || pr.valor || ':' || COALESCE(pr.periodo, '')) as produtos
      FROM pontos_ooh p
      LEFT JOIN exibidoras e ON p.id_exibidora = e.id
      LEFT JOIN imagens i ON p.id = i.id_ponto
      LEFT JOIN produtos pr ON p.id = pr.id_ponto
      WHERE p.status = 'ativo'
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `).all();

        // Parse produtos e imagens
        const pontos = results.map((p: any) => ({
            ...p,
            imagens: p.imagens ? p.imagens.split(',') : [],
            produtos: p.produtos ? p.produtos.split(',').map((prod: string) => {
                const [tipo, valor, periodo] = prod.split(':');
                return { tipo, valor: parseFloat(valor), periodo };
            }) : [],
        }));

        return new Response(JSON.stringify(pontos), { headers });
    }

    // GET /api/pontos/:id - Detalhes de um ponto
    if (request.method === 'GET' && path.match(/^\/api\/pontos\/\d+$/)) {
        const id = path.split('/').pop();

        const ponto = await env.DB.prepare(`
      SELECT p.*, e.nome as exibidora_nome, e.cnpj as exibidora_cnpj
      FROM pontos_ooh p
      LEFT JOIN exibidoras e ON p.id_exibidora = e.id
      WHERE p.id = ?
    `).bind(id).first();

        if (!ponto) {
            return new Response(JSON.stringify({ error: 'Ponto não encontrado' }), {
                status: 404,
                headers,
            });
        }

        // Buscar imagens
        const { results: imagens } = await env.DB.prepare(
            'SELECT * FROM imagens WHERE id_ponto = ? ORDER BY ordem, id'
        ).bind(id).all();

        // Buscar produtos
        const { results: produtos } = await env.DB.prepare(
            'SELECT * FROM produtos WHERE id_ponto = ?'
        ).bind(id).all();

        return new Response(JSON.stringify({ ...ponto, imagens, produtos }), { headers });
    }

    // POST /api/pontos - Criar novo ponto
    if (request.method === 'POST' && path === '/api/pontos') {
        const data = await request.json() as any;

        // Validações básicas
        if (!data.codigo_ooh || !data.endereco) {
            return new Response(JSON.stringify({ error: 'Campos obrigatórios faltando' }), {
                status: 400,
                headers,
            });
        }

        // Inserir ponto
        const result = await env.DB.prepare(`
      INSERT INTO pontos_ooh (
        codigo_ooh, endereco, latitude, longitude, cidade, uf,
        id_exibidora, medidas, fluxo, tipo, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
            data.codigo_ooh,
            data.endereco,
            data.latitude || null,
            data.longitude || null,
            data.cidade || null,
            data.uf || null,
            data.id_exibidora || null,
            data.medidas || null,
            data.fluxo || null,
            data.tipos || null, // NOVO campo
            data.observacoes || null
        ).run();

        const pontoId = result.meta.last_row_id;

        // Inserir produtos se houver
        if (data.produtos && Array.isArray(data.produtos)) {
            for (const prod of data.produtos) {
                await env.DB.prepare(
                    'INSERT INTO produtos (id_ponto, tipo, valor, periodo) VALUES (?, ?, ?, ?)'
                ).bind(pontoId, prod.tipo, prod.valor, prod.periodo || null).run();
            }
        }

        return new Response(JSON.stringify({ id: pontoId, success: true }), {
            status: 201,
            headers,
        });
    }

    // PUT /api/pontos/:id - Atualizar ponto
    if (request.method === 'PUT' && path.match(/^\/api\/pontos\/\d+$/)) {
        const id = path.split('/').pop();
        const data = await request.json() as any;

        await env.DB.prepare(`
      UPDATE pontos_ooh SET
        endereco = ?,
        latitude = ?,
        longitude = ?,
        cidade = ?,
        uf = ?,
        id_exibidora = ?,
        medidas = ?,
        fluxo = ?,
        observacoes = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
            data.endereco,
            data.latitude,
            data.longitude,
            data.cidade,
            data.uf,
            data.id_exibidora,
            data.medidas,
            data.fluxo,
            data.observacoes,
            id
        ).run();

        return new Response(JSON.stringify({ success: true }), { headers });
    }

    // DELETE /api/pontos/:id - Deletar ponto
    if (request.method === 'DELETE' && path.match(/^\/api\/pontos\/\d+$/)) {
        const id = path.split('/').pop();

        await env.DB.prepare(
            "UPDATE pontos_ooh SET status = 'inativo' WHERE id = ?"
        ).bind(id).run();

        return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers,
    });
}
