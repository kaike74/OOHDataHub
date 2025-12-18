
import { Env } from '../index';

import { corsHeaders } from '../utils/cors';

export const handlePublicProposal = async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const path = url.pathname;

    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    // GET /api/public/proposals/:token
    if (request.method === 'GET') {
        const token = path.split('/').pop();
        if (!token) return new Response('Token required', { status: 400, headers });

        const stmt = env.DB.prepare(`
            SELECT p.*, c.nome as cliente_nome, c.logo_url as cliente_logo
            FROM propostas p
            JOIN clientes c ON p.id_cliente = c.id
            WHERE p.public_token = ?
        `).bind(token);

        const proposal = await stmt.first();

        if (!proposal) {
            return new Response('Proposal not found', { status: 404, headers });
        }

        // Get items but HIDE COSTS
        const itemsStmt = env.DB.prepare(`
            SELECT pi.id, pi.id_ooh, pi.periodo_inicio, pi.periodo_fim, 
                   pi.status, pi.client_comment,
                   po.codigo_ooh, po.endereco, po.cidade, po.uf, NULL as bairro,
                   po.latitude, po.longitude, po.medidas, po.tipo,
                   e.nome as exibidora_nome,
                   -- Calculate public price (total_investimento equivalent) but maybe without breakdown?
                   -- For now, let's return total_investimento if it exists or calculate it.
                   -- User said: "sem valores de custo, só venda".
                   -- So we return the 'sales price' which is essentially valor_locacao + others?
                   -- Let's return the simplified values.
                   (pi.valor_locacao + pi.valor_papel + pi.valor_lona) as valor_total
            FROM proposta_itens pi
            JOIN pontos_ooh po ON pi.id_ooh = po.id
            JOIN exibidoras e ON po.id_exibidora = e.id
            WHERE pi.id_proposta = ?
        `).bind(proposal.id);

        const { results } = await itemsStmt.all();

        return new Response(JSON.stringify({
            ...proposal,
            itens: results
        }), {
            headers
        });
    }

    return new Response('Method not allowed', { status: 405, headers });
};
