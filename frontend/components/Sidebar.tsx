'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, Pencil, History, Eye, ChevronLeft, ChevronRight, Phone, Mail, Trash2, DollarSign, Tag, Calendar, ExternalLink, Loader2, Calculator, ShoppingCart } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Contato, Proposta } from '@/lib/types';

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
        <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Contatos</p>
            {contatos.map((contato) => (
                <div key={contato.id} className="p-3 bg-emidias-gray-50 rounded-lg border border-emidias-gray-100 hover:border-emidias-accent/30 transition-all">
                    {contato.nome && (
                        <p className="font-medium text-emidias-gray-900 text-sm">{contato.nome}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                        {contato.telefone && (
                            <a
                                href={`tel:${contato.telefone}`}
                                className="flex items-center gap-1.5 text-xs text-emidias-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Phone size={12} />
                                {contato.telefone}
                            </a>
                        )}
                        {contato.email && (
                            <a
                                href={`mailto:${contato.email}`}
                                className="flex items-center gap-1.5 text-xs text-emidias-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Mail size={12} />
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
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
        alert('Funcionalidade de histórico será implementada em breve');
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
            // Default item structure
            const item = {
                id_proposta: selectedProposta.id,
                id_ooh: selectedPonto.id,
                periodo_inicio: new Date().toISOString().split('T')[0],
                periodo_fim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 days default
                valor_locacao: selectedPonto.produtos?.[0]?.valor || 0, // Default to first product price
                valor_papel: 0,
                valor_lona: 0,
                periodo_comercializado: 'bissemanal',
                observacoes: '',
                fluxo_diario: selectedPonto.fluxo || 0 // Store current fluxo for consistent calculations
            };

            // Call API to add item. For now, since we implemented 'updateCart' (bulk PUT) but not 'addItem',
            // let's assume we need to fetch current items, append, and save?
            // Actually, for efficiency, let's implement a direct ADD endpoint or use a helper.
            // Since I only created `updateCart` (PUT /itens), I should probably fetch+update or quick-patch.
            // But wait, the previous `handlePropostas` only supported GET/:id and PUT/:id/itens.
            // I should stick to fetching ALL items, adding one to array, and PUTting back.
            // OR even better: just implemented bulk update for simplicity in previous step.

            // Let's rely on `api.updateCart`.
            // First fetch current items.
            const data = await api.getProposta(selectedProposta.id);
            const currentItens = data.itens || [];

            // Check if already in cart
            if (currentItens.some((i: any) => i.id_ooh === selectedPonto.id)) {
                alert('Este ponto já está na proposta!');
                return;
            }

            const newItens = [...currentItens, item];
            await api.updateCart(selectedProposta.id, newItens);

            alert('Ponto adicionado ao carrinho com sucesso!');
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            alert('Erro ao adicionar ponto à proposta.');
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
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden transition-opacity"
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-full sm:w-[420px] bg-white shadow-emidias-2xl z-30 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col animate-slide-in-right">
                {/* Close Button - Floating */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 backdrop-blur-sm"
                    title="Fechar"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* Header com imagens / Carrossel */}
                <div className="relative h-48 bg-gradient-to-br from-emidias-primary to-emidias-accent flex-shrink-0">
                    {imagens.length > 0 ? (
                        <>
                            <img
                                src={api.getImageUrl(imagens[currentImageIndex])}
                                alt={`Imagem ${currentImageIndex + 1}`}
                                className="w-full h-full object-cover transition-opacity duration-500"
                            />

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                            {/* Navigation Arrows */}
                            {imagens.length > 1 && (
                                <>
                                    <button
                                        onClick={prevImage}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <ChevronLeft size={28} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={nextImage}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 text-white rounded-full flex items-center justify-center transition-all hover:scale-110"
                                    >
                                        <ChevronRight size={28} strokeWidth={2.5} />
                                    </button>

                                    {/* Dots Indicator */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {imagens.map((_, index) => (
                                            <button
                                                key={index}
                                                onClick={() => goToImage(index)}
                                                className={`carousel-dot ${index === currentImageIndex ? 'active' : ''}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <MapPin size={64} className="text-white/30 mx-auto mb-2" />
                                <p className="text-white/50 text-sm">Sem imagens</p>
                            </div>
                        </div>
                    )}

                    {/* Meta Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">
                            {selectedPonto.codigo_ooh}
                        </h2>
                        <div className="flex items-center gap-2 text-sm text-white/80">
                            <Calendar size={14} />
                            <span>{formatDate(selectedPonto.created_at)}</span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Info Items */}
                        <div className="space-y-3">
                            {/* Endereço */}
                            <div className="sidebar-info-item">
                                <MapPin className="sidebar-info-icon" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Endereço</p>
                                    <p className="text-emidias-gray-900 font-medium mt-0.5">{selectedPonto.endereco}</p>
                                    {selectedPonto.cidade && selectedPonto.uf && (
                                        <p className="text-sm text-emidias-gray-500 mt-0.5">
                                            {selectedPonto.cidade} - {selectedPonto.uf}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Exibidora */}
                            {selectedPonto.exibidora_nome && (
                                <div className="sidebar-info-item">
                                    <Building2 className="sidebar-info-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Exibidora</p>
                                        <button
                                            onClick={handleExibidoraClick}
                                            className="group flex items-center gap-1 text-emidias-gray-900 font-medium mt-0.5 hover:text-emidias-accent transition-colors"
                                        >
                                            {selectedPonto.exibidora_nome}
                                            <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                        {selectedPonto.exibidora_cnpj && (
                                            <p className="text-xs text-emidias-gray-500 mt-0.5 font-mono">
                                                CNPJ: {selectedPonto.exibidora_cnpj}
                                            </p>
                                        )}

                                        <ContatosExibidora idExibidora={selectedPonto.id_exibidora} />
                                    </div>
                                </div>
                            )}

                            {/* Grid de Informações Secundárias */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                {/* Medidas */}
                                {selectedPonto.medidas && (
                                    <div className="sidebar-info-item flex-col items-start">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Ruler className="w-4 h-4 text-emidias-accent" />
                                            <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Medidas</p>
                                        </div>
                                        <p className="text-emidias-gray-900 font-medium text-sm">{selectedPonto.medidas}</p>
                                    </div>
                                )}

                                {/* Fluxo */}
                                {selectedPonto.fluxo && (
                                    <div className="sidebar-info-item flex-col items-start">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users className="w-4 h-4 text-emidias-accent" />
                                            <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Fluxo</p>
                                        </div>
                                        <p className="text-emidias-gray-900 font-medium text-sm">{selectedPonto.fluxo.toLocaleString()}/dia</p>
                                    </div>
                                )}

                                {/* Tipo */}
                                {selectedPonto.tipo && (
                                    <div className="sidebar-info-item flex-col items-start col-span-2">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Tag className="w-4 h-4 text-emidias-accent" />
                                            <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Tipo</p>
                                        </div>
                                        <span className="badge badge-accent">{selectedPonto.tipo}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Produtos e Valores */}
                        {produtos.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-emidias-accent" />
                                    <h3 className="font-semibold text-emidias-gray-900">Produtos e Valores</h3>
                                </div>
                                <div className="space-y-2">
                                    {produtos.map((produto, idx) => (
                                        <div key={idx} className="p-4 bg-gradient-to-r from-emidias-gray-50 to-transparent rounded-xl border border-emidias-gray-100 hover:border-emidias-accent/30 transition-all">
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <span className="font-semibold text-emidias-gray-900">{produto.tipo}</span>
                                                    {produto.periodo && (
                                                        <p className="text-xs text-emidias-gray-500 mt-1">{produto.periodo}</p>
                                                    )}
                                                </div>
                                                <span className="text-lg font-bold text-emidias-accent whitespace-nowrap">
                                                    {formatCurrency(produto.valor)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Observações */}
                        {selectedPonto.observacoes && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-emidias-accent" />
                                    <h3 className="font-semibold text-emidias-gray-900">Observações</h3>
                                </div>
                                <p className="text-emidias-gray-600 text-sm leading-relaxed whitespace-pre-wrap bg-emidias-gray-50 p-4 rounded-xl border border-emidias-gray-100">
                                    {selectedPonto.observacoes}
                                </p>
                            </div>
                        )}

                        {/* Ponto de Referência */}
                        {selectedPonto.ponto_referencia && (
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-emidias-accent" />
                                    <h3 className="font-semibold text-emidias-gray-900">Ponto de Referência</h3>
                                </div>
                                <p className="text-emidias-gray-600 text-sm leading-relaxed whitespace-pre-wrap bg-emidias-blue-50/50 p-4 rounded-xl border border-emidias-blue-100">
                                    {selectedPonto.ponto_referencia}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions Footer - Fixed */}
                <div className="flex-shrink-0 p-4 border-t border-emidias-gray-100 bg-white/80 backdrop-blur-sm">
                    {/* Icon-only action buttons in a compact row */}
                    <div className="flex items-center justify-around gap-2">
                        {/* Street View */}
                        {selectedPonto.latitude && selectedPonto.longitude && (
                            <button
                                onClick={handleStreetView}
                                className="flex items-center justify-center w-11 h-11 rounded-lg bg-emidias-accent/10 text-emidias-accent hover:bg-emidias-accent hover:text-white transition-all hover:scale-105"
                                title="Ver no Street View"
                            >
                                <Eye size={20} />
                            </button>
                        )}

                        {/* Edit */}
                        <button
                            onClick={handleEdit}
                            className="flex items-center justify-center w-11 h-11 rounded-lg bg-emidias-primary/10 text-emidias-primary hover:bg-emidias-primary hover:text-white transition-all hover:scale-105"
                            title="Editar"
                        >
                            <Pencil size={18} />
                        </button>

                        {/* History */}
                        <button
                            onClick={handleHistory}
                            className="flex items-center justify-center w-11 h-11 rounded-lg bg-emidias-gray-100 text-emidias-gray-600 hover:bg-emidias-gray-200 hover:text-emidias-gray-900 transition-all hover:scale-105"
                            title="Histórico"
                        >
                            <History size={18} />
                        </button>

                        {/* Add to Proposal */}
                        {selectedProposta && (
                            <button
                                onClick={handleAddToProposal}
                                className="flex items-center justify-center w-auto px-4 h-11 rounded-lg bg-emidias-accent text-white hover:bg-emidias-accent-dark transition-all hover:scale-105 shadow-lg shadow-emidias-accent/20 gap-2 font-semibold"
                                title={`Adicionar à ${selectedProposta.nome}`}
                            >
                                <ShoppingCart size={18} />
                                <span className="hidden sm:inline">Adicionar</span>
                            </button>
                        )}

                        {/* Delete - Master Only */}
                        {user?.role === 'master' && (
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center justify-center w-11 h-11 rounded-lg bg-emidias-danger/10 text-emidias-danger hover:bg-emidias-danger hover:text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Deletar Ponto"
                            >
                                {isDeleting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <Trash2 size={18} />
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
