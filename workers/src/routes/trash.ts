import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { requireAuth, extractToken, verifyToken } from '../utils/auth';
import { logAudit } from '../utils/audit';

export const handleTrash = async (request: Request, env: Env, path: string) => {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    try {
        await requireAuth(request, env);
        const token = extractToken(request);
        const payload = await verifyToken(token!);
        const userId = payload!.userId;

        // GET /api/trash/:type - List deleted items
        if (request.method === 'GET' && path.match(/^\/api\/trash\/[\w-]+$/)) {
            const type = path.split('/').pop();

            if (type === 'proposals') {
                const { results } = await env.DB.prepare(`
                    SELECT p.*, c.nome as client_name 
                    FROM propostas p
                    JOIN clientes c ON p.id_cliente = c.id
                    WHERE p.deleted_at IS NOT NULL
                    ORDER BY p.deleted_at DESC
                `).all();
                return new Response(JSON.stringify(results), { headers });
            }

            if (type === 'points') {
                const { results } = await env.DB.prepare(`
                    SELECT * FROM pontos_ooh WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC
                `).all();
                return new Response(JSON.stringify(results), { headers });
            }

            return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });
        }

        // POST /api/trash/:type/:id/restore - Restore item
        if (request.method === 'POST' && path.match(/^\/api\/trash\/[\w-]+\/\d+\/restore$/)) {
            const parts = path.split('/');
            const type = parts[3];
            const id = parts[4];

            let tableName = '';
            if (type === 'proposals') tableName = 'propostas';
            if (type === 'points') tableName = 'pontos_ooh';

            if (!tableName) return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

            const res = await env.DB.prepare(`UPDATE ${tableName} SET deleted_at = NULL, status = 'ativo' WHERE id = ?`).bind(id).run();

            if (res.meta.changes === 0) {
                return new Response(JSON.stringify({ error: 'Item not found in trash' }), { status: 404, headers });
            }

            await logAudit(env, {
                tableName: tableName,
                recordId: Number(id),
                action: 'RESTORE',
                changedBy: userId,
                userType: 'agency',
                changes: { restore_date: new Date().toISOString() }
            });

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // DELETE /api/trash/:type/:id - Permanent Delete
        if (request.method === 'DELETE' && path.match(/^\/api\/trash\/[\w-]+\/\d+$/)) {
            const parts = path.split('/');
            const type = parts[3];
            const id = parts[4];

            let tableName = '';
            if (type === 'proposals') tableName = 'propostas';
            if (type === 'points') tableName = 'pontos_ooh';

            if (!tableName) return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400, headers });

            // If proposals, delete items and shares first
            if (tableName === 'propostas') {
                await env.DB.prepare('DELETE FROM proposta_itens WHERE id_proposta = ?').bind(id).run();
                await env.DB.prepare('DELETE FROM proposta_shares WHERE proposal_id = ?').bind(id).run();
                await env.DB.prepare('DELETE FROM proposal_layers WHERE id_proposta = ?').bind(id).run();
            }

            const res = await env.DB.prepare(`DELETE FROM ${tableName} WHERE id = ?`).bind(id).run();

            if (res.meta.changes === 0) {
                return new Response(JSON.stringify({ error: 'Item not found' }), { status: 404, headers });
            }

            await logAudit(env, {
                tableName: tableName,
                recordId: Number(id),
                action: 'DELETE', // Permanent
                changedBy: userId,
                userType: 'agency',
                changes: { action: 'permanent_delete', deleted_at: new Date().toISOString() }
            });

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers });

    } catch (e: any) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers });
    }
};
