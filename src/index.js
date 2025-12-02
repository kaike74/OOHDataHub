// ===================================
// CLOUDFLARE WORKERS API FOR OOH SYSTEM
// ===================================

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const path = url.pathname;

        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle OPTIONS request for CORS
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // Route handling
            if (path === '/api/ooh' && request.method === 'GET') {
                return await getOOHPoints(env, corsHeaders);
            }

            if (path === '/api/ooh' && request.method === 'POST') {
                return await createOOHPoint(request, env, corsHeaders);
            }

            if (path === '/api/exibidoras' && request.method === 'GET') {
                return await getExibidoras(env, corsHeaders);
            }

            if (path === '/api/exibidoras' && request.method === 'POST') {
                return await createExibidora(request, env, corsHeaders);
            }

            if (path.startsWith('/api/image/') && request.method === 'GET') {
                const key = path.replace('/api/image/', '');
                return await getImage(key, env, corsHeaders);
            }

            // 404 for unknown routes
            return new Response(JSON.stringify({ error: 'Not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('Error:', error);
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// ===================================
// GET ALL OOH POINTS
// ===================================

async function getOOHPoints(env, corsHeaders) {
    try {
        const query = `
            SELECT 
                o.*,
                e.nome as exibidora_nome
            FROM ooh o
            LEFT JOIN exibidoras e ON o.id_exibidora = e.id
            ORDER BY o.created_at DESC
        `;

        const result = await env.DB.prepare(query).all();

        return new Response(JSON.stringify(result.results || []), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching OOH points:', error);
        throw error;
    }
}

// ===================================
// CREATE NEW OOH POINT
// ===================================

async function createOOHPoint(request, env, corsHeaders) {
    try {
        const formData = await request.formData();

        // Extract form fields
        const codigo_ooh = formData.get('codigo_ooh');
        const id_exibidora = formData.get('id_exibidora');
        const endereco = formData.get('endereco');
        const ponto_referencia = formData.get('ponto_referencia');
        const streetview_embed = formData.get('streetview_embed');
        const latitude = formData.get('latitude');
        const longitude = formData.get('longitude');
        const cidade = formData.get('cidade');
        const uf = formData.get('uf');
        const medidas = formData.get('medidas');
        const fluxo = formData.get('fluxo');
        const observacoes = formData.get('observacoes');
        const produtos = formData.get('produtos'); // JSON string
        const valor = formData.get('valor');
        const imagem = formData.get('imagem'); // File

        // Validate required fields
        if (!codigo_ooh || !endereco) {
            return new Response(JSON.stringify({ error: 'Campos obrigatórios faltando' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Insert into ooh table
        const insertOOH = await env.DB.prepare(`
            INSERT INTO ooh (
                codigo_ooh, id_exibidora, endereco, produtos, ponto_referencia,
                streetview_embed, cidade, uf, latitude, longitude, fluxo, medidas,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
            codigo_ooh,
            id_exibidora || null,
            endereco,
            produtos || null,
            ponto_referencia || null,
            streetview_embed || null,
            cidade || null,
            uf || null,
            latitude ? parseFloat(latitude) : null,
            longitude ? parseFloat(longitude) : null,
            fluxo || null,
            medidas || null
        ).run();

        const oohId = insertOOH.meta.last_row_id;

        // Handle image upload to R2
        let imageKey = null;
        if (imagem && imagem.size > 0) {
            const timestamp = Date.now();
            const fileName = imagem.name || 'image.jpg';
            imageKey = `${timestamp}-${fileName}`;

            // Upload to R2
            await env.R2.put(imageKey, imagem.stream(), {
                httpMetadata: {
                    contentType: imagem.type || 'image/jpeg'
                }
            });

            // Insert into imagens table
            await env.DB.prepare(`
                INSERT INTO imagens (
                    id_ooh, nome_imagem, r2_key, tipo_imagem, eh_capa, created_at
                ) VALUES (?, ?, ?, ?, 1, datetime('now'))
            `).bind(
                oohId,
                fileName,
                imageKey,
                imagem.type || 'image/jpeg'
            ).run();
        }

        // Insert product pricing
        const productsDetailed = formData.get('products_detailed');

        if (productsDetailed) {
            try {
                const productsArray = JSON.parse(productsDetailed);

                for (const produto of productsArray) {
                    await env.DB.prepare(`
                        INSERT INTO produtos (
                            id_ooh, produto, v1, tipo_periodo, created_at
                        ) VALUES (?, ?, ?, ?, datetime('now'))
                    `).bind(
                        oohId,
                        produto.tipo,
                        parseFloat(produto.valor),
                        produto.periodo || 'Mensal'
                    ).run();
                }
            } catch (e) {
                console.error('Error inserting detailed products:', e);
            }
        } else if (valor && produtos) {
            // Legacy fallback
            try {
                const produtosArray = JSON.parse(produtos);

                for (const produto of produtosArray) {
                    await env.DB.prepare(`
                        INSERT INTO produtos (
                            id_ooh, produto, v1, tipo_periodo, created_at
                        ) VALUES (?, ?, ?, 'Mensal', datetime('now'))
                    `).bind(
                        oohId,
                        produto,
                        parseFloat(valor)
                    ).run();
                }
            } catch (e) {
                console.error('Error inserting legacy products:', e);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            id: oohId,
            message: 'Ponto OOH cadastrado com sucesso'
        }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating OOH point:', error);

        // Check for unique constraint violation
        if (error.message.includes('UNIQUE')) {
            return new Response(JSON.stringify({ error: 'Código OOH já existe' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw error;
    }
}

// ===================================
// GET ALL EXHIBITORS
// ===================================

async function getExibidoras(env, corsHeaders) {
    try {
        const query = `
            SELECT id, nome
            FROM exibidoras
            ORDER BY nome ASC
        `;

        const result = await env.DB.prepare(query).all();

        return new Response(JSON.stringify(result.results || []), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('Error fetching exibidoras:', error);
        throw error;
    }
}

// ===================================
// CREATE NEW EXHIBITOR
// ===================================

async function createExibidora(request, env, corsHeaders) {
    try {
        const formData = await request.formData();

        const nome = formData.get('nome');
        const cnpj = formData.get('cnpj');
        const razao_social = formData.get('razao_social');
        const endereco_faturamento = formData.get('endereco_faturamento');
        const observacoes = formData.get('observacoes');
        const logo = formData.get('logo'); // File

        // Validate required fields
        if (!nome) {
            return new Response(JSON.stringify({ error: 'Nome é obrigatório' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Handle logo upload to R2
        let logoKey = null;
        if (logo && logo.size > 0) {
            const timestamp = Date.now();
            const fileName = logo.name || 'logo.jpg';
            logoKey = `logos/${timestamp}-${fileName}`;

            await env.R2.put(logoKey, logo.stream(), {
                httpMetadata: {
                    contentType: logo.type || 'image/jpeg'
                }
            });
        }

        // Insert into exibidoras table
        const result = await env.DB.prepare(`
            INSERT INTO exibidoras (
                nome, razao_social, cnpj, endereco_faturamento, observacoes,
                logo_exibidora, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `).bind(
            nome,
            razao_social || null,
            cnpj || null,
            endereco_faturamento || null,
            observacoes || null,
            logoKey
        ).run();

        return new Response(JSON.stringify({
            success: true,
            id: result.meta.last_row_id,
            message: 'Exibidora cadastrada com sucesso'
        }), {
            status: 201,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error creating exibidora:', error);

        // Check for unique constraint violation
        if (error.message.includes('UNIQUE')) {
            return new Response(JSON.stringify({ error: 'CNPJ já cadastrado' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        throw error;
    }
}

// ===================================
// GET IMAGE FROM R2
// ===================================

async function getImage(key, env, corsHeaders) {
    try {
        const object = await env.R2.get(key);

        if (!object) {
            return new Response(JSON.stringify({ error: 'Image not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const headers = {
            ...corsHeaders,
            'Content-Type': object.httpMetadata.contentType || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000',
            'ETag': object.httpEtag
        };

        return new Response(object.body, { headers });

    } catch (error) {
        console.error('Error fetching image:', error);
        throw error;
    }
}
