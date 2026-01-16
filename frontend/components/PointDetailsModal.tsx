'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, DollarSign, ChevronLeft, ChevronRight, Eye, ShoppingCart, Copy, ExternalLink, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { toast } from 'sonner';

const formatDecimal = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

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

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<any>(null);

    const imagens = selectedPonto?.imagens || [];
    const produtos = selectedPonto?.produtos || [];
    const isInternal = !!user && user.type === 'internal';

    // Get cart items for navigation
    const cartItems = selectedProposta?.itens || [];
    const canNavigate = cartItems.length > 1;
    const currentIndex = pointModalIndex;
    const hasPrevious = currentIndex > 0;
    const hasNext = currentIndex < cartItems.length - 1;

    // Initialize mini-map with delay to ensure DOM is ready
    useEffect(() => {
        if (!isPointModalOpen || !selectedPonto) return;

        // Small delay to ensure modal is fully rendered
        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            const initMiniMap = async () => {
                try {
                    const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');

                    setOptions({
                        key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
                        v: "weekly",
                    });

                    await importLibrary("maps");
                    const { AdvancedMarkerElement } = await importLibrary("marker") as any;

                    if (!mapRef.current) return;

                    // Create map centered on the point
                    googleMapRef.current = new google.maps.Map(mapRef.current, {
                        center: { lat: selectedPonto.latitude!, lng: selectedPonto.longitude! },
                        zoom: 16,
                        mapId: "POINT_DETAILS_MAP",
                        mapTypeControl: false,
                        fullscreenControl: false,
                        streetViewControl: false,
                        zoomControl: true,
                        gestureHandling: 'cooperative',
                        styles: [
                            {
                                featureType: 'poi',
                                elementType: 'labels',
                                stylers: [{ visibility: 'off' }],
                            },
                        ],
                    });

                    // Create marker for the point
                    const pinWrapper = document.createElement('div');
                    pinWrapper.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="40" height="40" fill="#FC1E75">
                            <path d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z M192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80s-80 35.8-80 80s35.8 80 80 80z"/>
                        </svg>`;

                    markerRef.current = new AdvancedMarkerElement({
                        position: { lat: selectedPonto.latitude!, lng: selectedPonto.longitude! },
                        map: googleMapRef.current,
                        content: pinWrapper,
                    });

                    // Click on map opens Google Maps
                    googleMapRef.current.addListener('click', () => {
                        const url = `https://www.google.com/maps?q=${selectedPonto.latitude},${selectedPonto.longitude}`;
                        window.open(url, '_blank');
                    });

                } catch (error) {
                    console.error("Error loading mini-map:", error);
                }
            };

            initMiniMap();
        }, 100); // Small delay to ensure DOM is ready

        return () => {
            clearTimeout(timer);
            if (markerRef.current) {
                markerRef.current.map = null;
            }
            googleMapRef.current = null;
        };
    }, [isPointModalOpen, selectedPonto]);

    // Reset image index when point changes
    useEffect(() => {
        if (selectedPonto) {
            setCurrentImageIndex(0);
        }
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

    const handleStreetView = useCallback(() => {
        if (selectedPonto?.latitude && selectedPonto?.longitude) {
            setStreetViewRequest({ lat: selectedPonto.latitude, lng: selectedPonto.longitude });
        }
    }, [selectedPonto, setStreetViewRequest]);

    const handleCopyAddress = useCallback(() => {
        if (selectedPonto) {
            const fullAddress = `${selectedPonto.endereco}, ${selectedPonto.cidade} - ${selectedPonto.uf}`;
            navigator.clipboard.writeText(fullAddress);
            toast.success('Endereço copiado!');
        }
    }, [selectedPonto]);

    const handleAddToCart = useCallback(async () => {
        if (!selectedPonto || !selectedProposta) return;

        setIsAddingToCart(true);
        try {
            const proposalItens = selectedProposta.itens || [];
            const isInCart = proposalItens.some((i: any) => i.id_ooh === selectedPonto.id);

            if (isInCart) {
                // Remove from cart
                const updatedItens = proposalItens.filter((i: any) => i.id_ooh !== selectedPonto.id);
                await api.updateCart(selectedProposta.id, updatedItens);
                const updatedProposta = await api.getProposta(selectedProposta.id);
                useStore.getState().refreshProposta(updatedProposta);
                toast.success('Removido do carrinho');
                return;
            }

            // Add to cart logic (same as Sidebar)
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

            if (currentItens.some((i: any) => i.id_ooh === selectedPonto.id)) {
                return;
            }

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

        // Close modal
        setPointModalOpen(false);

        // Set highlighted point for animation
        setHighlightedPointId(selectedPonto.id);

        // Clear highlight after animation completes (3 seconds)
        setTimeout(() => {
            setHighlightedPointId(null);
        }, 3000);
    }, [selectedPonto, setPointModalOpen, setHighlightedPointId]);

    const handleExibidoraClick = useCallback(() => {
        if (selectedPonto && selectedPonto.id_exibidora) {
            const exibidora = exibidoras.find(ex => ex.id === selectedPonto.id_exibidora);
            if (exibidora) {
                handleClose();
                setFilterExibidora([exibidora.id]);
                setSelectedExibidora(exibidora);
                setCurrentView('map');
            }
        }
    }, [selectedPonto, exibidoras, handleClose, setFilterExibidora, setSelectedExibidora, setCurrentView]);

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, [imagens.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
    }, [imagens.length]);

    if (!selectedPonto || !isPointModalOpen) return null;

    const proposalItem = selectedProposta?.itens?.find((i: any) => i.id_ooh === selectedPonto.id);
    const isInCart = !!proposalItem;

    return (
        <Modal
            isOpen={isPointModalOpen}
            onClose={handleClose}
            maxWidth="5xl"
            zIndex={70}
        >
            <div className="flex flex-col lg:flex-row gap-6 max-h-[85vh]">
                {/* Left Column - Images + Mini Map */}
                <div className="lg:w-2/5 flex flex-col gap-4">
                    {/* Image Carousel */}
                    <div className="relative h-56 bg-gray-100 rounded-xl overflow-hidden group">
                        {imagens.length > 0 ? (
                            <>
                                <SafeImage
                                    src={api.getImageUrl(imagens[currentImageIndex])}
                                    alt={`Imagem ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                />

                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                                {/* Código OOH Badge */}
                                <div className="absolute top-3 left-3 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg">
                                    <p className="text-white font-bold text-sm">{selectedPonto.codigo_ooh}</p>
                                </div>

                                {/* Navigation Arrows */}
                                {imagens.length > 1 && (
                                    <>
                                        <button
                                            onClick={prevImage}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronLeft size={20} />
                                        </button>
                                        <button
                                            onClick={nextImage}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <ChevronRight size={20} />
                                        </button>

                                        {/* Dots */}
                                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                            {imagens.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentImageIndex(index)}
                                                    className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentImageIndex ? 'bg-white w-3' : 'bg-white/40 hover:bg-white/60'}`}
                                                />
                                            ))}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center">
                                    <MapPin size={40} className="text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-400 text-xs">Sem imagens</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mini Map */}
                    <div className="relative h-64 bg-gray-100 rounded-xl overflow-hidden group">
                        <div ref={mapRef} className="w-full h-full" />

                        {/* Overlay hint */}
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <p className="text-white text-xs font-medium">Clique para abrir no Google Maps</p>
                        </div>
                    </div>
                </div>

                {/* Right Column - Details */}
                <div className="lg:w-3/5 flex flex-col overflow-y-auto custom-scrollbar pr-2">
                    {/* Header with Navigation */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            {canNavigate && (
                                <>
                                    <Button
                                        onClick={handlePrevious}
                                        disabled={!hasPrevious}
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                    >
                                        <ChevronLeft size={16} />
                                    </Button>
                                    <span className="text-sm text-gray-500 font-medium">
                                        {currentIndex + 1} / {cartItems.length}
                                    </span>
                                    <Button
                                        onClick={handleNext}
                                        disabled={!hasNext}
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                    >
                                        <ChevronRight size={16} />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Point Information */}
                    <div className="space-y-4">
                        {/* Address with inline copy button */}
                        <div className="flex gap-3">
                            <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                <MapPin size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endereço</p>
                                    <button
                                        onClick={handleCopyAddress}
                                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                                        title="Copiar endereço"
                                    >
                                        <Copy size={14} className="text-gray-400 hover:text-gray-600" />
                                    </button>
                                </div>
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
                                </div>
                            </div>
                        )}

                        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                        {/* Grid Info */}
                        <div className="grid grid-cols-2 gap-4">
                            {selectedPonto.medidas && (
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-1.5 text-emidias-accent">
                                        <Ruler size={14} />
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Medidas</p>
                                    </div>
                                    <p className="text-gray-900 font-semibold text-sm pl-0.5">{selectedPonto.medidas}</p>
                                </div>
                            )}

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

                        {/* Values Section */}
                        {proposalItem ? (
                            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1 rounded-md bg-white border border-blue-200 shadow-sm text-blue-600">
                                        <DollarSign size={14} />
                                    </div>
                                    <h3 className="font-semibold text-blue-900 text-sm">
                                        Valores da Proposta
                                    </h3>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm py-1.5">
                                        <span className="text-gray-600">Locação (Bissemanal)</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(proposalItem.valor_locacao)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-1.5">
                                        <span className="text-gray-600">Papel</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(proposalItem.valor_papel)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm py-1.5">
                                        <span className="text-gray-600">Lona</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(proposalItem.valor_lona)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : produtos.length > 0 && (
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
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
                        {!readOnly && (
                            <Button
                                onClick={handleAddToCart}
                                disabled={isAddingToCart}
                                className={cn(
                                    "flex-1",
                                    isInCart
                                        ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                                        : "bg-green-500 hover:bg-green-600 text-white border-green-500"
                                )}
                                leftIcon={isAddingToCart ? <Loader2 size={16} className="animate-spin" /> : <ShoppingCart size={16} />}
                            >
                                {isAddingToCart ? 'Processando...' : isInCart ? 'Remover do Carrinho' : 'Adicionar ao Carrinho'}
                            </Button>
                        )}

                        {selectedPonto.latitude && selectedPonto.longitude && (
                            <Button
                                onClick={handleStreetView}
                                variant="outline"
                                leftIcon={<Eye size={16} />}
                            >
                                Street View
                            </Button>
                        )}

                        {isInCart && (
                            <Button
                                onClick={handleViewInProposal}
                                variant="outline"
                                size="sm"
                                leftIcon={<ExternalLink size={14} />}
                                className="text-xs"
                            >
                                Ver na Proposta
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
