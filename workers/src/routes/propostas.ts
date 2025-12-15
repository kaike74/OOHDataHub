import { Env } from '../index';
import { corsHeaders } from '../utils/cors';
import { verifyAuth } from '../utils/auth';

export async function handlePropostas(request: Request, env: Env, path: string): Promise<Response> {
    try {
        // Verificar autenticação
        const authResult = await verifyAuth(request, env);
        if (!authResult.authorized) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        const method = request.method;

        // GET /api/clientes/:clienteId/propostas - Listar propostas de um cliente
        if (method === 'GET' && path.match(/^\/api\/clientes\/\d+\/propostas$/)) {
            const clienteId = path.split('/')[3];

            const propostas = await env.DB.prepare(`
        SELECT p.*, c.nome as cliente_nome, ct.nome as conta_nome
        FROM propostas p
        LEFT JOIN clientes c ON p.id_cliente = c.id
        LEFT JOIN contas ct ON p.id_conta = ct.id
        WHERE p.id_cliente = ?
        ORDER BY p.created_at DESC
      `).bind(clienteId).all();

            return new Response(JSON.stringify(propostas.results), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // GET /api/propostas/:id - Buscar proposta específica com seus itens
        if (method === 'GET' && path.match(/^\/api\/propostas\/\d+$/)) {
            const id = path.split('/')[3];

            // Buscar proposta
            const proposta = await env.DB.prepare(`
        SELECT p.*, c.nome as cliente_nome, ct.nome as conta_nome
        FROM propostas p
        LEFT JOIN clientes c ON p.id_cliente = c.id
        LEFT JOIN contas ct ON p.id_conta = ct.id
        WHERE p.id = ?
      `).bind(id).first();

            if (!proposta) {
                return new Response(JSON.stringify({ error: 'Proposta não encontrada' }), {
                    status: 404,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            // Buscar itens da proposta com informações dos pontos
            const itens = await env.DB.prepare(`
        SELECT 
          pi.*,
          po.codigo_ooh,
          po.endereco,
          po.cidade,
          po.uf,
          po.pais,
          po.medidas,
          po.fluxo,
          e.nome as exibidora_nome
        FROM proposta_itens pi
        LEFT JOIN pontos_ooh po ON pi.id_ponto = po.id
        LEFT JOIN exibidoras e ON po.id_exibidora = e.id
        WHERE pi.id_proposta = ?
        ORDER BY pi.created_at ASC
      `).bind(id).all();

            return new Response(JSON.stringify({ ...proposta, itens: itens.results }), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // POST /api/propostas - Criar nova proposta
        if (method === 'POST' && path === '/api/propostas') {
            const data = await request.json() as any;

            if (!data.id_cliente || !data.nome || !data.comissao) {
                return new Response(JSON.stringify({ error: 'Campos obrigatórios: id_cliente, nome, comissao' }), {
                    status: 400,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            if (!['V2', 'V3', 'V4'].includes(data.comissao)) {
                return new Response(JSON.stringify({ error: 'Comissão deve ser V2, V3 ou V4' }), {
                    status: 400,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            const result = await env.DB.prepare(`
        INSERT INTO propostas (id_cliente, nome, comissao, created_by)
        VALUES (?, ?, ?, ?) RETURNING *
      `).bind(
                data.id_cliente,
                data.nome,
                data.comissao,
                authResult.user?.id || null
            ).first();

            return new Response(JSON.stringify(result), {
                status: 201,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // PUT /api/propostas/:id - Atualizar proposta
        if (method === 'PUT' && path.match(/^\/api\/propostas\/\d+$/)) {
            const id = path.split('/')[3];
            const data = await request.json() as any;

            const result = await env.DB.prepare(`
        UPDATE propostas 
        SET nome = ?, 
            comissao = ?, 
            status = ?,
            id_conta = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? RETURNING *
      `).bind(
                data.nome,
                data.comissao,
                data.status || 'rascunho',
                data.id_conta || null,
                id
            ).first();

            if (!result) {
                return new Response(JSON.stringify({ error: 'Proposta não encontrada' }), {
                    status: 404,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // DELETE /api/propostas/:id - Deletar proposta
        if (method === 'DELETE' && path.match(/^\/api\/propostas\/\d+$/)) {
            const id = path.split('/')[3];
            await env.DB.prepare('DELETE FROM propostas WHERE id = ?').bind(id).run();

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // POST /api/propostas/:id/itens - Adicionar item ao carrinho
        if (method === 'POST' && path.match(/^\/api\/propostas\/\d+\/itens$/)) {
            const propostaId = path.split('/')[3];
            const data = await request.json() as any;

            if (!data.id_ponto || !data.periodo_inicio || !data.periodo_fim || !data.periodo_comercializado) {
                return new Response(JSON.stringify({
                    error: 'Campos obrigatórios: id_ponto, periodo_inicio, periodo_fim, periodo_comercializado'
                }), {
                    status: 400,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            // Buscar informações do ponto para aplicar comissão
            const ponto = await env.DB.prepare(`
        SELECT po.*, p.valor as valor_base, p.tipo as tipo_produto
        FROM pontos_ooh po
        LEFT JOIN produtos p ON p.id_ponto = po.id
        WHERE po.id = ?
      `).bind(data.id_ponto).first() as any;

            if (!ponto) {
                return new Response(JSON.stringify({ error: 'Ponto não encontrado' }), {
                    status: 404,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            // Buscar comissão da proposta
            const proposta = await env.DB.prepare('SELECT comissao FROM propostas WHERE id = ?')
                .bind(propostaId).first() as any;

            // Aplicar comissão
            const multiplicadores: { [key: string]: number } = { V2: 1.25, V3: 1.5625, V4: 1.9531 };
            const multiplicador = multiplicadores[proposta.comissao] || 1;

            const valorBase = data.valor_locacao || ponto.valor_base || 0;
            const valorLocacaoComComissao = valorBase * multiplicador;
            const valorPapel = (data.valor_papel || 0) * 1.25; // Papel sempre +25%
            const valorLona = (data.valor_lona || 0) * 1.25; // Lona sempre +25%

            // Calcular quantidade de períodos
            const inicio = new Date(data.periodo_inicio);
            const fim = new Date(data.periodo_fim);
            const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
            const quantidadePeriodos = data.periodo_comercializado === 'bissemanal'
                ? Math.ceil(dias / 14)
                : Math.ceil(dias / 30);

            // Calcular total de investimento
            const totalInvestimento = (valorLocacaoComComissao + valorPapel + valorLona) * quantidadePeriodos;

            // Calcular impactos
            const fluxoDiario = ponto.fluxo || 0;
            const totalImpactos = fluxoDiario * dias;

            const result = await env.DB.prepare(`
        INSERT INTO proposta_itens (
          id_proposta, id_ponto, periodo_inicio, periodo_fim,
          valor_locacao, valor_papel, valor_lona, periodo_comercializado,
          quantidade_periodos, total_investimento, fluxo_diario, total_impactos,
          observacoes, ponto_referencia
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *
      `).bind(
                propostaId,
                data.id_ponto,
                data.periodo_inicio,
                data.periodo_fim,
                valorLocacaoComComissao,
                valorPapel,
                valorLona,
                data.periodo_comercializado,
                quantidadePeriodos,
                totalInvestimento,
                fluxoDiario,
                totalImpactos,
                data.observacoes || null,
                data.ponto_referencia || ponto.ponto_referencia || null
            ).first();

            return new Response(JSON.stringify(result), {
                status: 201,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // PUT /api/propostas/:propostaId/itens/:itemId - Atualizar item
        if (method === 'PUT' && path.match(/^\/api\/propostas\/\d+\/itens\/\d+$/)) {
            const parts = path.split('/');
            const itemId = parts[5];
            const data = await request.json() as any;

            // Recalcular valores se necessário
            let updateFields = [];
            let updateValues = [];

            if (data.periodo_inicio || data.periodo_fim || data.periodo_comercializado) {
                const item = await env.DB.prepare('SELECT * FROM proposta_itens WHERE id = ?').bind(itemId).first() as any;

                const inicio = new Date(data.periodo_inicio || item.periodo_inicio);
                const fim = new Date(data.periodo_fim || item.periodo_fim);
                const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
                const tipoComercializacao = data.periodo_comercializado || item.periodo_comercializado;
                const quantidadePeriodos = tipoComercializacao === 'bissemanal'
                    ? Math.ceil(dias / 14)
                    : Math.ceil(dias / 30);

                const totalInvestimento = (item.valor_locacao + item.valor_papel + item.valor_lona) * quantidadePeriodos;
                const totalImpactos = item.fluxo_diario * dias;

                updateFields.push('periodo_inicio = ?', 'periodo_fim = ?', 'periodo_comercializado = ?',
                    'quantidade_periodos = ?', 'total_investimento = ?', 'total_impactos = ?');
                updateValues.push(inicio.toISOString(), fim.toISOString(), tipoComercializacao,
                    quantidadePeriodos, totalInvestimento, totalImpactos);
            }

            if (data.observacoes !== undefined) {
                updateFields.push('observacoes = ?');
                updateValues.push(data.observacoes);
            }

            if (updateFields.length === 0) {
                return new Response(JSON.stringify({ error: 'Nenhum campo para atualizar' }), {
                    status: 400,
                    headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
                });
            }

            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            updateValues.push(itemId);

            const result = await env.DB.prepare(`
        UPDATE proposta_itens SET ${updateFields.join(', ')} WHERE id = ? RETURNING *
      `).bind(...updateValues).first();

            return new Response(JSON.stringify(result), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        // DELETE /api/propostas/:propostaId/itens/:itemId - Remover item
        if (method === 'DELETE' && path.match(/^\/api\/propostas\/\d+\/itens\/\d+$/)) {
            const itemId = path.split('/')[5];
            await env.DB.prepare('DELETE FROM proposta_itens WHERE id = ?').bind(itemId).run();

            return new Response(JSON.stringify({ success: true }), {
                status: 200,
                headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ error: 'Not found' }), {
            status: 404,
            headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        console.error('Error in handlePropostas:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders(request, env), 'Content-Type': 'application/json' },
        });
    }
}
