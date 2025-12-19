
import { Env } from '../index';
import { verifyToken, extractToken, requireAuth } from '../utils/auth';

// Helper to authenticate CLIENT users
async function requireClientAuth(request: Request, env: Env) {
    const token = extractToken(request);
    if (!token) throw new Error('No token provided');

    const payload = await verifyToken(token);
    if (!payload) throw new Error('Invalid token');

    if (payload.role !== 'client') throw new Error('Unauthorized');

    // Verify user exists in client_users
    const user = await env.DB.prepare(
        'SELECT id, client_id, name, email FROM client_users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user) throw new Error('User not found');

    return user;
}

export const handlePortal = async (request: Request, env: Env, path: string) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    try {
        // GET /api/portal/proposals - List shared proposals for the logged-in client
        if (path === '/api/portal/proposals' && request.method === 'GET') {
            const user = await requireClientAuth(request, env);

            const { results } = await env.DB.prepare(`
                SELECT 
                    p.id, p.nome, p.created_at, p.status,
                    p.comissao, -- Included but null/empty for consistency
                    c.id as client_id,
                    c.nome as client_name,
                    c.logo_url as client_logo,
                    creator.name as creator_name,
                    creator.email as creator_email,
                    p.created_by,
                    -- Calculated totals
                    COUNT(pi.id) as total_itens,
                    SUM(pi.valor_locacao + pi.valor_papel + pi.valor_lona) as total_valor,
                    SUM(COALESCE(pi.fluxo_diario, po.fluxo, 0)) as total_impactos
                FROM propostas p
                JOIN proposta_shares ps ON p.id = ps.proposal_id
                JOIN clientes c ON p.id_cliente = c.id
                LEFT JOIN client_users creator ON p.created_by = creator.id
                LEFT JOIN proposta_itens pi ON p.id = pi.id_proposta
                LEFT JOIN pontos_ooh po ON pi.id_ooh = po.id
                WHERE ps.client_user_id = ?
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `).bind(user.id).all();

            // Transform results to match AdminProposal interface exact expectations if needed
            // The query aliases should handle most of it:
            // id, nome, created_at, status, comissao, client_id, client_name, client_logo, total_itens, total_valor
            // Missing: shared_with (can be empty array for clients)

            const proposals = results.map((r: any) => ({
                ...r,
                shared_with: [] // Clients don't see who else it's shared with
            }));

            return new Response(JSON.stringify(proposals), { headers });

            return new Response(JSON.stringify(results), { headers });
        }

        // GET /api/portal/proposals/:id - View details (RESTRICTED)
        if (path.startsWith('/api/portal/proposals/') && request.method === 'GET') {
            const user = await requireClientAuth(request, env);
            const proposalId = path.split('/').pop();

            // Verify access
            const share = await env.DB.prepare(
                'SELECT id FROM proposta_shares WHERE proposal_id = ? AND client_user_id = ?'
            ).bind(proposalId, user.id).first();

            if (!share) {
                return new Response(JSON.stringify({ error: 'Proposal not found or access denied' }), { status: 403, headers });
            }

            // Get Proposal Details
            const proposal = await env.DB.prepare(
                'SELECT p.id, p.nome, p.created_at, p.status, p.comissao FROM propostas p WHERE p.id = ?'
            ).bind(proposalId).first();

            // Get Items (Restricted columns)
            const { results: items } = await env.DB.prepare(`
                SELECT 
                    pi.id, pi.id_proposta, pi.id_ooh, 
                    pi.periodo_inicio, pi.periodo_fim, 
                    pi.valor_locacao, pi.valor_papel, pi.valor_lona,
                    pi.periodo_comercializado, pi.qtd_bi_mes, pi.observacoes, 
                    COALESCE(pi.fluxo_diario, po.fluxo, 0) as fluxo_diario,
                    po.codigo_ooh, po.endereco, po.bairro, po.cidade, po.uf,
                    po.latitude, po.longitude, po.tipo, po.medidas, po.formato,
                    po.ponto_referencia, po.produtos,
                    e.nome as exibidora
                FROM proposta_itens pi 
                JOIN pontos_ooh po ON pi.id_ooh = po.id 
                LEFT JOIN exibidoras e ON po.id_exibidora = e.id
                WHERE pi.id_proposta = ?
            `).bind(proposalId).all();

            /* Client Pricing Logic:
             * IF Proposal Commission is 'CLIENT' (Created by Client user)
             * THEN Recalculate values dynamically (Double Base) to ensure consistency (ignoring potential sync errors)
             * ELSE Use stored values (Respects Agency Commission V1-V4)
             */
            const isClientCommission = proposal.comissao === 'CLIENT';

            // Format monetary values
            const processedItems = items.map((item: any) => {
                let valor_locacao = item.valor_locacao || 0;
                let valor_papel = item.valor_papel || 0;
                let valor_lona = item.valor_lona || 0;

                // Dynamic Recalculation for CLIENT commission
                if (isClientCommission && item.produtos) {
                    try {
                        const produtos = JSON.parse(item.produtos);
                        const locacaoProd = produtos.find((p: any) =>
                            p.tipo.toLowerCase().includes('locação') ||
                            p.tipo.toLowerCase().includes('locacao') ||
                            p.tipo.toLowerCase().includes('bissemanal')
                        );
                        if (locacaoProd) {
                            valor_locacao = locacaoProd.valor * 2;
                        }

                        const papelProd = produtos.find((p: any) => p.tipo.toLowerCase().includes('papel'));
                        if (papelProd) {
                            valor_papel = papelProd.valor * 1.25;
                        }

                        const lonaProd = produtos.find((p: any) => p.tipo.toLowerCase().includes('lona'));
                        if (lonaProd) {
                            valor_lona = lonaProd.valor * 1.25;
                        }
                    } catch (e) {
                        console.error('Error parsing products JSON for recalculation', e);
                    }
                }

                return {
                    ...item,
                    valor_locacao,
                    valor_papel,
                    valor_lona,
                    lat: item.latitude,
                    lng: item.longitude
                };
            });

            return new Response(JSON.stringify({
                ...proposal,
                itens: processedItems
            }), { headers });
        }

        // GET /api/portal/points - List ALL points (Simplified for Map)
        if (path === '/api/portal/points' && request.method === 'GET') {
            const user = await requireClientAuth(request, env);

            const { results } = await env.DB.prepare(`
                SELECT 
                    p.id, p.latitude, p.longitude, 
                    p.endereco, p.cidade, p.uf, p.codigo_ooh,
                    p.tipo, p.medidas, p.id_exibidora, p.fluxo as impactos,
                    e.nome as exibidora_nome
                FROM pontos_ooh p
                LEFT JOIN exibidoras e ON p.id_exibidora = e.id
                WHERE p.status = 'ativo'
            `).all();

            return new Response(JSON.stringify(results), { headers });
        }

        // POST /api/portal/share - Share proposal with client user (Agency Only)
        if (path === '/api/portal/share' && request.method === 'POST') {
            // This requires AGENCY auth
            await requireAuth(request, env);

            const { proposal_id, client_user_id } = await request.json() as any;

            if (!proposal_id || !client_user_id) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400, headers });
            }

            // Upsert (ignore if already exists)
            await env.DB.prepare(
                'INSERT OR IGNORE INTO proposta_shares (proposal_id, client_user_id) VALUES (?, ?)'
            ).bind(proposal_id, client_user_id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // PUT /api/portal/proposals/:id/items - Client update (Restricted)
        if (path.startsWith('/api/portal/proposals/') && path.endsWith('/items') && request.method === 'PUT') {
            const user = await requireClientAuth(request, env);
            const proposalId = path.split('/')[4]; // /api/portal/proposals/:id/items

            // Verify access
            const share = await env.DB.prepare(
                'SELECT id FROM proposta_shares WHERE proposal_id = ? AND client_user_id = ?'
            ).bind(proposalId, user.id).first();

            if (!share) {
                return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers });
            }

            const data = await request.json() as any;
            if (!Array.isArray(data.itens)) {
                return new Response(JSON.stringify({ error: 'Invalid data' }), { status: 400, headers });
            }

            // Sync Logic
            const incomingItems = data.itens;
            const incomingIds = incomingItems.map((i: any) => i.id).filter((id: number) => id);

            const batch = [];

            // 1. Delete items not in incoming list (Removal)
            // Get current IDs
            const currentItems = await env.DB.prepare('SELECT id FROM proposta_itens WHERE id_proposta = ?').bind(proposalId).all();
            const currentIds = currentItems.results.map((i: any) => i.id);

            const idsToDelete = currentIds.filter((id) => !incomingIds.includes(id));

            if (idsToDelete.length > 0) {
                const placeholders = idsToDelete.map(() => '?').join(',');
                batch.push(env.DB.prepare(`DELETE FROM proposta_itens WHERE id IN (${placeholders})`).bind(...idsToDelete));
            }

            // 2. Update existing items (ONLY safe fields: period, obs, commercialized, flux)
            // 3. Insert new items (if any, though client mostly edits existing)
            for (const item of incomingItems) {
                if (item.id && currentIds.includes(item.id)) {
                    // Update
                    batch.push(env.DB.prepare(`
                        UPDATE proposta_itens SET 
                            periodo_inicio = ?, 
                            periodo_fim = ?, 
                            periodo_comercializado = ?, 
                            observacoes = ?,
                            fluxo_diario = ?
                        WHERE id = ? AND id_proposta = ?
                    `).bind(
                        item.periodo_inicio,
                        item.periodo_fim,
                        item.periodo_comercializado,
                        item.observacoes,
                        item.fluxo_diario,
                        item.id,
                        proposalId
                    ));
                } else if (item.id_ooh) {
                    // Insert new (Ghost points or added via map)
                    // Defaults for costs to 0 as client can't set them, logic?
                    // User said: "adicionar pontos - no mapa aparece como pontos 'fantasma' que depois a agencia vai precisar validar"
                    // So we insert with status 'pending' maybe? or just standard.
                    // For now, insert with 0 costs.
                    batch.push(env.DB.prepare(`
                        INSERT INTO proposta_itens (
                            id_proposta, id_ooh, periodo_inicio, periodo_fim, 
                            valor_locacao, valor_papel, valor_lona, 
                            periodo_comercializado, observacoes, fluxo_diario, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente_validacao')
                    `).bind(
                        proposalId, item.id_ooh, item.periodo_inicio, item.periodo_fim,
                        item.valor_locacao || 0, item.valor_papel || 0, item.valor_lona || 0,
                        item.periodo_comercializado || 'bissemanal', item.observacoes, item.fluxo_diario
                    ));
                }
            }

            if (batch.length > 0) {
                await env.DB.batch(batch);
            }

            return new Response(JSON.stringify({ success: true }), { headers });
        }

    } catch (e: any) {
        console.error(e);
        const status = e.message === 'Unauthorized' || e.message === 'No token provided' || e.message === 'Invalid token' ? 401 : 500;
        return new Response(JSON.stringify({ error: e.message }), { status, headers });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
};
