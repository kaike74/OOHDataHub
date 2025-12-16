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
            // Clean and normalize search term
            let searchTerm = query.trim();

            // Remove common prefixes (Rua, Avenida, etc)
            searchTerm = searchTerm.replace(/^(rua|avenida|av|alameda|travessa|praça|pça)\s+/i, '');

            // Remove accents for fuzzy matching
            const normalizedTerm = searchTerm
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase();

            // Split into words for partial matching
            const words = normalizedTerm.split(/\s+/).filter(w => w.length > 2);

            // Build LIKE conditions for each word
            const likePattern = `%${normalizedTerm}%`;

            // Search with fuzzy logic - matches any part of the string
            const { results } = await env.DB.prepare(`
                SELECT 
                    p.id, p.codigo_ooh, p.endereco, p.cidade, p.uf, p.pais,
                    p.latitude, p.longitude, p.tipo,
                    e.nome as exibidora_nome
                FROM pontos_ooh p
                LEFT JOIN exibidoras e ON p.id_exibidora = e.id
                WHERE 
                    LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        p.codigo_ooh, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ç', 'c')
                    ) LIKE ? COLLATE NOCASE
                    OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        p.endereco, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ç', 'c')
                    ) LIKE ? COLLATE NOCASE
                    OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        p.cidade, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ç', 'c')
                    ) LIKE ? COLLATE NOCASE
                    OR LOWER(p.uf) LIKE ? COLLATE NOCASE
                    OR LOWER(p.pais) LIKE ? COLLATE NOCASE
                    OR LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                        e.nome, 'á', 'a'), 'é', 'e'), 'í', 'i'), 'ó', 'o'), 'ú', 'u'), 'ç', 'c')
                    ) LIKE ? COLLATE NOCASE
                LIMIT 10
            `).bind(likePattern, likePattern, likePattern, likePattern, likePattern, likePattern).all();

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
