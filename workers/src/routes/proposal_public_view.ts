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
    // Detect frontend URL from environment or use default
    const frontendUrl = 'https://oohdatahub.pages.dev';

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
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .pulse-animation {
            animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .8; }
        }
    </style>
</head>
<body class="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    ${proposal.cliente_logo ? `
                        <img src="${proposal.cliente_logo}" alt="${proposal.cliente_nome}" class="h-10 w-auto object-contain">
                    ` : ''}
                    <div>
                        <h1 class="text-xl sm:text-2xl font-bold text-gray-900">${proposal.nome}</h1>
                        <p class="text-xs sm:text-sm text-gray-500">Cliente: ${proposal.cliente_nome || 'N/A'}</p>
                    </div>
                </div>
                <div class="flex gap-2 sm:gap-3">
                    <a href="${frontendUrl}/signup" class="hidden sm:inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                        Criar Conta
                    </a>
                    <a href="${frontendUrl}/login" class="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all">
                        Entrar
                    </a>
                </div>
            </div>
        </div>
    </header>

    <!-- Banner CTA -->
    <div class="gradient-bg text-white py-4 px-4">
        <div class="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="text-center sm:text-left">
                <p class="text-lg font-semibold">📊 Visualizando proposta pública</p>
                <p class="text-sm opacity-90">Crie uma conta para editar e gerenciar suas próprias propostas</p>
            </div>
            <a href="${frontendUrl}/signup" class="pulse-animation inline-flex items-center px-6 py-3 bg-white text-purple-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg">
                Começar Grátis →
            </a>
        </div>
    </div>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Total de Pontos</p>
                        <p class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">${totalPontos}</p>
                    </div>
                    <div class="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                        <svg class="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm text-gray-500 mb-1">Investimento Total</p>
                        <p class="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                            ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalInvestimento)}
                        </p>
                    </div>
                    <div class="w-14 h-14 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                        <svg class="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                    </div>
                </div>
            </div>
        </div>

        <!-- Items Table -->
        <div class="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
                <h2 class="text-lg font-bold text-gray-900">📍 Pontos da Proposta</h2>
                <p class="text-sm text-gray-600 mt-1">Lista completa de pontos incluídos nesta proposta</p>
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
        <div class="mt-12 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
            <div class="absolute inset-0 bg-black opacity-10"></div>
            <div class="relative z-10">
                <h2 class="text-3xl sm:text-4xl font-bold mb-4">✨ Gostou da proposta?</h2>
                <p class="text-lg sm:text-xl mb-8 opacity-95 max-w-2xl mx-auto">
                    Crie uma conta <strong>gratuita</strong> para editar, salvar e gerenciar suas próprias propostas de mídia OOH!
                </p>
                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="${frontendUrl}/signup" class="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-purple-600 bg-white hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                        🚀 Criar Conta Grátis
                    </a>
                    <a href="${frontendUrl}/login" class="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-lg font-bold rounded-xl text-white hover:bg-white/20 transition-all">
                        Já tenho conta
                    </a>
                </div>
                <p class="mt-6 text-sm opacity-75">Sem cartão de crédito • Sem compromisso • Comece em segundos</p>
            </div>
        </div>

        <!-- Features Section -->
        <div class="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
                <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <h3 class="font-bold text-gray-900 mb-2">Fácil de Usar</h3>
                <p class="text-sm text-gray-600">Interface intuitiva para criar e gerenciar propostas em minutos</p>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
                <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
                    </svg>
                </div>
                <h3 class="font-bold text-gray-900 mb-2">Compartilhamento</h3>
                <p class="text-sm text-gray-600">Compartilhe propostas com clientes de forma profissional</p>
            </div>
            <div class="bg-white rounded-xl p-6 shadow-md border border-gray-100 text-center">
                <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                    </svg>
                </div>
                <h3 class="font-bold text-gray-900 mb-2">Rápido e Eficiente</h3>
                <p class="text-sm text-gray-600">Economize tempo com ferramentas automatizadas</p>
            </div>
        </div>
    </main>

    <!-- Footer -->
    <footer class="bg-white border-t border-gray-200 mt-16">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
            <p>© 2026 E-Mídias. Todos os direitos reservados.</p>
            <p class="mt-2">Sistema de Gestão de Mídia OOH</p>
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
