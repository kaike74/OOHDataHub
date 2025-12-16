import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export async function handleSearch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'GET') {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');

        if (!query || query.trim().length < 2) {
            return new Response(JSON.stringify([]), {
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' }
            });
        }

        try {
            const searchTerm = `%${query.trim()}%`;

            // Search in multiple fields
            const { results } = await env.DB.prepare(`
                SELECT 
                    p.id, p.codigo_ooh, p.endereco, p.cidade, p.uf, p.pais,
                    p.latitude, p.longitude, p.tipo,
                    e.nome as exibidora_nome
                FROM pontos_ooh p
                LEFT JOIN exibidoras e ON p.id_exibidora = e.id
                WHERE 
                    p.codigo_ooh LIKE ? COLLATE NOCASE
                    OR p.endereco LIKE ? COLLATE NOCASE
                    OR p.cidade LIKE ? COLLATE NOCASE
                    OR p.uf LIKE ? COLLATE NOCASE
                    OR p.pais LIKE ? COLLATE NOCASE
                    OR e.nome LIKE ? COLLATE NOCASE
                LIMIT 10
            `).bind(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm).all();

            return new Response(JSON.stringify(results), {
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' }
            });
        } catch (error: any) {
            console.error('Search error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' }
            });
        }
    }

    return new Response('Method not allowed', {
        status: 405,
        headers: { ...corsHeaders(request, env) }
    });
}
