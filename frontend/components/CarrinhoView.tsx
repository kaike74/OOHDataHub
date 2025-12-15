'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import GoogleMap from '@/components/map/GoogleMap';
import { useStore } from '@/lib/store';
import { ChevronDown, ChevronUp, Settings, Plus, Save, ArrowLeft, ShoppingCart } from 'lucide-react';

interface PropostaItem {
    id?: number;
    id_ponto: number;
    periodo_inicio: string;
    periodo_fim: string;
    valor_locacao: number;
    valor_papel: number;
    valor_lona: number;
    periodo_comercializado: 'bissemanal' | 'mensal';
    quantidade_periodos?: number;
    total_investimento?: number;
    fluxo_diario?: number;
    total_impactos?: number;
    observacoes?: string;
    ponto_referencia?: string;
    // Dados do ponto
    codigo_ooh?: string;
    endereco?: string;
    cidade?: string;
    uf?: string;
    pais?: string;
    medidas?: string;
    exibidora_nome?: string;
}

interface Proposta {
    id: number;
    nome: string;
    comissao: 'V2' | 'V3' | 'V4';
    status: string;
    cliente_nome: string;
    itens?: PropostaItem[];
}

export default function CarrinhoView() {
    const router = useRouter();
    const params = useParams();
    const propostaId = params?.id as string;

    const [proposta, setProposta] = useState<Proposta | null>(null);
    const [itens, setItens] = useState<PropostaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCarrinhoExpanded, setIsCarrinhoExpanded] = useState(true);
    const [saving, setSaving] = useState(false);

    const pontos = useStore((state) => state.pontos);
    const setPontos = useStore((state) => state.setPontos);

    useEffect(() => {
        loadProposta();
        loadPontos();
    }, [propostaId]);

    const loadPontos = async () => {
        try {
            const response = await fetch('https://ooh-api.kaike-458.workers.dev/api/pontos', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            const data = await response.json();
            setPontos(data);
        } catch (error) {
            console.error('Erro ao carregar pontos:', error);
        }
    };

    const loadProposta = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `https://ooh-api.kaike-458.workers.dev/api/propostas/${propostaId}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            const data = await response.json();
            setProposta(data);
            setItens(data.itens || []);
        } catch (error) {
            console.error('Erro ao carregar proposta:', error);
        } finally {
            setLoading(false);
        }
    };

    const calcularTotais = () => {
        const totalInvestimento = itens.reduce((sum, item) => sum + (item.total_investimento || 0), 0);
        const totalImpactos = itens.reduce((sum, item) => sum + (item.total_impactos || 0), 0);
        const cpm = totalImpactos > 0 ? (totalInvestimento / totalImpactos) * 1000 : 0;

        return { totalInvestimento, totalImpactos, cpm };
    };

    const handleRemoverItem = async (itemId?: number) => {
        if (!itemId) return;

        if (!confirm('Remover este ponto da proposta?')) return;

        try {
            await fetch(
                `https://ooh-api.kaike-458.workers.dev/api/propostas/${propostaId}/itens/${itemId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );
            await loadProposta();
        } catch (error) {
            console.error('Erro ao remover item:', error);
            alert('Erro ao remover item');
        }
    };

    const totais = calcularTotais();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-[#06055B] via-[#0A0A5C] to-[#060530]">
                <div className="w-12 h-12 border-4 border-[#FC1E75] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-emidias-gray-50">
            {/* Header */}
            <header className="gradient-primary px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 h-[70px] border-b-4 border-emidias-accent shadow-emidias-xl">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            {proposta?.nome}
                        </h1>
                        <p className="text-xs text-white/60">
                            Cliente: {proposta?.cliente_nome} • Comissão: {proposta?.comissao}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-white/10 rounded-xl">
                        <div className="text-right">
                            <p className="text-xs text-white/60">Investimento</p>
                            <p className="text-sm font-bold text-white">
                                R$ {totais.totalInvestimento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-white/20" />
                        <div className="text-right">
                            <p className="text-xs text-white/60">Impactos</p>
                            <p className="text-sm font-bold text-white">
                                {totais.totalImpactos.toLocaleString('pt-BR')}
                            </p>
                        </div>
                        <div className="w-px h-8 bg-white/20" />
                        <div className="text-right">
                            <p className="text-xs text-white/60">CPM</p>
                            <p className="text-sm font-bold text-white">
                                R$ {totais.cpm.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 relative">
                {/* Map */}
                <div className="absolute inset-0">
                    <GoogleMap searchLocation={null} />
                </div>

                {/* Carrinho Drawer */}
                <div
                    className={`absolute bottom-0 left-0 right-0 bg-white shadow-2xl transition-all duration-300 ${isCarrinhoExpanded ? 'h-80' : 'h-14'
                        }`}
                >
                    {/* Header do Carrinho */}
                    <div
                        className="flex items-center justify-between px-6 py-3 border-b cursor-pointer hover:bg-gray-50"
                        onClick={() => setIsCarrinhoExpanded(!isCarrinhoExpanded)}
                    >
                        <div className="flex items-center space-x-3">
                            <ShoppingCart className="w-5 h-5 text-[#FC1E75]" />
                            <h3 className="font-semibold text-gray-900">
                                Carrinho ({itens.length} {itens.length === 1 ? 'ponto' : 'pontos'})
                            </h3>
                        </div>
                        <button className="p-1 hover:bg-gray-100 rounded">
                            {isCarrinhoExpanded ? <ChevronDown /> : <ChevronUp />}
                        </button>
                    </div>

                    {/* Conteúdo do Carrinho */}
                    {isCarrinhoExpanded && (
                        <div className="h-[calc(100%-56px)] overflow-auto p-4">
                            {itens.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <ShoppingCart className="w-12 h-12 text-gray-300 mb-3" />
                                    <p className="text-gray-500">Carrinho vazio</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                        Clique nos pins do mapa para adicionar pontos
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {itens.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                                        >
                                            <div className="flex-1">
                                                <p className="font-semibold text-gray-900">{item.codigo_ooh}</p>
                                                <p className="text-sm text-gray-600">
                                                    {item.cidade}/{item.uf} • {item.exibidora_nome}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-900">
                                                        R$ {(item.total_investimento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {item.quantidade_periodos} {item.periodo_comercializado === 'mensal' ? 'mês' : 'bissemana'}(s)
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoverItem(item.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
