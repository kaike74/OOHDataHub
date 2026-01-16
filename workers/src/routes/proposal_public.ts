
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

        // Get items with all necessary fields for display
        const itemsStmt = env.DB.prepare(`
            SELECT pi.id, pi.id_ooh, pi.id_proposta,
                   pi.periodo_inicio, pi.periodo_fim, pi.selected_periods,
                   pi.status, pi.client_comment,
                   pi.valor_locacao, pi.valor_papel, pi.valor_lona,
                   pi.vlr_total, pi.vlr_tabela,
                   pi.fluxo_diario, pi.impactos,
                   po.id as ponto_id,
                   po.codigo_ooh, po.endereco, po.cidade, po.uf, po.bairro,
                   po.latitude, po.longitude, 
                   po.lat, po.lng,
                   po.medidas, po.tipo,
                   po.impacto_estimado, po.valor,
                   e.id as exibidora_id,
                   e.nome as exibidora_nome
            FROM proposta_itens pi
            JOIN pontos_ooh po ON pi.id_ooh = po.id
            JOIN exibidoras e ON po.id_exibidora = e.id
            WHERE pi.id_proposta = ?
        `).bind(proposal.id);

        const { results } = await itemsStmt.all();

        // Structure items to match what the frontend expects
        const structuredItems = results.map((item: any) => ({
            ...item,
            // Ensure both coordinate formats are available
            lat: item.lat || item.latitude,
            lng: item.lng || item.longitude,
            latitude: item.latitude || item.lat,
            longitude: item.longitude || item.lng,
            // Ensure valor fields are present
            valor: item.valor_locacao || item.valor || 0,
            valor_locacao: item.valor_locacao || 0,
            valor_papel: item.valor_papel || 0,
            valor_lona: item.valor_lona || 0,
            vlr_total: item.vlr_total || (item.valor_locacao + item.valor_papel + item.valor_lona),
            vlr_tabela: item.vlr_tabela || item.valor_locacao || 0,
            // Ensure impact fields are present
            fluxo_diario: item.fluxo_diario || item.impacto_estimado || 0,
            impactos: item.impactos || ((item.fluxo_diario || item.impacto_estimado || 0) * 14),
            // Nested ponto object for compatibility
            ponto: {
                id: item.ponto_id,
                codigo_ooh: item.codigo_ooh,
                endereco: item.endereco,
                cidade: item.cidade,
                uf: item.uf,
                bairro: item.bairro,
                latitude: item.latitude || item.lat,
                longitude: item.longitude || item.lng,
                lat: item.lat || item.latitude,
                lng: item.lng || item.longitude,
                medidas: item.medidas,
                tipo: item.tipo,
                impacto_estimado: item.impacto_estimado,
                valor: item.valor,
                id_exibidora: item.exibidora_id
            }
        }));

        return new Response(JSON.stringify({
            ...proposal,
            itens: structuredItems
        }), {
            headers
        });
    }

    return new Response('Method not allowed', { status: 405, headers });
};
