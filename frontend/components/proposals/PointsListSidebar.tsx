import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { useProposalStore } from '@/stores/useProposalStore';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, MapPin, DollarSign, Filter, Plus, Check, X, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { Ponto } from '@/lib/types';
import PointDetails from './PointDetails';

export default function PointsListSidebar() {
    const pontos = useStore(state => state.pontos);
    const selectedPonto = useStore(state => state.selectedPonto);
    const setSelectedPonto = useStore(state => state.setSelectedPonto);

    const {
        selectedProposal,
        proposalItems,
        updateItem,
        setItems,
    } = useProposalStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'selected' | 'available'>('all');

    // Filter points
    const filteredPoints = useMemo(() => {
        let result = pontos;

        // 1. Search (Code, Address, City)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.codigo_ooh?.toLowerCase().includes(lowerTerm) ||
                p.endereco?.toLowerCase().includes(lowerTerm) ||
                p.cidade?.toLowerCase().includes(lowerTerm) ||
                p.cidade?.toLowerCase().includes(lowerTerm)
            );
        }

        // 2. Status Filter
        if (filterType === 'selected') {
            const selectedIds = new Set(proposalItems.map(i => i.id_ooh));
            result = result.filter(p => selectedIds.has(p.id));
        } else if (filterType === 'available') {
            const selectedIds = new Set(proposalItems.map(i => i.id_ooh));
            result = result.filter(p => !selectedIds.has(p.id));
        }

        return result.slice(0, 50); // Limit rendered items for performance for now
    }, [pontos, searchTerm, filterType, proposalItems]);

    // Actions
    const handleTogglePoint = async (point: Ponto, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedProposal) return;

        const isInCart = proposalItems.some(i => i.id_ooh === point.id);

        if (isInCart) {
            // Remove
            const newItems = proposalItems.filter(i => i.id_ooh !== point.id);
            setItems(newItems);
            // Sync with backend would happen in useProposalSync
        } else {
            // Add
            // Calculate default values (simplified logic from Sidebar)
            // Ideally this logic moves to a helper or the store action
            const newItem: any = {
                id_proposta: selectedProposal.id,
                id_ooh: point.id,
                // Default values...
                periodo_inicio: new Date().toISOString().split('T')[0],
                // We let the backend or sync hook handle full object construction or refresh
                // For optimistic UI we add a minimal item
                codigo_ooh: point.codigo_ooh,
                endereco: point.endereco,
                // ... other visual props
            };
            setItems([...proposalItems, newItem]);
        }
    };

    const handleCardClick = (point: Ponto) => {
        setSelectedPonto(point.id === selectedPonto?.id ? null : point);
    };

    if (selectedPonto) {
        return (
            <div className="h-full w-full bg-white border-l border-gray-200">
                <PointDetails />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border-l border-gray-200 w-full max-w-md">
            {/* Header / Filters */}
            <div className="p-4 border-b border-gray-100 bg-white/50 backdrop-blur-sm z-10 sticky top-0">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                        placeholder="Buscar por código, endereço..."
                        className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 text-xs overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setFilterType('all')}
                        className={cn(
                            "px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                            filterType === 'all'
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                    >
                        Todos ({pontos.length})
                    </button>
                    <button
                        onClick={() => setFilterType('selected')}
                        className={cn(
                            "px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                            filterType === 'selected'
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                    >
                        Selecionados ({proposalItems.length})
                    </button>
                    <button
                        onClick={() => setFilterType('available')}
                        className={cn(
                            "px-3 py-1.5 rounded-full border transition-colors whitespace-nowrap",
                            filterType === 'available'
                                ? "bg-black text-white border-black"
                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        )}
                    >
                        Disponíveis
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-16">
                {filteredPoints.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                        <Filter size={24} className="mx-auto mb-2 opacity-20" />
                        <p>Nenhum ponto encontrado</p>
                    </div>
                ) : (
                    filteredPoints.map(point => {
                        const isInCart = proposalItems.some(i => i.id_ooh === point.id);
                        const isSelected = selectedPonto?.id === point.id;

                        return (
                            <div
                                key={point.id}
                                onClick={() => handleCardClick(point)}
                                className={cn(
                                    "group relative bg-white border rounded-xl p-3 transition-all cursor-pointer hover:shadow-md",
                                    isSelected ? "ring-2 ring-blue-500 border-transparent shadow-md" : "border-gray-100 hover:border-gray-200",
                                    isInCart ? "bg-blue-50/30" : ""
                                )}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                        {point.codigo_ooh}
                                    </span>
                                    {isInCart && (
                                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                                            <Check size={10} />
                                            Selecionado
                                        </span>
                                    )}
                                </div>

                                <h4 className="text-sm font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
                                    {point.endereco}
                                </h4>

                                <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                    <span className="flex items-center gap-1">
                                        <MapPin size={10} />
                                        {point.cidade}/{point.uf}
                                    </span>
                                </div>

                                {/* Metrics */}
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-2 mb-3">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase text-gray-400">Fluxo</span>
                                        <span className="font-medium">{new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(point.fluxo || 0)}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase text-gray-400">Medidas</span>
                                        <span className="font-medium truncate">{point.medidas}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between mt-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs text-gray-400 hover:text-blue-600 px-0"
                                    >
                                        Ver detalhes <ArrowRight size={12} className="ml-1" />
                                    </Button>

                                    <Button
                                        size="sm"
                                        onClick={(e) => handleTogglePoint(point, e)}
                                        className={cn(
                                            "h-8 px-3 rounded-lg text-xs font-semibold transition-colors",
                                            isInCart
                                                ? "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                : "bg-black text-white hover:bg-gray-800"
                                        )}
                                    >
                                        {isInCart ? (
                                            <>
                                                <X size={14} className="mr-1.5" />
                                                Remover
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={14} className="mr-1.5" />
                                                Adicionar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
