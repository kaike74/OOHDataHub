'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, Pencil, History, Eye, ChevronLeft, ChevronRight, Phone, Mail, Trash2, DollarSign, Tag, Calendar, ExternalLink, Loader2, ShoppingCart } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Contato } from '@/lib/types';
import HistoryModal from '@/components/HistoryModal';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';

// Componente para exibir contatos da exibidora
function ContatosExibidora({ idExibidora }: { idExibidora: number | null | undefined }) {
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!idExibidora) return;

        const fetchContatos = async () => {
            setLoading(true);
            try {
                const data = await api.getContatos(idExibidora);
                setContatos(data);
            } catch (error) {
                console.error('Erro ao buscar contatos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContatos();
    }, [idExibidora]);

    if (loading || contatos.length === 0) return null;

    return (
        <div className="mt-3 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contatos</p>
            {contatos.map((contato) => (
                <div key={contato.id} className="p-2.5 bg-gray-50/50 rounded-lg border border-gray-100 hover:border-emidias-accent/30 transition-all group">
                    {contato.nome && (
                        <p className="font-semibold text-gray-800 text-xs">{contato.nome}</p>
                    )}
                    <div className="flex flex-col gap-1.5 mt-1.5">
                        {contato.telefone && (
                            <a
                                href={`tel:${contato.telefone}`}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emidias-accent transition-colors"
                            >
                                <Phone size={10} />
                                {contato.telefone}
                            </a>
                        )}
                        {contato.email && (
                            <a
                                href={`mailto:${contato.email}`}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-emidias-accent transition-colors"
                            >
                                <Mail size={10} />
                                {contato.email}
                            </a>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function Sidebar() {
    const selectedPonto = useStore((state) => state.selectedPonto);
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const isSidebarOpen = useStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useStore((state) => state.setSidebarOpen);
    const setModalOpen = useStore((state) => state.setModalOpen);
    const setEditingPonto = useStore((state) => state.setEditingPonto);
    const setStreetViewRequest = useStore((state) => state.setStreetViewRequest);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const exibidoras = useStore((state) => state.exibidoras);
    const pontos = useStore((state) => state.pontos);
    const setPontos = useStore((state) => state.setPontos);
    const selectedProposta = useStore((state) => state.selectedProposta);
    const user = useStore((state) => state.user);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const imagens = selectedPonto?.imagens || [];
    const produtos = selectedPonto?.produtos || [];

    const handleEdit = useCallback(() => {
        if (selectedPonto) {
            setEditingPonto(selectedPonto);
            setModalOpen(true);
            setSidebarOpen(false);
        }
    }, [selectedPonto, setEditingPonto, setModalOpen, setSidebarOpen]);

    const handleHistory = useCallback(() => {
        setIsHistoryOpen(true);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!selectedPonto) return;

        const confirmDelete = confirm(
            `Tem certeza que deseja deletar o ponto ${selectedPonto.codigo_ooh}?\n\nEsta ação não pode ser desfeita.`
        );

        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            await api.deletePonto(selectedPonto.id);

            const updatedPontos = pontos.filter(p => p.id !== selectedPonto.id);
            setPontos(updatedPontos);
            setSidebarOpen(false);

            alert('Ponto deletado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao deletar ponto:', error);
            alert('Erro ao deletar ponto: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setIsDeleting(false);
        }
    }, [selectedPonto, pontos, setPontos, setSidebarOpen]);

    const handleStreetView = useCallback(() => {
        if (selectedPonto && selectedPonto.latitude && selectedPonto.longitude) {
            setStreetViewRequest({ lat: selectedPonto.latitude, lng: selectedPonto.longitude });
        }
    }, [selectedPonto, setStreetViewRequest]);

    const handleClose = useCallback(() => {
        if (selectedExibidora) {
            setSelectedPonto(null);
        } else {
            setSidebarOpen(false);
        }
    }, [selectedExibidora, setSelectedPonto, setSidebarOpen]);

    const handleExibidoraClick = useCallback(() => {
        if (selectedPonto && selectedPonto.id_exibidora) {
            const exibidora = exibidoras.find(ex => ex.id === selectedPonto.id_exibidora);
            if (exibidora) {
                setSidebarOpen(false);
                setFilterExibidora([exibidora.id]);
                setSelectedExibidora(exibidora);
                setCurrentView('map');
            }
        }
    }, [selectedPonto, exibidoras, setSidebarOpen, setFilterExibidora, setSelectedExibidora, setCurrentView]);

    const handleAddToProposal = async () => {
        if (!selectedPonto || !selectedProposta) return;

        try {
            // Check if already in cart
            const proposalItens = selectedProposta.itens || [];
            const isInCart = proposalItens.some((i: any) => i.id_ooh === selectedPonto.id);

            if (isInCart) {
                // Remove from cart
                const updatedItens = proposalItens.filter((i: any) => i.id_ooh !== selectedPonto.id);
                await api.updateCart(selectedProposta.id, updatedItens);
                const updatedProposta = await api.getProposta(selectedProposta.id);
                useStore.getState().refreshProposta(updatedProposta);
                return;
            }
            // Helper function to calculate value with commission
            const calcularValorComissao = (valorBase: number, comissao: string): number => {
                // Client Special Pricing: Double Base (2x) (V0 commission)
                if (comissao === 'V0' || comissao === 'CLIENT' || user?.type === 'external') {
                    return parseFloat((valorBase * 2).toFixed(2));
                }

                // Internal Logic
                const v2 = valorBase * 1.25;
                if (comissao === 'V2') return parseFloat(v2.toFixed(2));

                const v3 = v2 * 1.25;
                if (comissao === 'V3') return parseFloat(v3.toFixed(2));

                const v4 = v3 * 1.25;
                return parseFloat(v4.toFixed(2));
            };

            // Find products by type (case-insensitive)
            const papelProduto = selectedPonto.produtos?.find(p =>
                p.tipo.toLowerCase().includes('papel')
            );
            const lonaProduto = selectedPonto.produtos?.find(p =>
                p.tipo.toLowerCase().includes('lona')
            );
            const locacaoProduto = selectedPonto.produtos?.find(p =>
                p.tipo.toLowerCase().includes('locação') ||
                p.tipo.toLowerCase().includes('locacao') ||
                p.tipo.toLowerCase().includes('bissemanal') ||
                p.tipo.toLowerCase().includes('mensal')
            );

            // Calculate values with proper rounding to 2 decimal places
            const valorPapel = papelProduto ? parseFloat((papelProduto.valor * 1.25).toFixed(2)) : 0;
            const valorLona = lonaProduto ? parseFloat((lonaProduto.valor * 1.25).toFixed(2)) : 0;
            const valorLocacao = locacaoProduto ? calcularValorComissao(locacaoProduto.valor, selectedProposta.comissao) : 0;

            // Default item structure
            const item = {
                id_proposta: selectedProposta.id,
                id_ooh: selectedPonto.id,
                periodo_inicio: new Date().toISOString().split('T')[0],
                periodo_fim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days default
                valor_locacao: valorLocacao,
                valor_papel: valorPapel,
                valor_lona: valorLona,
                periodo_comercializado: 'bissemanal',
                observacoes: '',
                fluxo_diario: selectedPonto.fluxo || 0 // Store current fluxo for consistent calculations
            };

            // Fetch current items
            const data = await api.getProposta(selectedProposta.id);
            const currentItens = data.itens || [];

            // Check if already in cart
            if (currentItens.some((i: any) => i.id_ooh === selectedPonto.id)) {
                return;
            }

            const newItens = [...currentItens, item];
            await api.updateCart(selectedProposta.id, newItens);

            // Refetch to get updated proposal
            const updatedProposta = await api.getProposta(selectedProposta.id);
            useStore.getState().refreshProposta(updatedProposta);

        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
        }
    };

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, [imagens.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
    }, [imagens.length]);

    const goToImage = useCallback((index: number) => {
        setCurrentImageIndex(index);
    }, []);

    // Auto-rotate de imagens a cada 4 segundos
    useEffect(() => {
        if (!selectedPonto || !isSidebarOpen || imagens.length <= 1) return;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
        }, 4000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [imagens.length, selectedPonto, isSidebarOpen]);

    // Reset quando o ponto mudar
    useEffect(() => {
        if (selectedPonto) {
            setCurrentImageIndex(0);
        }
    }, [selectedPonto?.id]);

    if (!selectedPonto || !isSidebarOpen) return null;

    return (
        <>
            {/* Overlay - z-30 to be under the sidebar (z-40) but above map */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity lg:hidden animate-in fade-in"
                onClick={handleClose}
            />

            {/* Sidebar - z-60 to be above everything */}
            <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-full sm:w-80 bg-white/95 backdrop-blur-xl shadow-emidias-2xl z-[60] transform transition-transform duration-300 ease-out overflow-hidden flex flex-col border-l border-white/20 animate-in slide-in-from-right">

                {/* Header com imagens / Carrossel */}
                <div className="relative h-44 bg-gray-100 flex-shrink-0 group">
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                        title="Fechar"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    {imagens.length > 0 ? (
                        <>
                            <SafeImage
                                src={api.getImageUrl(imagens[currentImageIndex])}
                                alt={`Imagem ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                            {/* Navigation Arrows */}
                            {imagens.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white/80 hover:text-white rounded-full flex items-center justify-center transition-all hover:bg-black/20"
                                    >
                                        <ChevronLeft size={24} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 text-white/80 hover:text-white rounded-full flex items-center justify-center transition-all hover:bg-black/20"
                                    >
                                        <ChevronRight size={24} strokeWidth={2.5} />
                                    </button>

                                    {/* Dots Indicator */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {imagens.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => goToImage(index)}
                                                className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <MapPin size={40} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-xs">Sem imagens</p>
                            </div>
                        </div>
                    )}

                    {/* Meta Info Overlay - Compact */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pt-10 text-white leading-tight">
                        <div className="flex items-end justify-between">
                            <div>
                                <h2 className="text-xl font-bold mb-0.5 drop-shadow-md tracking-tight">
                                    {selectedPonto.codigo_ooh}
                                </h2>
                                <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                                    <Calendar size={12} />
                                    <span>{formatDate(selectedPonto.created_at)}</span>
                                </div>
                            </div>
                            <span className="badge bg-white/20 backdrop-blur-md border border-white/10 text-white text-xs px-2 py-0.5 rounded-md font-medium">
                                {selectedPonto.tipo || 'OOH'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-6">
                        {/* Info Items */}
                        <div className="space-y-4">
                            {/* Endereço */}
                            <div className="flex gap-3">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                    <MapPin size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endereço</p>
                                    <p className="text-gray-900 font-medium text-sm mt-0.5 leading-snug">{selectedPonto.endereco}</p>
                                    {selectedPonto.cidade && selectedPonto.uf && (
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {selectedPonto.cidade} - {selectedPonto.uf}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Exibidora */}
                            {selectedPonto.exibidora_nome && (
                                <div className="flex gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Exibidora</p>
                                        <button
                                            onClick={handleExibidoraClick}
                                            className="group flex items-center gap-1 text-gray-900 font-medium text-sm mt-0.5 hover:text-emidias-accent transition-colors"
                                        >
                                            {selectedPonto.exibidora_nome}
                                            <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        {selectedPonto.exibidora_cnpj && (
                                            <p className="text-[10px] text-gray-400 mt-0.5 font-mono">
                                                {selectedPonto.exibidora_cnpj}
                                            </p>
                                        )}

                                        <ContatosExibidora idExibidora={selectedPonto.id_exibidora} />
                                    </div>
                                </div>
                            )}

                            {/* Divider with subtle gradient */}
                            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                            {/* Grid de Informações Secundárias */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Medidas */}
                                {selectedPonto.medidas && (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-emidias-accent">
                                            <Ruler size={14} />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Medidas</p>
                                        </div>
                                        <p className="text-gray-900 font-semibold text-sm pl-0.5">{selectedPonto.medidas}</p>
                                    </div>
                                )}

                                {/* Fluxo */}
                                {selectedPonto.fluxo && (
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5 text-emidias-accent">
                                            <Users size={14} />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fluxo</p>
                                        </div>
                                        <p className="text-gray-900 font-semibold text-sm pl-0.5">{selectedPonto.fluxo.toLocaleString()}/dia</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PROPOSAL ITEM LOGIC */}
                        {(() => {
                            // Helper to check if item is in proposal
                            const proposalItem = selectedProposta?.itens?.find((i: any) => i.id_ooh === selectedPonto.id);
                            const isInternal = user?.type === 'internal';
                            const canEdit = !!proposalItem && isInternal; // Only internal can edit proposal details here

                            const updateProposalItem = async (updates: any) => {
                                if (!selectedProposta || !proposalItem) return;

                                const updatedItens = selectedProposta.itens?.map((i: any) =>
                                    i.id_ooh === selectedPonto.id ? { ...i, ...updates } : i
                                ) || [];

                                // Optimistic update
                                useStore.getState().refreshProposta({ ...selectedProposta, itens: updatedItens });

                                try {
                                    await api.updateCart(selectedProposta.id, updatedItens);
                                } catch (error) {
                                    console.error('Failed to update item from sidebar', error);
                                }
                            };

                            if (proposalItem) {
                                return (
                                    <>
                                        {/* VALORES DO ITEM (EDITÁVEIS PARA INTERNOS) */}
                                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1 rounded-md bg-white border border-blue-200 shadow-sm text-blue-600">
                                                    <DollarSign size={14} />
                                                </div>
                                                <h3 className="font-semibold text-blue-900 text-sm">
                                                    Valores da Proposta
                                                </h3>
                                            </div>

                                            <div className="space-y-3">
                                                {/* Locação */}
                                                <div>
                                                    <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Locação (Bissemanal)</label>
                                                    <div className="relative">
                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                                        <input
                                                            type="text"
                                                            disabled={!canEdit}
                                                            className={`w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-7 pr-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEdit ? 'bg-gray-50 text-gray-500' : 'text-gray-900'}`}
                                                            value={formatDecimal(proposalItem.valor_locacao)}
                                                            onChange={(e) => {
                                                                if (!canEdit) return;
                                                                const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                                                                if (!isNaN(val)) updateProposalItem({ valor_locacao: val });
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    {/* Papel */}
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Papel</label>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                                            <input
                                                                type="text"
                                                                disabled={!canEdit}
                                                                className={`w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-7 pr-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEdit ? 'bg-gray-50 text-gray-500' : 'text-gray-900'}`}
                                                                value={formatDecimal(proposalItem.valor_papel)}
                                                                onChange={(e) => {
                                                                    if (!canEdit) return;
                                                                    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                                                                    if (!isNaN(val)) updateProposalItem({ valor_papel: val });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                    {/* Lona */}
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block">Lona</label>
                                                        <div className="relative">
                                                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">R$</span>
                                                            <input
                                                                type="text"
                                                                disabled={!canEdit}
                                                                className={`w-full bg-white border border-gray-200 rounded-lg py-1.5 pl-7 pr-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${!canEdit ? 'bg-gray-50 text-gray-500' : 'text-gray-900'}`}
                                                                value={formatDecimal(proposalItem.valor_lona)}
                                                                onChange={(e) => {
                                                                    if (!canEdit) return;
                                                                    const val = parseFloat(e.target.value.replace(/\./g, '').replace(',', '.'));
                                                                    if (!isNaN(val)) updateProposalItem({ valor_lona: val });
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* OBSERVAÇÕES DA PROPOSTA */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-gray-400" />
                                                <h3 className="font-bold text-xs uppercase text-gray-400 tracking-widest">Observações (Proposta)</h3>
                                            </div>
                                            <textarea
                                                disabled={!canEdit}
                                                className={`w-full text-xs leading-relaxed p-3 rounded-xl border transition-all resize-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${!canEdit ? 'bg-yellow-50/30 text-gray-600 border-yellow-100/50' : 'bg-white border-gray-200 text-gray-800 focus:bg-yellow-50/50'}`}
                                                rows={3}
                                                placeholder={canEdit ? "Adicione observações para esta proposta..." : "Sem observações."}
                                                value={proposalItem.observacoes || ''}
                                                onChange={(e) => updateProposalItem({ observacoes: e.target.value })}
                                            />
                                        </div>

                                        {/* PONTO DE REFERÊNCIA DA PROPOSTA */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                <h3 className="font-bold text-xs uppercase text-gray-400 tracking-widest">Ponto de Referência (Proposta)</h3>
                                            </div>
                                            <textarea
                                                disabled={!canEdit}
                                                className={`w-full text-xs leading-relaxed p-3 rounded-xl border transition-all resize-none focus:ring-2 focus:ring-blue-400 focus:border-transparent ${!canEdit ? 'bg-blue-50/30 text-gray-600 border-blue-100/50' : 'bg-white border-gray-200 text-gray-800 focus:bg-blue-50/50'}`}
                                                rows={2}
                                                placeholder={canEdit ? "Defina um ponto de referência..." : "Sem ponto de referência."}
                                                value={proposalItem.ponto_referencia || ''}
                                                onChange={(e) => updateProposalItem({ ponto_referencia: e.target.value })}
                                            />
                                        </div>
                                    </>
                                );
                            }

                            // FALLBACK: SHOW DEFAULT POINT DATA (IF NOT IN PROPOSAL)
                            return (
                                <>
                                    {/* Default Products/Values */}
                                    {produtos.length > 0 && (
                                        <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 space-y-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="p-1 rounded-md bg-white border border-gray-200 shadow-sm text-emidias-success">
                                                    <DollarSign size={14} />
                                                </div>
                                                <h3 className="font-semibold text-gray-800 text-sm">
                                                    {user?.type === 'external' ? 'Valores Estimados' : 'Tabela de Preços'}
                                                </h3>
                                            </div>
                                            <div className="space-y-2">
                                                {produtos.map((produto, idx) => {
                                                    let displayValue = produto.valor;
                                                    const isLocacao = produto.tipo.toLowerCase().includes('locação') ||
                                                        produto.tipo.toLowerCase().includes('locacao') ||
                                                        produto.tipo.toLowerCase().includes('bissemanal') ||
                                                        produto.tipo.toLowerCase().includes('mensal');

                                                    if (user?.type === 'external') {
                                                        if (isLocacao) {
                                                            displayValue = produto.valor * 2;
                                                        } else {
                                                            displayValue = produto.valor * 1.25;
                                                        }
                                                    }

                                                    return (
                                                        <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-200/50 last:border-0">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium text-gray-700">{produto.tipo}</span>
                                                                {produto.periodo && (
                                                                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">{produto.periodo}</span>
                                                                )}
                                                            </div>
                                                            <span className="font-bold text-gray-900">
                                                                {formatCurrency(displayValue)}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Default Observações */}
                                    {selectedPonto.observacoes && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <FileText size={14} className="text-gray-400" />
                                                <h3 className="font-bold text-xs uppercase text-gray-400 tracking-widest">Observações</h3>
                                            </div>
                                            <div className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap bg-yellow-50/50 p-3 rounded-xl border border-yellow-100/50">
                                                {selectedPonto.observacoes}
                                            </div>
                                        </div>
                                    )}

                                    {/* Default Ponto de Referência */}
                                    {selectedPonto.ponto_referencia && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} className="text-gray-400" />
                                                <h3 className="font-bold text-xs uppercase text-gray-400 tracking-widest">Ponto de Referência</h3>
                                            </div>
                                            <div className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                                {selectedPonto.ponto_referencia}
                                            </div>
                                        </div>
                                    )}
                                </>
                            );
                        })()}

                        {/* Bottom Spacer */}
                        <div className="h-12"></div>
                    </div>
                </div>

                {/* Actions Footer - Glassmorphic */}
                <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white/80 backdrop-blur-md">
                    <div className="flex items-center justify-between gap-2">
                        {/* Left Group */}
                        <div className="flex gap-2">
                            {/* Street View */}
                            {selectedPonto.latitude && selectedPonto.longitude && (
                                <Button
                                    onClick={handleStreetView}
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl h-10 w-10 border-gray-200 text-gray-600 hover:text-emidias-primary hover:border-emidias-primary/30"
                                    title="Ver no Street View"
                                >
                                    <Eye size={18} />
                                </Button>
                            )}

                            {/* Edit/History - Hidden in proposal view */}
                            {!selectedProposta && (
                                <>
                                    <Button
                                        onClick={handleEdit}
                                        variant="outline"
                                        size="icon"
                                        className="rounded-xl h-10 w-10 border-gray-200 text-gray-600 hover:text-emidias-primary hover:border-emidias-primary/30"
                                        title="Editar"
                                    >
                                        <Pencil size={18} />
                                    </Button>
                                    <Button
                                        onClick={handleHistory}
                                        variant="outline"
                                        size="icon"
                                        className="rounded-xl h-10 w-10 border-gray-200 text-gray-600 hover:text-emidias-primary hover:border-emidias-primary/30"
                                        title="Histórico"
                                    >
                                        <History size={18} />
                                    </Button>
                                </>
                            )}
                        </div>

                        {/* Right Group / Main Action */}
                        <div className="flex gap-2 flex-1 justify-end">
                            {selectedProposta && isAuthenticated && (() => {
                                const isInCart = selectedProposta.itens?.some((i: any) => i.id_ooh === selectedPonto.id) || false;
                                return (
                                    <Button
                                        onClick={handleAddToProposal}
                                        variant={isInCart ? "danger" : "primary"}
                                        className={cn(
                                            "flex-1 shadow-md hover:shadow-lg transition-all rounded-xl gap-2 font-semibold",
                                            isInCart ? "bg-red-500 hover:bg-red-600" : "bg-emidias-primary hover:bg-emidias-primary-dark"
                                        )}
                                    >
                                        <ShoppingCart size={18} />
                                        <span className="truncate">{isInCart ? 'Remover' : 'Adicionar'}</span>
                                    </Button>
                                );
                            })()}

                            {!selectedProposta && user?.role === 'master' && (
                                <Button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    variant="outline"
                                    size="icon"
                                    className="rounded-xl h-10 w-10 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                type="points"
                id={selectedPonto?.id || 0}
            />
        </>
    );
}
