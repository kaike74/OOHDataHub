import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { uploadToCloudflareImages, getCloudflareImageUrl } from '../utils/images';

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

        // Upload para R2 (backup/fallback)
        const fileBuffer = await file.arrayBuffer();
        await env.R2.put(r2Key, fileBuffer, {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Upload para Cloudflare Images (otimização)
        const fileForCF = new File([fileBuffer], file.name, { type: file.type });
        const cfImageId = await uploadToCloudflareImages(env, fileForCF, {
            pontoId: pontoId || '',
            r2Key: r2Key,
            ehCapa: ehCapa ? 'true' : 'false',
        });

        // Salvar no banco se pontoId fornecido
        if (pontoId) {
            await env.DB.prepare(`
        INSERT INTO imagens (id_ponto, nome_arquivo, r2_key, cf_image_id, ordem, eh_capa)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
                pontoId,
                file.name,
                r2Key,
                cfImageId,
                ordem,
                ehCapa ? 1 : 0
            ).run();
        }

        // Return URLs - prefer Cloudflare Images if available
        const imageUrl = cfImageId
            ? getCloudflareImageUrl(env, cfImageId, 'public')
            : `/api/images/${encodeURIComponent(r2Key)}`;

        return new Response(JSON.stringify({
            success: true,
            r2_key: r2Key,
            cf_image_id: cfImageId,
            url: imageUrl,
            urls: cfImageId ? {
                thumbnail: getCloudflareImageUrl(env, cfImageId, 'thumbnail'),
                medium: getCloudflareImageUrl(env, cfImageId, 'medium'),
                large: getCloudflareImageUrl(env, cfImageId, 'large'),
                original: getCloudflareImageUrl(env, cfImageId, 'public'),
            } : undefined
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
    // Check if this is a Cloudflare Images request: /api/images/cf/<id>/<variant>
    const cfImageMatch = path.match(/^\/api\/images\/cf\/([^/]+)(?:\/([^/]+))?$/);

    if (cfImageMatch) {
        const [, imageId, variant = 'public'] = cfImageMatch;
        const cfUrl = getCloudflareImageUrl(env, imageId, variant);

        if (!cfUrl) {
            return new Response('Cloudflare Images not configured', { status: 503 });
        }

        // Redirect to Cloudflare Images URL
        return Response.redirect(cfUrl, 302);
    }

    // Otherwise, serve from R2 (backward compatibility)
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

        // Upload para R2 (backup/fallback)
        const fileBuffer = await file.arrayBuffer();
        await env.R2.put(r2Key, fileBuffer, {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Upload para Cloudflare Images (otimização)
        const fileForCF = new File([fileBuffer], file.name, { type: file.type });
        const cfImageId = await uploadToCloudflareImages(env, fileForCF, {
            exibidoraId: exibidoraId,
            r2Key: r2Key,
            type: 'logo',
        });

        // Atualizar logo_r2_key e cf_logo_id na tabela exibidoras
        await env.DB.prepare(`
            UPDATE exibidoras
            SET logo_r2_key = ?, cf_logo_id = ?
            WHERE id = ?
        `).bind(r2Key, cfImageId, exibidoraId).run();

        // Return URL - prefer Cloudflare Images if available
        const logoUrl = cfImageId
            ? getCloudflareImageUrl(env, cfImageId, 'public')
            : `/api/images/${encodeURIComponent(r2Key)}`;

        return new Response(JSON.stringify({
            success: true,
            r2_key: r2Key,
            cf_image_id: cfImageId,
            url: logoUrl,
            urls: cfImageId ? {
                thumbnail: getCloudflareImageUrl(env, cfImageId, 'thumbnail'),
                medium: getCloudflareImageUrl(env, cfImageId, 'medium'),
                large: getCloudflareImageUrl(env, cfImageId, 'large'),
                original: getCloudflareImageUrl(env, cfImageId, 'public'),
            } : undefined
        }), { headers });

    } catch (error: any) {
        console.error('Upload logo error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers,
        });
    }
}
