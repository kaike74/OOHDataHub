import { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Proposta, PropostaItem } from '@/lib/types';
import { api } from '@/lib/api';
import { ChevronUp, ChevronDown, Calculator, Trash2, Save, Loader2 } from 'lucide-react';

interface CartTableProps {
    proposta: Proposta;
    isOpen: boolean;
    onToggle: () => void;
}

export default function CartTable({ proposta, isOpen, onToggle }: CartTableProps) {
    const [itens, setItens] = useState<PropostaItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editedItems, setEditedItems] = useState<Record<number, Partial<PropostaItem>>>({});

    // Commission multipliers
    const multipliers = { V2: 1.25, V3: 1.5625, V4: 1.9531 };
    const currentMultiplier = multipliers[proposta.comissao] || 1;

    // Load items when proposal changes
    useEffect(() => {
        loadItens();
    }, [proposta.id]);

    const loadItens = async () => {
        setIsLoading(true);
        try {
            const data = await api.getProposta(proposta.id);
            setItens(data.itens || []);
            setEditedItems({});
        } catch (error) {
            console.error('Erro ao carregar itens:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Update item field
    const updateItemField = (itemId: number, field: keyof PropostaItem, value: any) => {
        setEditedItems(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [field]: value
            }
        }));
    };

    // Get current item value (prioritize edited, fallback to original)
    const getItemValue = (item: PropostaItem, field: keyof PropostaItem) => {
        if (editedItems[item.id] && field in editedItems[item.id]) {
            return editedItems[item.id][field];
        }
        return item[field];
    };

    // Save changes
    const saveChanges = useCallback(async () => {
        if (Object.keys(editedItems).length === 0) return;

        setIsSaving(true);
        try {
            // Merge changes with current items
            const updatedItems = itens.map(item => {
                if (editedItems[item.id]) {
                    return { ...item, ...editedItems[item.id] };
                }
                return item;
            });

            // Send to backend
            await api.updateCart(proposta.id, updatedItems);

            // Reload to get fresh data
            await loadItens();

        } catch (error) {
            console.error('Erro ao salvar carrinho:', error);
            alert('Erro ao salvar alterações');
        } finally {
            setIsSaving(false);
        }
    }, [editedItems, itens, proposta.id]);

    // Remove item
    const removeItem = async (itemId: number) => {
        if (!confirm('Remover este ponto do carrinho?')) return;

        setIsSaving(true);
        try {
            const updatedItems = itens.filter(item => item.id !== itemId);
            await api.updateCart(proposta.id, updatedItems);
            await loadItens();
        } catch (error) {
            console.error('Erro ao remover item:', error);
            alert('Erro ao remover item');
        } finally {
            setIsSaving(false);
        }
    };

    // Calculate totals
    const calculateItemTotal = (item: PropostaItem) => {
        const locacaoBase = Number(getItemValue(item, 'valor_locacao') || 0);
        const papelBase = Number(getItemValue(item, 'valor_papel') || 0);
        const lonaBase = Number(getItemValue(item, 'valor_lona') || 0);

        const locacao = locacaoBase * currentMultiplier;
        const papel = papelBase * 1.25;
        const lona = lonaBase * 1.25;

        let quantidade = 1;
        const inicio = getItemValue(item, 'periodo_inicio');
        const fim = getItemValue(item, 'periodo_fim');

        if (inicio && fim) {
            const start = new Date(inicio);
            const end = new Date(fim);
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

            const periodo = getItemValue(item, 'periodo_comercializado');
            if (periodo === 'bissemanal') {
                quantidade = Math.max(1, Math.ceil(days / 14));
            } else if (periodo === 'mensal') {
                quantidade = Math.max(1, Math.ceil(days / 30));
            }
        }

        const investimento = (locacao + papel + lona) * quantidade;
        return { investimento, quantidade, locacao, papel, lona };
    };

    const totalGeral = itens.reduce((acc, item) => acc + calculateItemTotal(item).investimento, 0);
    const hasChanges = Object.keys(editedItems).length > 0;

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 bg-white border-t border-emidias-gray-200 shadow-2xl transition-transform duration-300 z-30 flex flex-col ${isOpen ? 'translate-y-0 h-[450px]' : 'translate-y-[400px] h-[450px]'}`}
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
                    {hasChanges && (
                        <div className="flex items-center gap-2 ml-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    saveChanges();
                                }}
                                disabled={isSaving}
                                className="flex items-center gap-1 bg-emidias-accent hover:bg-emidias-accent-dark px-3 py-1 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Salvar
                            </button>
                        </div>
                    )}
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
                                                value={String(getItemValue(item, 'periodo_inicio') || '').split('T')[0]}
                                                onChange={(e) => updateItemField(item.id, 'periodo_inicio', e.target.value)}
                                                className="input-xs border rounded px-1 text-xs"
                                            />
                                            <input
                                                type="date"
                                                value={String(getItemValue(item, 'periodo_fim') || '').split('T')[0]}
                                                onChange={(e) => updateItemField(item.id, 'periodo_fim', e.target.value)}
                                                className="input-xs border rounded px-1 text-xs"
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
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            disabled={isSaving}
                                            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                        >
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
                                    <br />
                                    <span className="text-xs">Navegue pelo mapa e clique em "Adicionar" nos pontos desejados.</span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
