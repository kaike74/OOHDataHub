import { useStore } from '@/lib/store';
import { useProposalStore } from '@/stores/useProposalStore';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, Calendar, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { useEffect, useState, useCallback } from 'react';

export default function PointDetails() {
    const {
        selectedPonto,
        setSelectedPonto,
        pontos,
        user
    } = useStore();

    const {
        selectedProposal,
        proposalItems,
        updateItem,
        setItems
    } = useProposalStore();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const imagens = selectedPonto?.imagens || [];
    const produtos = selectedPonto?.produtos || [];
    const isInternal = user?.type === 'internal';

    // Helper to check if item is in proposal
    const proposalItem = proposalItems.find(i => i.id_ooh === selectedPonto?.id);
    const itemInProposal = !!proposalItem;

    useEffect(() => {
        setCurrentImageIndex(0);
    }, [selectedPonto?.id]);

    if (!selectedPonto) return null;

    const handleClose = () => setSelectedPonto(null);

    const handleAddToProposal = () => {
        if (!selectedProposal) return;

        // Add minimal item, sync will handle rest or we can be more robust here
        const newItem: any = {
            id_proposta: selectedProposal.id,
            id_ooh: selectedPonto.id,
            periodo_inicio: new Date().toISOString().split('T')[0],
            // ... defaults
            valor_locacao: 0,
            valor_papel: 0,
            valor_lona: 0,
        };
        setItems([...proposalItems, newItem]);
    };

    const handleRemoveFromProposal = () => {
        const newItems = proposalItems.filter(i => i.id_ooh !== selectedPonto.id);
        setItems(newItems);
    };

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header with Images */}
            <div className="relative h-48 bg-gray-100 flex-shrink-0 group">
                <button
                    onClick={handleClose}
                    className="absolute top-3 left-3 z-20 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                >
                    <ChevronLeft size={20} />
                </button>

                {imagens.length > 0 ? (
                    <>
                        <SafeImage
                            src={api.getImageUrl(imagens[currentImageIndex])}
                            alt="Ponto"
                            className="w-full h-full object-cover"
                        />
                        {imagens.length > 1 && (
                            <>
                                <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white hover:bg-black/20 rounded-full flex items-center justify-center"><ChevronLeft /></button>
                                <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white hover:bg-black/20 rounded-full flex items-center justify-center"><ChevronRight /></button>
                            </>
                        )}
                        <div className="absolute bottom-2 right-3 text-xs text-white bg-black/50 px-2 py-0.5 rounded">
                            {currentImageIndex + 1} / {imagens.length}
                        </div>
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-xs">Sem imagem</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div>
                    <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                        {selectedPonto.codigo_ooh}
                    </span>
                    <h2 className="text-lg font-bold text-gray-900 mt-2 leading-tight">
                        {selectedPonto.endereco}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedPonto.cidade} - {selectedPonto.uf}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1 p-2 bg-gray-50 rounded">
                        <span className="text-gray-400 uppercase font-bold text-[10px]">Medidas</span>
                        <span className="font-semibold">{selectedPonto.medidas}</span>
                    </div>
                    <div className="flex flex-col gap-1 p-2 bg-gray-50 rounded">
                        <span className="text-gray-400 uppercase font-bold text-[10px]">Fluxo</span>
                        <span className="font-semibold">{new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(selectedPonto.fluxo || 0)}</span>
                    </div>
                </div>

                {/* Proposal Values */}
                {itemInProposal ? (
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
                        <h3 className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                            <DollarSign size={14} /> Valores na Proposta
                        </h3>
                        {/* Edit Inputs for Internal */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500">Locação</label>
                                <input
                                    type="number"
                                    className="w-full text-sm border-gray-200 rounded px-2 py-1"
                                    disabled={!isInternal}
                                    value={proposalItem.valor_locacao || 0}
                                    onChange={(e) => updateItem(proposalItem.id, { valor_locacao: Number(e.target.value) })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Papel</label>
                                    <input
                                        type="number"
                                        className="w-full text-sm border-gray-200 rounded px-2 py-1"
                                        disabled={!isInternal}
                                        value={proposalItem.valor_papel || 0}
                                        onChange={(e) => updateItem(proposalItem.id, { valor_papel: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-500">Lona</label>
                                    <input
                                        type="number"
                                        className="w-full text-sm border-gray-200 rounded px-2 py-1"
                                        disabled={!isInternal}
                                        value={proposalItem.valor_lona || 0}
                                        onChange={(e) => updateItem(proposalItem.id, { valor_lona: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                        <p className="text-xs text-gray-500 mb-3">Este ponto não está na proposta.</p>
                        <Button onClick={handleAddToProposal} className="w-full bg-black text-white hover:bg-gray-800">
                            Adicionar à Proposta
                        </Button>
                    </div>
                )}

                {itemInProposal && (
                    <Button
                        onClick={handleRemoveFromProposal}
                        variant="outline"
                        className="w-full text-red-600 border-red-100 hover:bg-red-50"
                    >
                        Remover da Proposta
                    </Button>
                )}
            </div>
        </div>
    );
}
