import { Env } from '../index';
import { corsHeaders } from '../utils/cors';

export const handlePublicProposalView = async (request: Request, env: Env) => {
    const url = new URL(request.url);
    const path = url.pathname;

    // GET /public/:token - Render HTML view of public proposal
    if (request.method === 'GET') {
        const token = path.split('/').pop();
        if (!token) {
            return new Response('Token required', { status: 400 });
        }

        // Fetch proposal data
        const stmt = env.DB.prepare(`
            SELECT p.*, c.nome as cliente_nome, c.logo_url as cliente_logo
            FROM propostas p
            LEFT JOIN clientes c ON p.id_cliente = c.id
            WHERE p.public_token = ? AND p.public_access_level = 'view'
        `).bind(token);

        const proposal = await stmt.first() as any;

        if (!proposal) {
            return new Response(renderNotFoundPage(), {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // Get items
        const itemsStmt = env.DB.prepare(`
            SELECT pi.*, po.codigo_ooh, po.endereco, po.cidade, po.uf, po.tipo,
                   po.medidas, e.nome as exibidora_nome,
                   (pi.valor_locacao + pi.valor_papel + pi.valor_lona) as valor_total
            FROM proposta_itens pi
            JOIN pontos_ooh po ON pi.id_ooh = po.id
            JOIN exibidoras e ON po.id_exibidora = e.id
            WHERE pi.id_proposta = ?
        `).bind(proposal.id);

        const { results: items } = await itemsStmt.all();

        // Calculate totals
        const totalPontos = items?.length || 0;
        const totalInvestimento = items?.reduce((sum: number, item: any) => sum + (item.valor_total || 0), 0) || 0;

        // Render HTML
        const html = renderProposalPage(proposal, items as any[], totalPontos, totalInvestimento);

        return new Response(html, {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
    }

    return new Response('Method not allowed', { status: 405 });
};

function renderProposalPage(proposal: any, items: any[], totalPontos: number, totalInvestimento: number): string {
    const itemsHtml = items.map(item => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                ${item.codigo_ooh || 'N/A'}
            </td>
            <td class="px-6 py-4 text-sm text-gray-700">
                ${item.endereco || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${item.cidade || 'N/A'}/${item.uf || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${item.tipo || 'N/A'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                ${item.exibidora_nome || 'N/A'}
            </td>
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${proposal.nome} - E-Mídias</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
</head>
<body class="bg-gradient-to-br from-blue-50 via-white to-indigo-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    ${proposal.cliente_logo ? `
                        <img src="${proposal.cliente_logo}" alt="${proposal.cliente_nome}" class="h-12 w-auto object-contain">
                    ` : ''}
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">${proposal.nome}</h1>
                        <p class="text-sm text-gray-500">Cliente: ${proposal.cliente_nome || 'N/A'}</p>
                    </div>
                </div>
                <div class="flex gap-3">
                    <a href="https://oohdatahub.pages.dev/auth/signup" class="hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        Criar Conta
                    </a>
                    <a href="https://oohdatahub.pages.dev/auth/login" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        Fazer Login
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Total de Pontos</p>
                        <p class="text-3xl font-bold text-gray-900">${totalPontos}</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Investimento Total</p>
                        <p class="text-3xl font-bold text-gray-900">
                            ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvestimento)}
                        </p>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h2 class="text-lg font-semibold text-gray-900">Pontos da Proposta</h2>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Endereço</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade/UF</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exibidora</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${itemsHtml}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- CTA Section -->
        <div class="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-xl p-8 text-center text-white">
            <h2 class="text-3xl font-bold mb-4">Gostou da proposta?</h2>
            <p class="text-lg mb-6 opacity-90">
                Crie uma conta gratuita para editar, salvar e gerenciar suas próprias propostas!
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="https://oohdatahub.pages.dev/auth/signup" class="inline-flex items-center justify-center px-8 py-3 border border-transparent text-lg font-semibold rounded-md text-blue-600 bg-white hover:bg-gray-100">
                    Criar Conta Grátis
                </a>
                <a href="https://oohdatahub.pages.dev/auth/login" class="inline-flex items-center justify-center px-8 py-3 border-2 border-white text-lg font-semibold rounded-md text-white hover:bg-white/10">
                    Já tenho conta
                </a>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
            <p>© 2026 E-Mídias. Todos os direitos reservados.</p>
        </div>
    </footer>
</body>
</html>
    `;
}

function renderNotFoundPage(): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta não encontrada - E-Mídias</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Proposta não encontrada</h1>
        <p class="text-gray-600 mb-6">
            O link que você acessou pode estar inválido ou a proposta não está mais disponível publicamente.
        </p>
        <a href="https://oohdatahub.pages.dev" class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            Ir para Home
        </a>
    </div>
</body>
</html>
    `;
}
