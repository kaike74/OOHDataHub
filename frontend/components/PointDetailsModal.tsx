'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, DollarSign, ChevronLeft, ChevronRight, Eye, ShoppingCart, Copy, ExternalLink, Loader2, Tag, Navigation, Phone, Mail, MessageSquare, Trash2, Edit, History, Search, Minimize2, Maximize2, Check } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { toast } from 'sonner';
import { ExhibitorPopover } from '@/components/ui/ExhibitorPopover';
import AddressSearch from '@/components/AddressSearch';
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
    const [isLightboxOpen, setIsLightboxOpen] = useState(false); // Lightbox State

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
    // Navigation should only be available if the modal index is valid (meaning we opened from a list context)
    const canNavigate = cartItems.length > 1 && pointModalIndex !== -1 && pointModalIndex !== undefined;
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

            // Calculations 
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
    const cartIds = selectedProposta?.itens?.map((i: any) => i.id_ooh) || [];

    return (
        <Modal
            isOpen={isPointModalOpen}
            onClose={handleClose}
            maxWidth="6xl"
            className="p-0 overflow-hidden"
            zIndex={2000}
        >
            {/* --- NEW SIDE-BY-SIDE LAYOUT (Reduced Height) --- */}
            <div className="flex flex-row h-[70vh] bg-white overflow-hidden shadow-2xl">

                {/* --- LEFT: VISUALS (40%) --- */}
                <div className="w-[40%] h-full flex flex-col bg-black relative group border-r border-gray-100/10">

                    {/* Top: Image (65%) */}
                    <div className="h-[65%] w-full relative overflow-hidden bg-gray-900 group/image">
                        {imagens.length > 0 ? (
                            <>
                                <SafeImage
                                    src={api.getImageUrl(imagens[currentImageIndex])}
                                    alt="Visualização do Ponto"
                                    className="w-full h-full object-cover opacity-95 hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                                {/* Expand Button (Traditional Icon) */}
                                <button
                                    onClick={() => setIsLightboxOpen(true)}
                                    className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover/image:opacity-100 transition-opacity z-20"
                                    title="Expandir Imagem"
                                >
                                    <Maximize2 size={18} />
                                </button>

                                {/* Navigation */}
                                {imagens.length > 1 && (
                                    <>
                                        <button onClick={() => setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length)} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-opacity opacity-0 group-hover/image:opacity-100 z-20">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button onClick={() => setCurrentImageIndex((prev) => (prev + 1) % imagens.length)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-opacity opacity-0 group-hover/image:opacity-100 z-20">
                                            <ChevronRight size={20} />
                                        </button>
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
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

                    {/* Bottom: Map (35%) */}
                    <div className="h-[35%] w-full relative bg-gray-100 border-t border-white/10">
                        <div ref={mapRef} className="w-full h-full grayscale-[20%] hover:grayscale-0 transition-all duration-500" />

                        <div className="absolute bottom-2 right-2 flex gap-1 z-10">
                            <Button
                                onClick={handleStreetView}
                                size="sm"
                                className="bg-white/90 hover:bg-white text-gray-900 shadow-sm backdrop-blur-sm border-0 text-[10px] h-6 px-2"
                                leftIcon={<Eye size={10} />}
                            >
                                Street View
                            </Button>
                            <Button
                                onClick={() => window.open(`https://www.google.com/maps?q=${selectedPonto.latitude},${selectedPonto.longitude}`, '_blank')}
                                size="sm"
                                className="bg-white/90 hover:bg-white text-gray-900 shadow-sm backdrop-blur-sm border-0 text-[10px] h-6 px-2"
                                leftIcon={<MapPin size={10} />}
                            >
                                Maps
                            </Button>
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: DATA (60%) --- */}
                <div className="w-[60%] h-full flex flex-col bg-white relative">

                    {/* Header */}
                    <div className="h-14 px-5 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-20">
                        <div className="flex items-center gap-4 flex-1">
                            <h1 className="text-xl font-bold text-gray-900 tracking-tight leading-none">{selectedPonto.codigo_ooh}</h1>

                            {/* Internal Search Bar (Restricted) */}
                            <div className="w-64 relative">
                                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400 z-10">
                                    <Search size={14} />
                                </div>
                                <AddressSearch
                                    onlyPoints={true} // Restricted Search
                                    cartIds={cartIds}
                                    onLocationSelect={() => { }}
                                    onSelectExhibitor={(id) => { }}
                                    onSelectPoint={(ponto) => {
                                        setSelectedPonto(ponto);
                                        // Reset index if we switch point via search
                                        setPointModalIndex(-1);
                                    }}
                                />
                                <style jsx global>{`
                                    .finder-box-container {
                                        position: absolute;
                                        top: 50%;
                                        transform: translateY(-50%);
                                        left: 0;
                                        height: 30px !important;
                                    }
                                    .finder-box-container input {
                                        height: 30px !important;
                                        font-size: 12px !important;
                                        padding-left: 36px !important; 
                                        background: #F9FAFB !important;
                                        border: 1px solid #E5E7EB !important;
                                    }
                                    .finder-box-container input:focus {
                                        background: white !important;
                                        border-color: #8B5CF6 !important;
                                    }
                                    .finder-box-container .iconButton {
                                        display: none !important;
                                    }
                                `}</style>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Close Button */}
                            <button
                                onClick={handleClose}
                                className="h-8 w-8 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors border border-gray-200"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content Body - Compact Grid */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-12 gap-5 h-full content-start">

                            {/* Row 1: Address & Exhibitor (Col 12) */}
                            <div className="col-span-12">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1 flex-1 pr-4">
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
                                            <span className="flex items-center gap-1.5 text-xs font-semibold text-emidias-primary/80 hover:text-emidias-primary cursor-pointer transition-colors mb-1 w-fit">
                                                <Building2 size={12} />
                                                {(selectedPonto.exibidora_nome || 'Exibidora').toUpperCase()}
                                            </span>
                                        </ExhibitorPopover>
                                        <p className="text-base font-semibold text-gray-900 leading-snug">{selectedPonto.endereco}</p>
                                        <div className="flex flex-col gap-1 text-xs text-gray-500 mt-1">
                                            <span>{selectedPonto.cidade} - {selectedPonto.uf}</span>
                                            {selectedPonto.ponto_referencia && (
                                                <span className="italic text-gray-400">Ref: {selectedPonto.ponto_referencia}</span>
                                            )}
                                            {/* Lat / Lng Display */}
                                            <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono mt-1 pt-1 border-t border-gray-100 w-fit">
                                                <span className="flex items-center gap-1"><MapPin size={10} /> {selectedPonto.latitude?.toFixed(6)}, {selectedPonto.longitude?.toFixed(6)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {canEdit && (
                                            <>
                                                <button onClick={handleHistory} className="p-1.5 text-gray-400 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 rounded transition-all border border-gray-100" title="Histórico"><History size={16} /></button>
                                                <button onClick={handleEdit} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded transition-all border border-gray-100" title="Editar"><Edit size={16} /></button>
                                            </>
                                        )}
                                        <button onClick={handleCopyAddress} className="p-1.5 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded transition-all border border-gray-100"><Copy size={16} /></button>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="col-span-12 h-px bg-gray-100" />

                            {/* Row 2: Specs & Values */}
                            <div className="col-span-12 md:col-span-5 space-y-4">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Especificações</h3>

                                <div className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center gap-3 p-2 transition-colors border-l-2 border-transparent hover:border-gray-200">
                                        <Ruler size={16} className="text-gray-400" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-medium leading-none mb-0.5">Medidas</p>
                                            <p className="text-sm font-semibold text-gray-900 leading-none">{selectedPonto.medidas || 'N/A'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 p-2 transition-colors border-l-2 border-transparent hover:border-gray-200">
                                        <Users size={16} className="text-gray-400" />
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-medium leading-none mb-0.5">Impacto Diário</p>
                                            <p className="text-sm font-semibold text-gray-900 leading-none">{selectedPonto.fluxo ? `${parseInt(selectedPonto.fluxo as any).toLocaleString()}` : 'N/A'}</p>
                                        </div>
                                    </div>

                                    {(selectedPonto.observacoes) && (
                                        <div className="mt-2 p-3 bg-yellow-50/50 rounded-lg text-xs text-gray-600 border border-yellow-100/50">
                                            <p className="font-bold text-yellow-700/80 mb-1 uppercase text-[10px]">Observações</p>
                                            <p className="leading-relaxed line-clamp-4">{selectedPonto.observacoes}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-12 md:col-span-7 md:pl-5 md:border-l border-gray-50">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Valores & Proposta</h3>

                                <div className="space-y-3">
                                    {proposalItem ? (
                                        <div className="bg-blue-50/30 rounded-xl p-4 border border-blue-100/50">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs font-medium text-blue-800 bg-blue-100/50 px-2 py-0.5 rounded">Selecionado</span>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">{proposalItem.periodo_comercializado || 'MENSAL'}</span>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-xs text-gray-500">Locação</span>
                                                    <span className="text-xl font-bold text-gray-900">{formatCurrency(proposalItem.valor_locacao)}</span>
                                                </div>
                                                {proposalItem.valor_papel > 0 && (
                                                    <div className="flex justify-between items-end pt-2 border-t border-blue-100/50">
                                                        <span className="text-xs text-gray-500">Produção</span>
                                                        <span className="text-sm font-semibold text-gray-700">{formatCurrency(proposalItem.valor_papel)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            {produtos.length > 0 ? (
                                                <div className="space-y-2">
                                                    {produtos.slice(0, 3).map((produto, idx) => {
                                                        const displayValue = user?.type === 'external' ? produto.valor * 2 : produto.valor;
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-700">{produto.tipo}</span>
                                                                    {produto.periodo && <span className="text-[10px] text-gray-400">{produto.periodo}</span>}
                                                                </div>
                                                                <span className="font-semibold text-gray-900">{formatCurrency(displayValue)}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="text-xs text-gray-400 italic text-center">Preços sob consulta</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions - Sticks to bottom */}
                    <div className="p-3 border-t border-gray-100 bg-white z-20 shrink-0 flex items-center justify-between">

                        {/* Navigation (Left Side) - ONLY if from list context */}
                        <div className="flex items-center gap-2">
                            {canNavigate ? (
                                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                    <button onClick={handlePrevious} disabled={!hasPrevious} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-gray-600" title="Anterior"><ChevronLeft size={16} /></button>
                                    <span className="text-[10px] font-medium text-gray-500 px-2">{currentIndex + 1} / {cartItems.length}</span>
                                    <button onClick={handleNext} disabled={!hasNext} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-gray-600" title="Próximo"><ChevronRight size={16} /></button>
                                </div>
                            ) : (
                                <div /> // Spacer
                            )}
                        </div>

                        {/* Actions (Right Side) */}
                        <div className="flex items-center gap-3">
                            {/* View In List Button - Swapped Position */}
                            {isInCart && (
                                <Button onClick={handleViewInProposal} variant="outline" size="sm" className="h-9 px-3 text-xs border-gray-200 text-gray-600" leftIcon={<ExternalLink size={14} />}>
                                    Ver na Lista
                                </Button>
                            )}

                            {!readOnly && (
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart}
                                    title={isInCart ? "Remover do Plano" : "Adicionar ao Plano"}
                                    className={cn("h-9 w-9 p-0 rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center",
                                        isInCart ? "bg-red-500 hover:bg-red-600 text-white" : "bg-emidias-primary hover:bg-emidias-primary/90 text-white"
                                    )}
                                >
                                    {isAddingToCart ? <Loader2 size={16} className="animate-spin" /> : isInCart ? <X size={18} /> : <ShoppingCart size={16} />}
                                </Button>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* --- LIGHTBOX OVERLAY --- */}
            {isLightboxOpen && (
                <div className="fixed inset-0 z-[2100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    {/* Close Lightbox */}
                    <button
                        onClick={() => setIsLightboxOpen(false)}
                        className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={32} />
                    </button>

                    {/* Main Image */}
                    <div className="w-full h-full max-w-7xl max-h-[90vh] p-4 flex items-center justify-center relative">
                        <SafeImage
                            src={api.getImageUrl(imagens[currentImageIndex])}
                            alt="Visualização Fullscreen"
                            className="max-w-full max-h-full object-contain shadow-2xl"
                        />
                    </div>

                    {/* Lightbox Navigation */}
                    {imagens.length > 1 && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length); }} className="absolute left-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors">
                                <ChevronLeft size={48} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % imagens.length); }} className="absolute right-6 top-1/2 -translate-y-1/2 p-4 text-white/50 hover:text-white transition-colors">
                                <ChevronRight size={48} />
                            </button>

                            {/* Counter */}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-1 bg-black/50 rounded-full text-white/90 text-sm font-medium border border-white/10">
                                {currentImageIndex + 1} / {imagens.length}
                            </div>
                        </>
                    )}
                </div>
            )}

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                type="points"
                id={selectedPonto.id}
            />
        </Modal>
    );
}
