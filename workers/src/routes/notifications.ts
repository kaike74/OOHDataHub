import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { requireAuth } from '../utils/auth';

export async function handleNotifications(request: Request, env: Env, path: string): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    try {
        // GET /api/notifications - List user notifications
        if (request.method === 'GET' && path === '/api/notifications') {
            const user = await requireAuth(request, env);

            const { results } = await env.DB.prepare(`
                SELECT 
                    n.*,
                    p.nome as proposal_name,
                    u.name as related_user_name,
                    u.email as related_user_email
                FROM notifications n
                LEFT JOIN propostas p ON n.related_proposal_id = p.id
                LEFT JOIN users u ON n.related_user_id = u.id
                WHERE n.user_id = ?
                ORDER BY n.created_at DESC
                LIMIT 50
            `).bind(user.id).all();

            // Get unread count
            const unreadCount = await env.DB.prepare(
                'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0'
            ).bind(user.id).first() as { count: number } | null;

            return new Response(JSON.stringify({
                notifications: results,
                unreadCount: unreadCount?.count || 0
            }), { headers });
        }

        // POST /api/notifications/:id/read - Mark notification as read
        if (request.method === 'POST' && path.match(/^\/api\/notifications\/\d+\/read$/)) {
            const user = await requireAuth(request, env);
            const notificationId = path.split('/')[3];

            // Verify notification belongs to user
            const notification = await env.DB.prepare(
                'SELECT user_id FROM notifications WHERE id = ?'
            ).bind(notificationId).first();

            if (!notification) {
                return new Response(JSON.stringify({ error: 'Notification not found' }), { status: 404, headers });
            }

            if (notification.user_id !== user.id) {
                return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 403, headers });
            }

            await env.DB.prepare(
                'UPDATE notifications SET is_read = 1 WHERE id = ?'
            ).bind(notificationId).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        // POST /api/notifications/read-all - Mark all as read
        if (request.method === 'POST' && path === '/api/notifications/read-all') {
            const user = await requireAuth(request, env);

            await env.DB.prepare(
                'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0'
            ).bind(user.id).run();

            return new Response(JSON.stringify({ success: true }), { headers });
        }

        return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers });
    } catch (error: any) {
        console.error('Error in handleNotifications:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), { status: 500, headers });
    }
}

// Helper function to create notifications
export async function createNotification(
    env: Env,
    data: {
        userId: number;
        type: 'access_request' | 'access_granted' | 'share_invite' | 'validation_request' | 'proposal_approved';
        title: string;
        message?: string;
        relatedProposalId?: number;
        relatedUserId?: number;
    }
): Promise<void> {
    await env.DB.prepare(`
        INSERT INTO notifications (user_id, type, title, message, related_proposal_id, related_user_id)
        VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
        data.userId,
        data.type,
        data.title,
        data.message || null,
        data.relatedProposalId || null,
        data.relatedUserId || null
    ).run();
}
