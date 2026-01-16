
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

        // Get items - USING EXACT SAME QUERY AS ADMIN VIEW
        const { results: itens } = await env.DB.prepare(`
        SELECT 
            pi.id, pi.id_proposta, pi.id_ooh, pi.periodo_inicio, pi.periodo_fim, 
            pi.valor_locacao, pi.valor_papel, pi.valor_lona, 
            pi.periodo_comercializado, pi.observacoes, pi.fluxo_diario, pi.status,
            pi.status_validacao, pi.approved_until, pi.last_validated_at, pi.selected_periods,
            val_user.name as validator_name,
            p.endereco, p.cidade, p.uf, p.pais, p.codigo_ooh, p.tipo, p.medidas, p.ponto_referencia,
            p.latitude, p.longitude,
            e.nome as exibidora_nome
        FROM proposta_itens pi
        JOIN pontos_ooh p ON pi.id_ooh = p.id
        LEFT JOIN exibidoras e ON p.id_exibidora = e.id
        LEFT JOIN users val_user ON pi.last_validated_by = val_user.id
        WHERE pi.id_proposta = ?
    `).bind(proposal.id).all();

        // Parse selected_periods - EXACT SAME AS ADMIN VIEW
        const parsedItens = itens.map((item: any) => ({
            ...item,
            selected_periods: item.selected_periods ? JSON.parse(item.selected_periods) : []
        }));

        // Build cliente object from proposal data
        const cliente = proposal.id_cliente ? {
            id: proposal.id_cliente,
            nome: proposal.cliente_nome,
            logo_url: proposal.cliente_logo
        } : null;

        return new Response(JSON.stringify({
            ...proposal,
            cliente,
            itens: parsedItens
        }), {
            headers
        });
    }

    return new Response('Method not allowed', { status: 405, headers });
};
