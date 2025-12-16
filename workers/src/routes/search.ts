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
            // Normalize search term (remove accents, til, special chars)
            let searchTerm = query.trim();

            // Remove common prefixes
            searchTerm = searchTerm.replace(/^(rua|avenida|av|alameda|travessa|praça|pça)\s+/i, '');

            // Normalize: remove accents and til
            searchTerm = searchTerm
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remove accents
                .replace(/~/g, '') // Remove til
                .toLowerCase();

            const likePattern = `%${searchTerm}%`;

            // Simpler query - just use LOWER for case-insensitive search
            const { results } = await env.DB.prepare(`
                SELECT 
                    p.id, p.codigo_ooh, p.endereco, p.cidade, p.uf, p.pais,
                    p.latitude, p.longitude, p.tipo,
                    e.nome as exibidora_nome
                FROM pontos_ooh p
                LEFT JOIN exibidoras e ON p.id_exibidora = e.id
                WHERE 
                    LOWER(p.codigo_ooh) LIKE ? 
                    OR LOWER(p.endereco) LIKE ?
                    OR LOWER(p.cidade) LIKE ?
                    OR LOWER(p.uf) LIKE ?
                    OR LOWER(p.pais) LIKE ?
                    OR LOWER(e.nome) LIKE ?
                LIMIT 10
            `).bind(likePattern, likePattern, likePattern, likePattern, likePattern, likePattern).all();

            return new Response(JSON.stringify(results), {
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' }
            });
        } catch (error: any) {
            console.error('Search error:', error);
            return new Response(JSON.stringify({ error: error.message, results: [] }), {
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
