import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { verifyToken } from '../utils/auth';

export async function handleBulkImport(request: Request, env: Env, path: string): Promise<Response> {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
        });
    }

    const token = authHeader.substring(7);
    const user = await verifyToken(token, env);

    if (!user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
            status: 401,
            headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
        });
    }

    // POST /api/bulk-import/validate-codes
    if (path === '/api/bulk-import/validate-codes' && request.method === 'POST') {
        try {
            const { codes } = await request.json() as { codes: string[] };

            if (!codes || !Array.isArray(codes) || codes.length === 0) {
                return new Response(JSON.stringify({ existingCodes: [] }), {
                    status: 200,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            // Create placeholders for SQL IN clause
            const placeholders = codes.map(() => '?').join(',');
            const query = `
                SELECT codigo_ooh 
                FROM pontos_ooh 
                WHERE codigo_ooh IN (${placeholders})
                  AND deleted_at IS NULL
            `;

            const results = await env.DB.prepare(query)
                .bind(...codes)
                .all();

            const existingCodes = results.results.map((r: any) => r.codigo_ooh);

            return new Response(JSON.stringify({ existingCodes }), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        } catch (error: any) {
            console.error('Error validating codes:', error);
            return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
                status: 500,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }
    }

    // POST /api/bulk-import/save
    if (path === '/api/bulk-import/save' && request.method === 'POST') {
        try {
            const { id_exibidora, pontos } = await request.json() as {
                id_exibidora: number;
                pontos: any[];
            };

            const savedIds: number[] = [];
            const errors: any[] = [];

            try {
                // Start transaction
                await env.DB.prepare('BEGIN TRANSACTION').run();

                for (const ponto of pontos) {
                    try {
                        // Insert point
                        const result = await env.DB.prepare(`
                            INSERT INTO pontos_ooh (
                                codigo_ooh, endereco, latitude, longitude,
                                cidade, uf, pais, id_exibidora, medidas, fluxo,
                                tipo, observacoes, ponto_referencia, status,
                                created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ativo', datetime('now'), datetime('now'))
                        `).bind(
                            ponto.codigo_ooh,
                            ponto.endereco,
                            ponto.latitude,
                            ponto.longitude,
                            ponto.cidade,
                            ponto.uf,
                            ponto.pais,
                            id_exibidora,
                            ponto.medidas,
                            ponto.fluxo,
                            ponto.tipos,
                            ponto.observacoes,
                            ponto.ponto_referencia
                        ).run();

                        const pontoId = result.meta.last_row_id as number;
                        savedIds.push(pontoId);

                        // Insert products
                        if (ponto.produtos && ponto.produtos.length > 0) {
                            for (const produto of ponto.produtos) {
                                await env.DB.prepare(`
                                    INSERT INTO produtos (id_ponto, tipo, valor, periodo, created_at)
                                    VALUES (?, ?, ?, ?, datetime('now'))
                                `).bind(
                                    pontoId,
                                    produto.tipo,
                                    produto.valor,
                                    produto.periodo
                                ).run();
                            }
                        }
                    } catch (error: any) {
                        console.error('Error inserting point:', error);
                        throw error; // Rollback transaction
                    }
                }

                // Commit transaction
                await env.DB.prepare('COMMIT').run();

                // Now upload images to R2 (outside transaction)
                for (let i = 0; i < pontos.length; i++) {
                    const ponto = pontos[i];
                    const pontoId = savedIds[i];

                    if (ponto.imagens && ponto.imagens.length > 0) {
                        for (const imagem of ponto.imagens) {
                            try {
                                // Decode base64
                                const base64Data = imagem.data.split(',')[1] || imagem.data;
                                const binaryString = atob(base64Data);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let j = 0; j < binaryString.length; j++) {
                                    bytes[j] = binaryString.charCodeAt(j);
                                }

                                // Generate R2 key
                                const timestamp = Date.now();
                                const r2Key = `pontos/${pontoId}/${timestamp}-${imagem.ordem}.jpg`;

                                // Upload to R2
                                await env.R2.put(r2Key, bytes, {
                                    httpMetadata: { contentType: 'image/jpeg' }
                                });

                                // Insert image record
                                await env.DB.prepare(`
                                    INSERT INTO imagens (id_ponto, r2_key, ordem, eh_capa, created_at)
                                    VALUES (?, ?, ?, ?, datetime('now'))
                                `).bind(pontoId, r2Key, imagem.ordem, imagem.eh_capa ? 1 : 0).run();

                            } catch (imgError) {
                                console.error('Error uploading image:', imgError);
                                // Don't fail the entire import for image errors
                            }
                        }
                    }
                }

                return new Response(JSON.stringify({
                    success: true,
                    saved: savedIds,
                    errors: []
                }), {
                    status: 200,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });

            } catch (error: any) {
                // Rollback on error
                try {
                    await env.DB.prepare('ROLLBACK').run();
                } catch (rollbackError) {
                    console.error('Error rolling back:', rollbackError);
                }

                return new Response(JSON.stringify({
                    success: false,
                    saved: [],
                    errors: [{
                        message: error.message || 'Erro ao salvar pontos'
                    }]
                }), {
                    status: 500,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }
        } catch (error: any) {
            console.error('Error in bulk save:', error);
            return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
                status: 500,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }
    }

    // Not found
    return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
    });
}
