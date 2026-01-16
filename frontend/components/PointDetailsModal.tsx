'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, DollarSign, ChevronLeft, ChevronRight, Eye, ShoppingCart, Copy, ExternalLink, Loader2, Tag, Navigation, Phone, Mail, MessageSquare, Trash2, Edit, History } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { toast } from 'sonner';
import { ExhibitorPopover } from '@/components/ui/ExhibitorPopover';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';
import HistoryModal from '@/components/HistoryModal';

interface PointDetailsModalProps {
    readOnly?: boolean;
}

export default function PointDetailsModal({ readOnly = false }: PointDetailsModalProps) {
    const selectedPonto = useStore((state) => state.selectedPonto);
    const isPointModalOpen = useStore((state) => state.isPointModalOpen);
    const pointModalIndex = useStore((state) => state.pointModalIndex);
    const setPointModalOpen = useStore((state) => state.setPointModalOpen);
    const setPointModalIndex = useStore((state) => state.setPointModalIndex);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const setStreetViewRequest = useStore((state) => state.setStreetViewRequest);
    const setHighlightedPointId = useStore((state) => state.setHighlightedPointId);
    const selectedProposta = useStore((state) => state.selectedProposta);
    const user = useStore((state) => state.user);
    const exibidoras = useStore((state) => state.exibidoras);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);
    const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
    const setCurrentView = useStore((state) => state.setCurrentView);
    // Edit & Delete
    const setEditingPonto = useStore((state) => state.setEditingPonto);
    const setModalOpen = useStore((state) => state.setModalOpen); // Edit Modal
    const setPontos = useStore((state) => state.setPontos); // For deletion update
    const pontos = useStore((state) => state.pontos); // For deletion update

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<any>(null);

    const imagens = selectedPonto?.imagens || [];
    const produtos = selectedPonto?.produtos || [];

    // Determine permissions
    const isInternal = !!user && (user.type === 'internal' || user.role === 'admin' || user.role === 'master');
    const canEdit = isInternal && !readOnly;

    // Get cart items for navigation
    const cartItems = selectedProposta?.itens || [];
    const canNavigate = cartItems.length > 1;
    const currentIndex = pointModalIndex;
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < cartItems.length - 1;

    // --- Mini Map Logic ---
    useEffect(() => {
        if (!isPointModalOpen || !selectedPonto) return;

        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            const initMiniMap = async () => {
                try {
                    const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
                    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '', v: "weekly" });

                    await importLibrary("maps");
                    const { AdvancedMarkerElement } = await importLibrary("marker") as any;

                    if (!mapRef.current) return;

                    googleMapRef.current = new google.maps.Map(mapRef.current, {
                        center: { lat: selectedPonto.latitude!, lng: selectedPonto.longitude! },
                        zoom: 16,
                        mapId: "POINT_DETAILS_MAP",
                        mapTypeControl: false,
                        fullscreenControl: false,
                        streetViewControl: false,
                        zoomControl: false,
                        gestureHandling: 'none', // Static map usage primarily
                        disableDefaultUI: true,
                    });

                    // Custom Pin
                    const pinWrapper = document.createElement('div');
                    pinWrapper.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="32" height="32" fill="#FC1E75">
                            <path d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z M192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80s-80 35.8-80 80s35.8 80 80 80z"/>
                        </svg>`;

                    markerRef.current = new AdvancedMarkerElement({
                        position: { lat: selectedPonto.latitude!, lng: selectedPonto.longitude! },
                        map: googleMapRef.current,
                        content: pinWrapper,
                    });

                } catch (error) {
                    console.error("Error loading mini-map:", error);
                }
            };
            initMiniMap();
        }, 300); // Slight delay for animation

        return () => {
            clearTimeout(timer);
            if (markerRef.current) markerRef.current.map = null;
            googleMapRef.current = null;
        };
    }, [isPointModalOpen, selectedPonto]);

    useEffect(() => {
        if (selectedPonto) setCurrentImageIndex(0);
    }, [selectedPonto?.id]);

    const handleClose = useCallback(() => {
        setPointModalOpen(false);
        setSelectedPonto(null);
    }, [setPointModalOpen, setSelectedPonto]);

    const handlePrevious = useCallback(() => {
        if (!hasPrevious) return;
        const newIndex = currentIndex - 1;
        const item = cartItems[newIndex];
        const ponto = useStore.getState().pontos.find(p => p.id === item.id_ooh);
        if (ponto) {
            setSelectedPonto(ponto);
            setPointModalIndex(newIndex);
        }
    }, [hasPrevious, currentIndex, cartItems, setSelectedPonto, setPointModalIndex]);

    const handleNext = useCallback(() => {
        if (!hasNext) return;
        const newIndex = currentIndex + 1;
        const item = cartItems[newIndex];
        const ponto = useStore.getState().pontos.find(p => p.id === item.id_ooh);
        if (ponto) {
            setSelectedPonto(ponto);
            setPointModalIndex(newIndex);
        }
    }, [hasNext, currentIndex, cartItems, setSelectedPonto, setPointModalIndex]);

    const handleCopyAddress = useCallback(() => {
        if (selectedPonto) {
            const fullAddress = `${selectedPonto.endereco}, ${selectedPonto.cidade} - ${selectedPonto.uf}`;
            navigator.clipboard.writeText(fullAddress);
            toast.success('Endereço copiado!');
        }
    }, [selectedPonto]);

    // --- Admin Actions ---
    const handleEdit = useCallback(() => {
        if (!selectedPonto) return;
        setEditingPonto(selectedPonto);
        setPointModalOpen(false); // Close details
        setModalOpen(true); // Open edit modal
    }, [selectedPonto, setEditingPonto, setPointModalOpen, setModalOpen]);

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
            handleClose();
            toast.success('Ponto deletado com sucesso!');
        } catch (error: any) {
            console.error('Erro ao deletar ponto:', error);
            toast.error('Erro ao deletar ponto');
        } finally {
            setIsDeleting(false);
        }
    }, [selectedPonto, pontos, setPontos, handleClose]);

    // --- Cart Actions ---
    const handleAddToCart = useCallback(async () => {
        if (!selectedPonto || !selectedProposta) return;

        setIsAddingToCart(true);
        try {
            const proposalItens = selectedProposta.itens || [];
            const isInCart = proposalItens.some((i: any) => i.id_ooh === selectedPonto.id);

            if (isInCart) {
                // Remove
                const updatedItens = proposalItens.filter((i: any) => i.id_ooh !== selectedPonto.id);
                await api.updateCart(selectedProposta.id, updatedItens);
                const updatedProposta = await api.getProposta(selectedProposta.id);
                useStore.getState().refreshProposta(updatedProposta);
                toast.success('Removido do carrinho');
                return;
            }

            // Calculations (Logic from Sidebar)
            const calcularValorComissao = (valorBase: number, comissao: string): number => {
                if (comissao === 'V0' || comissao === 'CLIENT' || user?.type === 'external') {
                    return parseFloat((valorBase * 2).toFixed(2));
                }
                const v2 = valorBase * 1.25;
                if (comissao === 'V2') return parseFloat(v2.toFixed(2));
                const v3 = v2 * 1.25;
                if (comissao === 'V3') return parseFloat(v3.toFixed(2));
                const v4 = v3 * 1.25;
                return parseFloat(v4.toFixed(2));
            };

            const papelProduto = selectedPonto.produtos?.find(p => p.tipo.toLowerCase().includes('papel'));
            const lonaProduto = selectedPonto.produtos?.find(p => p.tipo.toLowerCase().includes('lona'));
            const locacaoProduto = selectedPonto.produtos?.find(p =>
                p.tipo.toLowerCase().includes('locação') ||
                p.tipo.toLowerCase().includes('locacao') ||
                p.tipo.toLowerCase().includes('bissemanal') ||
                p.tipo.toLowerCase().includes('mensal')
            );

            const valorPapel = papelProduto ? parseFloat((papelProduto.valor * 1.25).toFixed(2)) : 0;
            const valorLona = lonaProduto ? parseFloat((lonaProduto.valor * 1.25).toFixed(2)) : 0;
            const valorLocacao = locacaoProduto ? calcularValorComissao(locacaoProduto.valor, selectedProposta.comissao) : 0;

            const item = {
                id_proposta: selectedProposta.id,
                id_ooh: selectedPonto.id,
                periodo_inicio: new Date().toISOString().split('T')[0],
                periodo_fim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                valor_locacao: valorLocacao,
                valor_papel: valorPapel,
                valor_lona: valorLona,
                periodo_comercializado: 'bissemanal',
                observacoes: '',
                fluxo_diario: selectedPonto.fluxo || 0
            };

            const data = await api.getProposta(selectedProposta.id);
            const currentItens = data.itens || [];
            if (currentItens.some((i: any) => i.id_ooh === selectedPonto.id)) return;

            const newItens = [...currentItens, item];
            await api.updateCart(selectedProposta.id, newItens);
            const updatedProposta = await api.getProposta(selectedProposta.id);
            useStore.getState().refreshProposta(updatedProposta);
            toast.success('Adicionado ao carrinho');

        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            toast.error('Erro ao adicionar ao carrinho');
        } finally {
            setIsAddingToCart(false);
        }
    }, [selectedPonto, selectedProposta, user]);

    const handleViewInProposal = useCallback(() => {
        if (!selectedPonto) return;
        setPointModalOpen(false);
        setHighlightedPointId(selectedPonto.id);
        setTimeout(() => setHighlightedPointId(null), 3000);
    }, [selectedPonto, setPointModalOpen, setHighlightedPointId]);

    const handleStreetView = useCallback(() => {
        if (selectedPonto?.latitude && selectedPonto?.longitude) {
            setStreetViewRequest({ lat: selectedPonto.latitude, lng: selectedPonto.longitude });
        }
    }, [selectedPonto, setStreetViewRequest]);

    if (!selectedPonto || !isPointModalOpen) return null;

    const proposalItem = selectedProposta?.itens?.find((i: any) => i.id_ooh === selectedPonto.id);
    const isInCart = !!proposalItem;

    return (
        <Modal
            isOpen={isPointModalOpen}
            onClose={handleClose}
            maxWidth="6xl" // Wider for Bento Grid
            className="p-0 overflow-hidden" // Remove default padding for custom layout
            zIndex={2000}
        >
            {/* --- NEW HEADER-STYLE LAYOUT --- */}
            <div className="flex flex-col h-[90vh] lg:h-[85vh] bg-white overflow-hidden">

                {/* --- HEADER: VISUALS (50%) --- */}
                <div className="h-[45%] lg:h-[50%] w-full flex flex-row bg-black relative group flex-shrink-0">

                    {/* LEFT: Image Carousel (50%) */}
                    <div className="w-1/2 h-full relative overflow-hidden bg-gray-900 border-r border-white/10">
                        {imagens.length > 0 ? (
                            <>
                                <SafeImage
                                    src={api.getImageUrl(imagens[currentImageIndex])}
                                    alt="Visualização do Ponto"
                                    className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                                {/* Image Navigation */}
                                {imagens.length > 1 && (
                                    <>
                                        <button onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length)} className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all z-10">
                                            <ChevronLeft size={18} />
                                        </button>
                                        <button onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imagens.length)} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-all z-10">
                                            <ChevronRight size={18} />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                                            {imagens.map((_, idx) => (
                                                <div key={idx} className={cn("w-1.5 h-1.5 rounded-full transition-all", idx === currentImageIndex ? "bg-white w-3" : "bg-white/40")} />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                                <Building2 size={40} strokeWidth={1} />
                                <p className="text-sm">Sem imagem</p>
                            </div>
                        )}

                        <div className="absolute top-4 left-4 z-20">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/50 text-white backdrop-blur-md border border-white/10")}>
                                {selectedPonto.tipo}
                            </span>
                        </div>
                    </div>

                    {/* RIGHT: Map (50%) */}
                    <div className="w-1/2 h-full relative bg-gray-100">
                        <div ref={mapRef} className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-500" />

                        <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
                            <Button
                                onClick={handleClose}
                                size="sm"
                                className="h-8 w-8 rounded-full bg-white text-gray-900 shadow-md hover:bg-gray-100 p-0 flex items-center justify-center"
                            >
                                <X size={18} />
                            </Button>
                        </div>

                        <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                            <Button
                                onClick={handleStreetView}
                                size="sm"
                                className="bg-white/90 hover:bg-white text-gray-900 shadow-sm backdrop-blur-sm border-0 text-xs h-7"
                                leftIcon={<Eye size={12} />}
                            >
                                Street View
                            </Button>
                            <Button
                                onClick={() => window.open(`https://www.google.com/maps?q=${selectedPonto.latitude},${selectedPonto.longitude}`, '_blank')}
                                size="sm"
                                className="bg-white/90 hover:bg-white text-gray-900 shadow-sm backdrop-blur-sm border-0 text-xs h-7"
                                leftIcon={<ExternalLink size={12} />}
                            >
                                Maps
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- BODY: CONTENT (SCROLLABLE) --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/50">
                    <div className="max-w-5xl mx-auto w-full"> {/* Centered container */}

                        {/* Header Details Bar */}
                        <div className="bg-white p-6 shadow-sm border-b border-gray-100 sticky top-0 z-30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight leading-none mb-1">{selectedPonto.codigo_ooh}</h1>
                                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                                        <ExhibitorPopover
                                            exhibitorId={selectedPonto.id_exibidora || 0}
                                            exhibitorName={selectedPonto.exibidora_nome || 'Exibidora'}
                                            onFilter={(id) => {
                                                setFilterExibidora([id]);
                                                setSelectedExibidora(exibidoras.find(e => e.id === id) || null);
                                                setCurrentView('map');
                                                handleClose();
                                            }}
                                        >
                                            <span className="flex items-center gap-1.5 hover:text-emidias-primary transition-colors cursor-pointer group">
                                                <Building2 size={14} />
                                                <span className="font-medium border-b border-transparent group-hover:border-emidias-primary/30">
                                                    {selectedPonto.exibidora_nome || 'Exibidora não identificada'}
                                                </span>
                                            </span>
                                        </ExhibitorPopover>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    {canEdit && (
                                        <div className="flex bg-gray-100 rounded-lg p-1 mr-2">
                                            <button onClick={handleHistory} className="p-1.5 text-gray-400 hover:text-purple-600 rounded transition-all" title="Histórico">
                                                <History size={16} />
                                            </button>
                                            <button onClick={handleEdit} className="p-1.5 text-gray-400 hover:text-blue-600 rounded transition-all" title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            <button onClick={handleDelete} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-all" title="Excluir">
                                                {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                            </button>
                                        </div>
                                    )}

                                    {!readOnly && (
                                        <Button
                                            onClick={handleAddToCart}
                                            disabled={isAddingToCart}
                                            className={cn("h-10 px-6 text-sm font-bold shadow-md transform transition-transform active:scale-95",
                                                isInCart ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emidias-primary hover:bg-emidias-primary/90 text-white"
                                            )}
                                            leftIcon={isAddingToCart ? <Loader2 size={16} className="animate-spin" /> : isInCart ? <X size={16} /> : <ShoppingCart size={16} />}
                                        >
                                            {isAddingToCart ? '...' : isInCart ? 'Remover' : 'Adicionar à Proposta'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Left Col: Info */}
                            <div className="space-y-6">
                                {/* Address */}
                                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                                            <MapPin size={12} /> Localização
                                        </p>
                                        <button onClick={handleCopyAddress} className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <Copy size={12} />
                                        </button>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-900 leading-snug">{selectedPonto.endereco}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{selectedPonto.cidade} - {selectedPonto.uf}</p>
                                    {selectedPonto.ponto_referencia && (
                                        <div className="mt-3 text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100 italic">
                                            Ref: {selectedPonto.ponto_referencia}
                                        </div>
                                    )}
                                </div>

                                {/* Specs */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Medidas</p>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Ruler size={16} className="text-emidias-accent" />
                                            <span className="font-bold text-sm">{selectedPonto.medidas || 'N/A'}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">Impacto</p>
                                        <div className="flex items-center gap-2 text-gray-900">
                                            <Users size={16} className="text-emidias-accent" />
                                            <span className="font-bold text-sm">{selectedPonto.fluxo ? `${parseInt(selectedPonto.fluxo as any).toLocaleString()}/dia` : 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Observations */}
                                {(selectedPonto.observacoes) && (
                                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-sm">
                                        <div className="flex items-center gap-2 mb-2 text-yellow-700">
                                            <MessageSquare size={14} />
                                            <span className="text-xs font-bold uppercase tracking-widest">Observações</span>
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">{selectedPonto.observacoes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Right Col: Values */}
                            <div className="space-y-4">
                                {proposalItem ? (
                                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100 space-y-4 shadow-sm">
                                        <div className="flex items-center gap-3 border-b border-blue-200/50 pb-3">
                                            <div className="p-1.5 rounded-md bg-white border border-blue-200 text-blue-600 shadow-sm">
                                                <DollarSign size={16} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-blue-900 text-sm">Valores da Proposta</h3>
                                                <p className="text-[10px] text-blue-600/80 uppercase tracking-widest">Valores calculados em tempo real</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-600">Locação</span>
                                                <div className="flex flex-col items-end">
                                                    <span className="font-bold text-gray-900 text-lg">{formatCurrency(proposalItem.valor_locacao)}</span>
                                                    <span className="text-[10px] text-gray-400 tracking-wider font-medium">{proposalItem.periodo_comercializado || 'MENSAL'}</span>
                                                </div>
                                            </div>
                                            {proposalItem.valor_papel > 0 && (
                                                <div className="flex justify-between items-center text-sm border-t border-blue-100 pt-3">
                                                    <span className="text-gray-600">Produção (Papel)</span>
                                                    <span className="font-bold text-gray-900">{formatCurrency(proposalItem.valor_papel)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : produtos.length > 0 && (
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="bg-gray-50 px-5 py-3 border-b border-gray-100">
                                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Tabela de Preços</p>
                                        </div>
                                        <div className="p-5 space-y-4">
                                            {produtos.map((produto, idx) => {
                                                const displayValue = user?.type === 'external' ? produto.valor * 2 : produto.valor;
                                                return (
                                                    <div key={idx} className="flex justify-between items-center text-sm group">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-700 group-hover:text-gray-900">{produto.tipo}</span>
                                                            {produto.periodo && <span className="text-[10px] text-gray-400">{produto.periodo}</span>}
                                                        </div>
                                                        <span className="font-bold text-gray-900 bg-gray-50 px-2 py-1 rounded border border-gray-100 group-hover:bg-white transition-colors">{formatCurrency(displayValue)}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>
                </div>

                {/* Footer Nav Bar */}
                {cartItems.length > 1 && (
                    <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-center gap-4 text-sm font-medium text-gray-500 z-30">
                        <Button onClick={handlePrevious} disabled={!hasPrevious} variant="ghost" size="sm" leftIcon={<ChevronLeft size={14} />}>
                            Anterior
                        </Button>
                        <span>{currentIndex + 1} / {cartItems.length}</span>
                        <Button onClick={handleNext} disabled={!hasNext} variant="ghost" size="sm" rightIcon={<ChevronRight size={14} />}>
                            Próximo
                        </Button>
                    </div>
                )}
            </div>

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                type="points"
                id={selectedPonto.id}
            />
        </Modal>
    );
}
