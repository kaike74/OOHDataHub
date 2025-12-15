import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export async function handleUpload(request: Request, env: Env): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers,
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const pontoId = formData.get('pontoId') as string;
        const ordem = parseInt(formData.get('ordem') as string || '0');
        const ehCapa = formData.get('ehCapa') === 'true';

        if (!file) {
            return new Response(JSON.stringify({ error: 'Arquivo não enviado' }), {
                status: 400,
                headers,
            });
        }

        // Gerar key única
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const r2Key = `pontos/${pontoId}/${timestamp}.${ext}`;

        // Upload para R2
        await env.R2.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Salvar no banco se pontoId fornecido
        if (pontoId) {
            await env.DB.prepare(`
        INSERT INTO imagens (id_ponto, nome_arquivo, r2_key, ordem, eh_capa)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
                pontoId,
                file.name,
                r2Key,
                ordem,
                ehCapa ? 1 : 0
            ).run();
        }

        return new Response(JSON.stringify({
            success: true,
            r2_key: r2Key,
            url: `/api/images/${encodeURIComponent(r2Key)}`
        }), { headers });

    } catch (error: any) {
        console.error('Upload error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
        });
    }
}

export async function handleImage(request: Request, env: Env, path: string): Promise<Response> {
    const r2Key = decodeURIComponent(path.replace('/api/images/', ''));

    if (!r2Key) {
        return new Response('Image key required', { status: 400 });
    }

    const object = await env.R2.get(r2Key);

    if (!object) {
        return new Response('Image not found', { status: 404 });
    }

    const headers: Record<string, string> = {
        ...corsHeaders(request, env),
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
    };

    return new Response(object.body, { headers });
}

export async function handleUploadLogo(request: Request, env: Env): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers,
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const exibidoraId = formData.get('exibidoraId') as string;

        if (!file) {
            return new Response(JSON.stringify({ error: 'Arquivo não enviado' }), {
                status: 400,
                headers,
            });
        }

        if (!exibidoraId) {
            return new Response(JSON.stringify({ error: 'exibidoraId é obrigatório' }), {
                status: 400,
                headers,
            });
        }

        // Gerar key única
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const r2Key = `exibidoras/${exibidoraId}/${timestamp}.${ext}`;

        // Upload para R2
        await env.R2.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Atualizar logo_r2_key na tabela exibidoras
        await env.DB.prepare(`
            UPDATE exibidoras 
            SET logo_r2_key = ?
            WHERE id = ?
        `).bind(r2Key, exibidoraId).run();

        return new Response(JSON.stringify({
            success: true,
            r2_key: r2Key,
            url: `/api/images/${encodeURIComponent(r2Key)}`
        }), { headers });

    } catch (error: any) {
        console.error('Upload logo error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
        });
    }
}

export async function handleUploadClientLogo(request: Request, env: Env): Promise<Response> {
    const headers = { ...corsHeaders(request, env), 'Content-Type': 'application/json' };

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers,
        });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const clienteId = formData.get('clienteId') as string;

        if (!file) {
            return new Response(JSON.stringify({ error: 'Arquivo não enviado' }), {
                status: 400,
                headers,
            });
        }

        if (!clienteId) {
            return new Response(JSON.stringify({ error: 'clienteId é obrigatório' }), {
                status: 400,
                headers,
            });
        }

        // Gerar key única
        const timestamp = Date.now();
        const ext = file.name.split('.').pop();
        const r2Key = `clientes/${clienteId}/${timestamp}.${ext}`;

        // Upload para R2
        await env.R2.put(r2Key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Atualizar logo_url na tabela clientes (using r2 key is standard here?)
        // In other tables it's `logo_r2_key`. But `clientes` schema has `logo_url`.
        // Let's store the R2 Key in `logo_url` field, or full URL?
        // The schema says `logo_url` TEXT.
        // Existing `getClientes` logic (in clientes.ts) probably sends `logo_url`.
        // If I store R2 key, I need a way to resolve it.
        // `api.getImageUrl` takes an R2 key.
        // So I should store R2 key in `logo_url` column to be consistent with usage, OR store the full /api/images/... path.
        // `exibidoras` stores `logo_r2_key`.
        // `getClientes` should ideally return a resolvable URL or I should store the key and handle it in frontend.
        // Let's store the R2 Key for now, and I will check `clientes.ts` later to ensure it handles it or I update frontend to use `getImageUrl`.

        // Actually, let's verify `clientes` table schema again.
        // `migrations/0015...sql`: `logo_url TEXT`.
        // In `clientes.ts`, valid logic?
        // Let's assume storing the R2 KEY is the safest bet for `logo_url` column if we want to use `getImageUrl`.
        // Or I can store `/api/images/<key>`.
        // Let's stick to R2 Key standard from `uploadLogo`.

        await env.DB.prepare(`
            UPDATE clientes 
            SET logo_url = ?
            WHERE id = ?
        `).bind(r2Key, clienteId).run();

        return new Response(JSON.stringify({
            success: true,
            r2_key: r2Key, // This is what is stored
            url: `/api/images/${encodeURIComponent(r2Key)}`
        }), { headers });

    } catch (error: any) {
        console.error('Upload client logo error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
        });
    }
}
