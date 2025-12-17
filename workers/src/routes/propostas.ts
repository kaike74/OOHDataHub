
import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export async function handlePropostas(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/propostas/:id - Detalhes da proposta com itens
    if (request.method === 'GET' && path.match(/^\/api\/propostas\/\d+$/)) {
        const id = path.split('/').pop();

        // Buscar proposta
        const proposta = await env.DB.prepare(
            'SELECT * FROM propostas WHERE id = ?'
        ).bind(id).first();

        if (!proposta) {
            return new Response(JSON.stringify({ error: 'Proposta não encontrada' }), { status: 404, headers });
        }

        // Buscar itens (carrinho) e fazer join com pontos_ooh para pegar detalhes
        // Including all fields needed for calculation
        const { results: itens } = await env.DB.prepare(`
        SELECT 
            pi.id, pi.id_proposta, pi.id_ooh, pi.periodo_inicio, pi.periodo_fim, 
            pi.valor_locacao, pi.valor_papel, pi.valor_lona, 
            pi.periodo_comercializado, pi.observacoes, pi.fluxo_diario,
            p.endereco, p.cidade, p.uf, p.pais, p.codigo_ooh, p.tipo, p.medidas, p.ponto_referencia,
            p.latitude, p.longitude,
            e.nome as exibidora_nome
        FROM proposta_itens pi
        JOIN pontos_ooh p ON pi.id_ooh = p.id
        LEFT JOIN exibidoras e ON p.id_exibidora = e.id
        WHERE pi.id_proposta = ?
    `).bind(id).all();

        return new Response(JSON.stringify({ ...proposta, itens }), { headers });
    }

    // POST /api/propostas - Criar proposta
    if (request.method === 'POST' && path === '/api/propostas') {
        try {
            const data = await request.json() as any;

            const res = await env.DB.prepare(
                'INSERT INTO propostas (id_cliente, nome, comissao) VALUES (?, ?, ?)'
            ).bind(data.id_cliente, data.nome, data.comissao).run();

            return new Response(JSON.stringify({ id: res.meta.last_row_id, success: true }), { status: 201, headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // PUT /api/propostas/:id/itens - Atualizar carrinho (Substituir itens ou adicionar?)
    // Usually this modifies specific items or syncs the whole cart.
    // The user prompt implies managing the cart. "GET/PUT .../itens".
    // Let's support bulk update/sync for simplicity as requested by "manage cart".
    if (request.method === 'PUT' && path.match(/^\/api\/propostas\/\d+\/itens$/)) {
        try {
            const idProposta = path.split('/')[3];
            const data = await request.json() as any; // Expecting array of items to allow sync, or specific operation

            // Strategy: Clear existing items for this proposal and re-insert (Simplest for "Sync" state)
            // Or upsert. Let's do a sync if the payload is an array of items.

            if (!Array.isArray(data.itens)) {
                return new Response(JSON.stringify({ error: 'Payload deve conter array de itens' }), { status: 400, headers });
            }

            const batch = [];
            // 1. Delete existing items
            batch.push(env.DB.prepare('DELETE FROM proposta_itens WHERE id_proposta = ?').bind(idProposta));

            // 2. Insert new items
            for (const item of data.itens) {
                batch.push(env.DB.prepare(`
                INSERT INTO proposta_itens (
                    id_proposta, id_ooh, periodo_inicio, periodo_fim, 
                    valor_locacao, valor_papel, valor_lona, 
                    periodo_comercializado, observacoes, fluxo_diario
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                    idProposta, item.id_ooh, item.periodo_inicio, item.periodo_fim,
                    item.valor_locacao, item.valor_papel, item.valor_lona,
                    item.periodo_comercializado, item.observacoes, item.fluxo_diario || null
                ));
            }

            await env.DB.batch(batch);

            return new Response(JSON.stringify({ success: true }), { headers });

        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // POST /api/propostas/:id/share - Gerar/Recuperar token de compartilhamento
    if (request.method === 'POST' && path.match(/^\/api\/propostas\/\d+\/share$/)) {
        try {
            const id = path.split('/')[3];

            // Verifica se já tem token
            const proposta = await env.DB.prepare('SELECT public_token FROM propostas WHERE id = ?').bind(id).first();

            if (!proposta) {
                return new Response(JSON.stringify({ error: 'Proposta não encontrada' }), { status: 404, headers });
            }

            let token = proposta.public_token as string;

            if (!token) {
                // Gera novo token simples (pode usar UUID ou nanoid se tiver importado, ou algo random)
                token = crypto.randomUUID();
                await env.DB.prepare('UPDATE propostas SET public_token = ? WHERE id = ?').bind(token, id).run();
            }

            return new Response(JSON.stringify({ token, success: true }), { headers });

        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // --- PROPOSAL LAYERS ROUTES ---

    // GET /api/propostas/:id/layers
    if (request.method === 'GET' && path.match(/^\/api\/propostas\/\d+\/layers$/)) {
        const idProposta = path.split('/')[3];
        const { results } = await env.DB.prepare('SELECT * FROM proposal_layers WHERE id_proposta = ? ORDER BY created_at DESC').bind(idProposta).all();
        // Parse markers JSON
        const layers = results.map((l: any) => ({ ...l, markers: JSON.parse(l.markers), visible: !!l.visible }));
        return new Response(JSON.stringify(layers), { headers });
    }

    // POST /api/propostas/:id/layers
    if (request.method === 'POST' && path.match(/^\/api\/propostas\/\d+\/layers$/)) {
        try {
            const idProposta = path.split('/')[3];
            const data = await request.json() as any;

            if (!data.id || !data.name || !data.markers) {
                return new Response(JSON.stringify({ error: 'Dados incompletos (id, name, markers)' }), { status: 400, headers });
            }

            await env.DB.prepare(`
                INSERT INTO proposal_layers (id, id_proposta, name, color, markers, visible)
                VALUES (?, ?, ?, ?, ?, ?)
            `).bind(
                data.id,
                idProposta,
                data.name,
                data.color || '#3B82F6',
                JSON.stringify(data.markers),
                data.visible !== undefined ? (data.visible ? 1 : 0) : 1
            ).run();

            return new Response(JSON.stringify({ success: true }), { status: 201, headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // DELETE /api/propostas/:id/layers/:layerId
    if (request.method === 'DELETE' && path.match(/^\/api\/propostas\/\d+\/layers\/[\w-]+$/)) {
        try {
            const idProposta = path.split('/')[3];
            const layerId = path.split('/')[5];

            await env.DB.prepare('DELETE FROM proposal_layers WHERE id = ? AND id_proposta = ?').bind(layerId, idProposta).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    // PUT /api/propostas/:id/layers/:layerId (Update visibility/color)
    if (request.method === 'PUT' && path.match(/^\/api\/propostas\/\d+\/layers\/[\w-]+$/)) {
        try {
            const idProposta = path.split('/')[3];
            const layerId = path.split('/')[5];
            const data = await request.json() as any;

            const updates = [];
            const values = [];

            if (data.visible !== undefined) {
                updates.push('visible = ?');
                values.push(data.visible ? 1 : 0);
            }
            if (data.color !== undefined) {
                updates.push('color = ?');
                values.push(data.color);
            }

            if (updates.length > 0) {
                values.push(layerId, idProposta);
                await env.DB.prepare(`UPDATE proposal_layers SET ${updates.join(', ')} WHERE id = ? AND id_proposta = ?`).bind(...values).run();
            }

            return new Response(JSON.stringify({ success: true }), { headers });
        } catch (e: any) {
            return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });
}
