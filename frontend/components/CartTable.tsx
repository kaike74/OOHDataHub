
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Proposta, PropostaItem } from '@/lib/types';
import { X, Save, Trash2, ChevronUp, ChevronDown, Calculator } from 'lucide-react';

interface CartTableProps {
    proposta: Proposta;
    isOpen: boolean;
    onToggle: () => void;
}

export default function CartTable({ proposta, isOpen, onToggle }: CartTableProps) {
    const [itens, setItens] = useState<PropostaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Commission multipliers
    const multipliers = { V2: 1.25, V3: 1.5625, V4: 1.9531 };
    const currentMultiplier = multipliers[proposta.comissao] || 1;

    // Load items when proposal changes
    useEffect(() => {
        loadItens();
    }, [proposta.id]);

    const loadItens = async () => {
        setIsLoading(true);
        // Assuming details endpoint returns items or we use a separate one
        // Check propostas.ts: GET /api/propostas/:id returns { ...proposta, itens: [] }
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/propostas/${proposta.id}`, {
                headers: { 'Authorization': `Bearer ${useStore.getState().token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setItens(data.itens || []);
            }
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate totals
    const calculateItemTotal = (item: PropostaItem) => {
        // Apply multipliers
        // Valor Locação * Comissão
        // Papel/Lona * 1.25 (Fixed)

        const locacao = (item.valor_locacao || 0) * currentMultiplier;
        const papel = (item.valor_papel || 0) * 1.25;
        const lona = (item.valor_lona || 0) * 1.25;

        // Calculate Quantity (Bi/Meses) based on dates or manual input
        // Prompt says: Calculated from Period.
        let quantidade = 1;
        if (item.periodo_inicio && item.periodo_fim) {
            const start = new Date(item.periodo_inicio);
            const end = new Date(item.periodo_fim);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            if (item.periodo_comercializado === 'bissemanal') {
                quantidade = Math.max(1, Math.ceil(days / 14));
            } else if (item.periodo_comercializado === 'mensal') {
                quantidade = Math.max(1, Math.ceil(days / 30));
            }
        }

        const investimento = (locacao + papel + lona) * quantidade;
        return { investimento, quantidade, locacao, papel, lona };
    };

    const totalGeral = itens.reduce((acc, item) => acc + calculateItemTotal(item).investimento, 0);

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 bg-white border-t border-emidias-gray-200 shadow-2xl transition-transform duration-300 z-30 flex flex-col ${isOpen ? 'translate-y-0 h-[400px]' : 'translate-y-[350px] h-[400px]'}`}
        >
            {/* Header / Handle */}
            <div
                className="bg-emidias-gray-900 text-white px-6 py-3 flex items-center justify-between cursor-pointer"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calculator size={20} className="text-emidias-accent" />
                        <span className="font-bold">Carrinho: {proposta.nome}</span>
                        <span className="badge bg-emidias-accent text-white border-none">{proposta.comissao}</span>
                    </div>
                    <div className="w-px h-6 bg-white/20" />
                    <div className="flex items-center gap-4 text-sm">
                        <span>{itens.length} pontos</span>
                        <span className="font-mono text-emidias-accent font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalGeral)}
                        </span>
                    </div>
                </div>
                {isOpen ? <ChevronDown /> : <ChevronUp />}
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto bg-emidias-gray-50">
                <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-emidias-gray-100 text-emidias-gray-600 font-semibold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-3">Cidade/UF</th>
                            <th className="p-3">Endereço</th>
                            <th className="p-3">Exibidora</th>
                            <th className="p-3">Código</th>
                            <th className="p-3">Período</th>
                            <th className="p-3 text-right">Locação ({proposta.comissao})</th>
                            <th className="p-3 text-right">Produção (+25%)</th>
                            <th className="p-3 text-center">Qtd</th>
                            <th className="p-3 text-right">Total</th>
                            <th className="p-3 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-emidias-gray-200">
                        {itens.map((item) => {
                            const { investimento, quantidade, locacao, papel, lona } = calculateItemTotal(item);
                            return (
                                <tr key={item.id} className="bg-white hover:bg-emidias-blue-50/50 transition-colors">
                                    <td className="p-3">
                                        <div className="font-semibold">{item.cidade}</div>
                                        <div className="text-xs text-gray-500">{item.uf}</div>
                                    </td>
                                    <td className="p-3 max-w-[200px] truncate" title={item.endereco}>
                                        {item.endereco}
                                    </td>
                                    <td className="p-3">{item.exibidora_nome}</td>
                                    <td className="p-3 font-mono text-xs bg-gray-50 px-2 py-1 rounded inline-block">
                                        {item.codigo_ooh}
                                    </td>
                                    <td className="p-3">
                                        <div className="flex flex-col gap-1">
                                            <input
                                                type="date"
                                                defaultValue={item.periodo_inicio?.split('T')[0]}
                                                className="input-xs border rounded px-1"
                                            // Implement onChange to update local state and debounced save
                                            />
                                            <input
                                                type="date"
                                                defaultValue={item.periodo_fim?.split('T')[0]}
                                                className="input-xs border rounded px-1"
                                            />
                                        </div>
                                    </td>
                                    <td className="p-3 text-right font-mono">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(locacao)}
                                    </td>
                                    <td className="p-3 text-right font-mono text-xs text-gray-500">
                                        <div>P: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(papel)}</div>
                                        <div>L: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lona)}</div>
                                    </td>
                                    <td className="p-3 text-center font-bold">{quantidade}</td>
                                    <td className="p-3 text-right font-bold text-emidias-primary">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(investimento)}
                                    </td>
                                    <td className="p-3 text-center">
                                        <button className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {itens.length === 0 && (
                            <tr>
                                <td colSpan={10} className="p-12 text-center text-gray-400">
                                    Nenhum ponto selecionado nesta proposta.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
