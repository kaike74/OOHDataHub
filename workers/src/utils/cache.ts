import { Env } from '../index';

/**
 * Cache keys used throughout the application
 */
export const CACHE_KEYS = {
    STATS: 'stats',
    PONTOS_LIST: 'pontos:list',
    EXIBIDORAS_LIST: 'exibidoras:list',
    PONTO_BY_ID: (id: number) => `ponto:${id}`,
    EXIBIDORA_BY_ID: (id: number) => `exibidora:${id}`,
};

/**
 * Cache TTL (time to live) in seconds
 */
export const CACHE_TTL = {
    STATS: 3600, // 1 hour
    PONTOS_LIST: 300, // 5 minutes
    EXIBIDORAS_LIST: 300, // 5 minutes
    PONTO_DETAIL: 600, // 10 minutes
};

/**
 * Get cached data from KV
 */
export async function getCache<T>(env: Env, key: string): Promise<T | null> {
    try {
        const cached = await env.KV.get(key, 'json');
        return cached as T | null;
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}

/**
 * Set cached data in KV with TTL
 */
export async function setCache(
    env: Env,
    key: string,
    value: any,
    ttl: number
): Promise<void> {
    try {
        await env.KV.put(key, JSON.stringify(value), {
            expirationTtl: ttl,
        });
    } catch (error) {
        console.error('Cache set error:', error);
    }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(env: Env, key: string): Promise<void> {
    try {
        await env.KV.delete(key);
    } catch (error) {
        console.error('Cache invalidate error:', error);
    }
}

/**
 * Invalidate multiple cache keys
 */
export async function invalidateMultipleCache(env: Env, keys: string[]): Promise<void> {
    try {
        await Promise.all(keys.map((key) => env.KV.delete(key)));
    } catch (error) {
        console.error('Cache invalidate multiple error:', error);
    }
}

/**
 * Invalidate all ponto-related caches
 */
export async function invalidatePontoCache(env: Env, pontoId?: number): Promise<void> {
    const keysToInvalidate = [CACHE_KEYS.PONTOS_LIST, CACHE_KEYS.STATS];

    if (pontoId) {
        keysToInvalidate.push(CACHE_KEYS.PONTO_BY_ID(pontoId));
    }

    await invalidateMultipleCache(env, keysToInvalidate);
}

/**
 * Invalidate all exibidora-related caches
 */
export async function invalidateExibidoraCache(env: Env, exibidoraId?: number): Promise<void> {
    const keysToInvalidate = [CACHE_KEYS.EXIBIDORAS_LIST, CACHE_KEYS.STATS];

    if (exibidoraId) {
        keysToInvalidate.push(CACHE_KEYS.EXIBIDORA_BY_ID(exibidoraId));
    }

    await invalidateMultipleCache(env, keysToInvalidate);
}
