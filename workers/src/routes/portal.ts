
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
                    c.nome as cliente_nome,
                    -- Calculated totals
                    COUNT(pi.id) as total_itens,
                    SUM(pi.valor_locacao + pi.valor_papel + pi.valor_lona) as total_investimento,
                    SUM(po.impactos) as total_impactos
                FROM propostas p
                JOIN proposta_shares ps ON p.id = ps.proposal_id
                JOIN clientes c ON p.id_cliente = c.id
                LEFT JOIN proposta_itens pi ON p.id = pi.id_proposta
                LEFT JOIN pontos_ooh po ON pi.id_ooh = po.id
                WHERE ps.client_user_id = ?
                GROUP BY p.id
                ORDER BY p.created_at DESC
            `).bind(user.id).all();

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
                'SELECT p.id, p.nome, p.created_at, p.status FROM propostas p WHERE p.id = ?'
            ).bind(proposalId).first();

            // Get Items (Restricted columns)
            const { results: items } = await env.DB.prepare(`
                SELECT 
                    pi.id, pi.periodo_inicio, pi.periodo_fim, 
                    pi.status, pi.client_comment,
                    po.codigo_ooh, po.endereco, po.cidade, po.uf, NULL as bairro,
                    po.latitude, po.longitude, po.medidas, po.tipo,
                    po.impactos,
                    (pi.valor_locacao + pi.valor_papel + pi.valor_lona) as valor_total
                FROM proposta_itens pi
                JOIN pontos_ooh po ON pi.id_ooh = po.id
                WHERE pi.id_proposta = ?
            `).bind(proposalId).all();

            return new Response(JSON.stringify({
                ...proposal,
                itens: items
            }), { headers });
        }

        // GET /api/portal/points - List ALL points (Simplified for Map)
        if (path === '/api/portal/points' && request.method === 'GET') {
            const user = await requireClientAuth(request, env);

            const { results } = await env.DB.prepare(`
                SELECT 
                    p.id, p.latitude, p.longitude, 
                    p.endereco, p.cidade, p.uf, p.codigo_ooh,
                    p.tipo, p.medidas, p.id_exibidora, p.impactos,
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
                        ) VALUES (?, ?, ?, ?, 0, 0, 0, ?, ?, ?, 'pendente_validacao')
                    `).bind(
                        proposalId, item.id_ooh, item.periodo_inicio, item.periodo_fim,
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
