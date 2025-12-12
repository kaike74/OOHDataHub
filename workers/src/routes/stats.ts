import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { getCache, setCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';

export async function handleStats(request: Request, env: Env): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    if (request.method !== 'GET') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers,
        });
    }

    // Try to get from cache first
    const cachedStats = await getCache<any>(env, CACHE_KEYS.STATS);
    if (cachedStats) {
        console.log('Stats served from cache');
        return new Response(JSON.stringify(cachedStats), { headers });
    }

    // Cache miss - calculate stats
    console.log('Stats cache miss - calculating...');

    // Total de pontos ativos
    const totalPontos = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM pontos_ooh WHERE status = 'ativo'"
    ).first() as any;

    // Total de exibidoras
    const totalExibidoras = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM exibidoras'
    ).first() as any;

    // Valor médio
    const valorMedio = await env.DB.prepare(
        'SELECT AVG(valor) as media FROM produtos'
    ).first() as any;

    // Pontos por cidade (top 5)
    const { results: porCidade } = await env.DB.prepare(`
    SELECT cidade, COUNT(*) as count
    FROM pontos_ooh
    WHERE status = 'ativo' AND cidade IS NOT NULL
    GROUP BY cidade
    ORDER BY count DESC
    LIMIT 5
  `).all();

    // Produtos por tipo
    const { results: porTipo } = await env.DB.prepare(`
    SELECT tipo, COUNT(*) as count, AVG(valor) as valor_medio
    FROM produtos
    GROUP BY tipo
    ORDER BY count DESC
  `).all();

    const stats = {
        total_pontos: totalPontos?.count || 0,
        total_exibidoras: totalExibidoras?.count || 0,
        valor_medio: valorMedio?.media || 0,
        por_cidade: porCidade,
        por_tipo: porTipo,
    };

    // Cache the results
    await setCache(env, CACHE_KEYS.STATS, stats, CACHE_TTL.STATS);

    return new Response(JSON.stringify(stats), { headers });
}
