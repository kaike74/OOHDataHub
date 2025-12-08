import { Env } from '../index';

export function corsHeaders(request: Request, env: Env): Record<string, string> {
    const origin = request.headers.get('Origin') || '*';
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];

    const allowOrigin = allowedOrigins.includes('*') || allowedOrigins.includes(origin)
        ? origin
        : allowedOrigins[0];

    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
    };
}

export function handleOptions(request: Request, env: Env): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(request, env),
    });
}
