'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, DollarSign, ChevronLeft, ChevronRight, Eye, ShoppingCart, Copy, ExternalLink, Loader2, Tag, Navigation, Phone, Mail, MessageSquare, Trash2, Edit, History, Search, Minimize2, Check, Expand, Share2, Download, Plus, Clock, User, TrendingUp, ChevronDown, ChevronUp, Crosshair, ArrowLeft } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { toast } from 'sonner';
import { ExhibitorPopover } from '@/components/ui/ExhibitorPopover';
import AddressSearch from '@/components/AddressSearch';
import HistoryModal from '@/components/HistoryModal';
import CreateProposalModal from '@/components/CreateProposalModal';
import type { Contato, Proposta } from '@/lib/types';
import { getNextValidBiWeeklyStartDate, getSuggestedBiWeeklyEndDate, formatDateForInput, generateMonthlyPeriodId } from '@/lib/periodUtils';
import ExhibitorDetails from '@/components/exhibitors/ExhibitorDetails';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

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
    const setModalOpen = useStore((state) => state.setModalOpen); // Edit Point Modal
    const setExibidoraModalOpen = useStore((state) => state.setExibidoraModalOpen); // Edit Exhibitor Modal
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const setPontos = useStore((state) => state.setPontos); // For deletion update
    const pontos = useStore((state) => state.pontos); // For deletion update

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // View Mode: 'point' or 'exhibitor'
    const [viewMode, setViewMode] = useState<'point' | 'exhibitor'>('point');

    const [exhibitorContacts, setExhibitorContacts] = useState<Contato[]>([]);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markerRef = useRef<any>(null);

    const imagens = selectedPonto?.imagens || [];
    const produtos = selectedPonto?.produtos || [];

    // CONTEXT DETECTION: Are we in Proposals tab or Map tab?
    const isInProposalContext = !!selectedProposta;

    // Determine permissions
    const isInternal = !!user && (user.type === 'internal' || user.role === 'admin' || user.role === 'master');
    const canEdit = isInternal && !readOnly;

    // Get cart items for navigation
    const cartItems = selectedProposta?.itens || [];

    const canNavigate = isInProposalContext
        ? (cartItems.length > 1 && pointModalIndex !== -1 && pointModalIndex !== undefined)
        : pontos.length > 1;

    const currentIndex = pointModalIndex;
    const hasPrevious = isInProposalContext
        ? currentIndex > 0
        : pontos.findIndex(p => p.id === selectedPonto?.id) > 0;
    const hasNext = isInProposalContext
        ? currentIndex < cartItems.length - 1
        : pontos.findIndex(p => p.id === selectedPonto?.id) < pontos.length - 1;

    // Reset view mode when opening new point
    useEffect(() => {
        if (isPointModalOpen) {
            setViewMode('point');
        }
    }, [isPointModalOpen, selectedPonto?.id]);

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
        }, 300);

        return () => {
            clearTimeout(timer);
            if (markerRef.current) markerRef.current.map = null;
            googleMapRef.current = null;
        };
    }, [isPointModalOpen, selectedPonto]);

    // Fetch exhibitor contacts
    useEffect(() => {
        if (!selectedPonto?.id_exibidora || isInProposalContext) {
            setExhibitorContacts([]);
            return;
        }

        const fetchContacts = async () => {
            try {
                const contacts = await api.getContatos(selectedPonto.id_exibidora!);
                setExhibitorContacts(contacts || []);
            } catch (error) {
                console.error('Error fetching exhibitor contacts:', error);
            }
        };

        fetchContacts();
    }, [selectedPonto?.id_exibidora, isInProposalContext]);

    const handleClose = useCallback(() => {
        setPointModalOpen(false);
        setSelectedPonto(null);
    }, [setPointModalOpen, setSelectedPonto]);

    const handlePrevious = useCallback(() => {
        if (!hasPrevious) return;
        setViewMode('point'); // Reset to point view on nav

        if (isInProposalContext) {
            const newIndex = currentIndex - 1;
            const item = cartItems[newIndex];
            const ponto = useStore.getState().pontos.find(p => p.id === item.id_ooh);
            if (ponto) {
                setSelectedPonto(ponto);
                setPointModalIndex(newIndex);
            }
        } else {
            const currentPontoIndex = pontos.findIndex(p => p.id === selectedPonto?.id);
            if (currentPontoIndex > 0) {
                setSelectedPonto(pontos[currentPontoIndex - 1]);
                setPointModalIndex(-1);
            }
        }
    }, [hasPrevious, isInProposalContext, currentIndex, cartItems, pontos, selectedPonto, setSelectedPonto, setPointModalIndex]);

    const handleNext = useCallback(() => {
        if (!hasNext) return;
        setViewMode('point'); // Reset to point view on nav

        if (isInProposalContext) {
            const newIndex = currentIndex + 1;
            const item = cartItems[newIndex];
            const ponto = useStore.getState().pontos.find(p => p.id === item.id_ooh);
            if (ponto) {
                setSelectedPonto(ponto);
                setPointModalIndex(newIndex);
            }
        } else {
            const currentPontoIndex = pontos.findIndex(p => p.id === selectedPonto?.id);
            if (currentPontoIndex < pontos.length - 1) {
                setSelectedPonto(pontos[currentPontoIndex + 1]);
                setPointModalIndex(-1);
            }
        }
    }, [hasNext, isInProposalContext, currentIndex, cartItems, pontos, selectedPonto, setSelectedPonto, setPointModalIndex]);

    const handleCopyAddress = useCallback(() => {
        if (selectedPonto) {
            const fullAddress = `${selectedPonto.endereco}, ${selectedPonto.cidade} - ${selectedPonto.uf}`;
            navigator.clipboard.writeText(fullAddress);
            toast.success('Endereço copiado!');
        }
    }, [selectedPonto]);

    const handleEdit = useCallback(() => {
        if (!selectedPonto) return;
        setEditingPonto(selectedPonto);
        setPointModalOpen(false); // Close details
        setModalOpen(true); // Open edit modal
    }, [selectedPonto, setEditingPonto, setPointModalOpen, setModalOpen]);

    // Image Upload
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPonto) return;

        setIsUploadingImage(true);
        try {
            await api.uploadImage(file, String(selectedPonto.id), imagens.length);
            const updatedPonto = await api.getPonto(selectedPonto.id);
            setSelectedPonto(updatedPonto);
            toast.success('Imagem adicionada com sucesso!');
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Erro ao fazer upload da imagem');
        } finally {
            setIsUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    }, [selectedPonto, imagens.length, setSelectedPonto]);

    const handleStreetView = useCallback(() => {
        if (selectedPonto?.latitude && selectedPonto?.longitude) {
            setStreetViewRequest({ lat: selectedPonto.latitude, lng: selectedPonto.longitude });
        }
    }, [selectedPonto, setStreetViewRequest]);

    // --- Exhibitor Actions ---
    const handleOpenExhibitorDetails = () => {
        setViewMode('exhibitor');
    };

    const handleAddContact = () => {
        // Since we don't have a standalone 'Add Contact' modal, we check permissions and maybe suggest editing the exhibitor
        // For now, let's open the Exhibitor Edit Modal which has contact management
        const exhibitor = exibidoras.find(e => e.id === selectedPonto?.id_exibidora);
        if (exhibitor) {
            setEditingExibidora(exhibitor);
            setExibidoraModalOpen(true);
        }
    };

    // Calculate CPM
    const calculateCPM = useCallback((valor: number, fluxo: number): number | null => {
        if (!fluxo || fluxo === 0) return null;
        return parseFloat(((valor / fluxo) * 1000).toFixed(2));
    }, []);

    if (!selectedPonto || !isPointModalOpen) return null;

    const proposalItem = selectedProposta?.itens?.find((i: any) => i.id_ooh === selectedPonto.id);
    const exhibitorData = exibidoras.find(e => e.id === selectedPonto.id_exibidora);

    return (
        <Modal
            isOpen={isPointModalOpen}
            onClose={handleClose}
            maxWidth="6xl"
            className="p-0 overflow-hidden"
            zIndex={2000}
            hideCloseButton={true}
            contentPadding={false}
        >
            <div className="flex flex-row h-[600px] bg-white overflow-hidden shadow-2xl rounded-3xl">

                {/* --- LEFT: VISUALS (40%) --- */}
                <div className="w-[40%] h-full flex flex-col bg-black relative border-r border-gray-100/10">

                    {/* Image Section (50%) */}
                    <div className="h-[50%] w-full relative overflow-hidden bg-gray-900 group/image">
                        {imagens.length > 0 ? (
                            <>
                                <SafeImage
                                    src={api.getImageUrl(imagens[currentImageIndex])}
                                    alt="Visualização do Ponto"
                                    className="w-full h-full object-cover opacity-95 hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />

                                {/* Glass Badges with Black Blur */}
                                <div className="absolute top-4 inset-x-4 flex justify-between items-start z-20">
                                    {/* Left: OOH Code */}
                                    <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md shadow-lg">
                                        <span className="text-xs font-black text-white tracking-widest uppercase">{selectedPonto.codigo_ooh}</span>
                                    </div>

                                    {/* Right: Type Badge */}
                                    <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md shadow-lg">
                                        <span className="text-[10px] font-bold text-white tracking-wide uppercase">{selectedPonto.tipo}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                                <Building2 size={40} strokeWidth={1} />
                                <p className="text-sm">Sem imagem</p>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails Row */}
                    {imagens.length > 0 && (
                        <div className="h-16 bg-black/80 backdrop-blur-sm border-t border-white/10 px-2 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/20">
                            {imagens.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentImageIndex(idx)}
                                    className={cn(
                                        "h-12 w-16 rounded overflow-hidden flex-shrink-0 border-2 transition-all",
                                        idx === currentImageIndex ? "border-white scale-105" : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <SafeImage
                                        src={api.getImageUrl(img)}
                                        alt={`Thumbnail ${idx + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                            {canEdit && (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploadingImage}
                                    className="h-12 w-16 rounded border-2 border-dashed border-white/30 hover:border-white/60 flex items-center justify-center text-white/60 hover:text-white transition-all flex-shrink-0 bg-white/5"
                                    title="Adicionar Imagem"
                                >
                                    {isUploadingImage ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                                </button>
                            )}
                        </div>
                    )}

                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />

                    {/* Map Section (50%) */}
                    <div className="h-[50%] w-full relative bg-gray-100 border-t border-white/10">
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

                    {viewMode === 'point' ? (
                        <>
                            {/* Header */}
                            <div className="px-5 py-5 border-b border-gray-100 shrink-0 bg-white z-20">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <h1 className="text-lg font-bold text-gray-900 tracking-tight leading-tight mb-1 truncate group flex items-center gap-2">
                                            <MapPin size={18} className="text-emidias-primary" />
                                            {selectedPonto.endereco}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <p className="text-sm text-gray-500 font-semibold">
                                                {selectedPonto.cidade} - {selectedPonto.uf}
                                            </p>

                                            {selectedPonto.ponto_referencia && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="text-gray-300 italic truncate text-xs max-w-[200px] cursor-help">• {selectedPonto.ponto_referencia}</span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="max-w-xs">{selectedPonto.ponto_referencia}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}

                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-50 rounded-lg border border-gray-100 text-[10px] font-mono text-gray-400">
                                                <Crosshair size={10} />
                                                {selectedPonto.latitude?.toFixed(6)}, {selectedPonto.longitude?.toFixed(6)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={handleCopyAddress} className="p-2 text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100" title="Copiar Endereço">
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            className="h-9 w-9 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all border border-gray-200"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Card 1: Valores */}
                                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-full min-h-[160px]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                                <DollarSign size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Valores</h3>
                                                <p className="text-[9px] text-gray-400 tracking-tight leading-none font-bold">V1</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2 flex-1 flex flex-col justify-center">
                                            {/* Medidas Field - New */}
                                            {selectedPonto.medidas && (
                                                <div className="mb-2 pb-2 border-b border-gray-50">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter flex items-center gap-1">
                                                            <Ruler size={10} /> Medidas
                                                        </span>
                                                        <span className="font-mono text-xs font-bold text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded">
                                                            {selectedPonto.medidas}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            {produtos.length > 0 ? (
                                                produtos.length === 1 ? (
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">{produtos[0].tipo}</p>
                                                        <p className="text-2xl font-black text-gray-900 tracking-tighter leading-none">
                                                            {formatCurrency(user?.type === 'external' ? produtos[0].valor * 2 : produtos[0].valor)}
                                                        </p>
                                                        {produtos[0].periodo && <p className="text-[9px] text-gray-400 uppercase font-medium">{produtos[0].periodo}</p>}
                                                    </div>
                                                ) : (
                                                    produtos.slice(0, 3).map((produto, idx) => {
                                                        const displayValue = user?.type === 'external' ? produto.valor * 2 : produto.valor;
                                                        return (
                                                            <div key={idx} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0 last:pb-0">
                                                                <div className="flex flex-col">
                                                                    <span className="font-bold text-gray-700 text-[10px] uppercase tracking-tighter">{produto.tipo}</span>
                                                                    {produto.periodo && <span className="text-[9px] text-gray-400 uppercase font-medium">{produto.periodo}</span>}
                                                                </div>
                                                                <span className="font-black text-gray-900 text-xs">{formatCurrency(displayValue)}</span>
                                                            </div>
                                                        );
                                                    })
                                                )
                                            ) : (
                                                <p className="text-xs text-gray-400 italic text-center py-4">Consulte o comercial</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Card 2: Performance */}
                                    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-full min-h-[160px]">
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-4">
                                            <TrendingUp size={14} className="text-emidias-primary" />
                                            Performance
                                        </h3>

                                        <div className="space-y-4 flex-1 justify-center flex flex-col">
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Impacto Diário</p>
                                                <p className="text-2xl font-black text-gray-900 tracking-tighter leading-none">
                                                    {selectedPonto.fluxo ? parseInt(selectedPonto.fluxo as any).toLocaleString() : 'N/A'}
                                                    <span className="text-xs font-medium text-gray-400 ml-1">pessoas</span>
                                                </p>
                                            </div>
                                            <div className="space-y-0.5">
                                                <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">CPM Estimado</p>
                                                <div className="flex items-baseline gap-1">
                                                    <p className="text-2xl font-black text-emidias-primary tracking-tighter leading-none">
                                                        {(() => {
                                                            const locacaoProd = produtos.find(p => p.tipo.toLowerCase().includes('locação') || p.tipo.toLowerCase().includes('locacao') || p.tipo.toLowerCase().includes('bissemanal') || p.tipo.toLowerCase().includes('mensal'));
                                                            const valor = locacaoProd ? (user?.type === 'external' ? locacaoProd.valor * 2 : locacaoProd.valor) : 0;
                                                            const cpm = calculateCPM(valor, Number(selectedPonto.fluxo));
                                                            return cpm ? formatCurrency(cpm) : 'N/A';
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Card 3: Exibidora (Full Width or not?) - Keeping grid layout for consistency */}
                                    <div className="col-span-2 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col min-h-[180px] group overflow-hidden relative">

                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                                    <Building2 size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Exibidora</h3>
                                                    <button
                                                        onClick={handleOpenExhibitorDetails}
                                                        className="text-lg font-bold text-gray-900 leading-tight truncate hover:text-emidias-primary hover:underline decoration-2 underline-offset-2 transition-all text-left"
                                                    >
                                                        {selectedPonto.exibidora_nome}
                                                    </button>
                                                </div>
                                            </div>

                                        </div>

                                        <div className="flex-1 space-y-3">
                                            {/* Contacts Section */}
                                            <div className="space-y-1.5 relative px-1">
                                                {exhibitorContacts.length > 0 ? (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {exhibitorContacts.slice(0, 4).map((contact, idx) => (
                                                            <div key={idx} className="bg-gray-50/50 rounded-lg p-2 border border-gray-100/50 hover:bg-white hover:shadow-sm hover:border-gray-200 transition-all group/contact relative">
                                                                <div className="flex justify-between items-start mb-0.5">
                                                                    <span className="text-[10px] font-bold text-gray-700 truncate max-w-[80%]">{contact.nome || 'Contato'}</span>
                                                                    <div className="flex gap-1">
                                                                        {contact.observacoes && (
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger>
                                                                                        <MessageSquare size={10} className="text-emidias-accent cursor-help" />
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p className="text-xs">{contact.observacoes}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>
                                                                        )}
                                                                        <button
                                                                            onClick={() => {
                                                                                setEditingExibidora(exhibitorData || null);
                                                                                setExibidoraModalOpen(true);
                                                                            }}
                                                                            className="text-gray-300 hover:text-emidias-primary opacity-0 group-hover/contact:opacity-100 transition-opacity" title="Editar Contato"
                                                                        >
                                                                            <Edit size={10} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="text-[9px] font-mono text-gray-500">{contact.telefone}</span>
                                                                    <span className="text-[9px] text-gray-400 truncate">{contact.email}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <p className="text-[9px] text-gray-400 italic py-2">Sem contatos cadastrados</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Button: Add Contact (Bottom Right) */}
                                        <div className="absolute bottom-4 right-4">
                                            <Button
                                                onClick={handleAddContact}
                                                size="sm"
                                                className="h-8 px-3 rounded-lg text-[10px] uppercase font-bold bg-gray-50 text-gray-600 hover:text-emidias-primary border border-gray-200 hover:border-emidias-primary/30"
                                                leftIcon={<Plus size={12} />}
                                            >
                                                Novo Contato
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Pagination Controls */}
                            {canNavigate && (
                                <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                                    <span className="text-xs font-semibold text-gray-400">
                                        {isInProposalContext
                                            ? `${pointModalIndex + 1} de ${cartItems.length}`
                                            : `${pontos.findIndex(p => p.id === selectedPonto.id) + 1} de ${pontos.length}`
                                        }
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handlePrevious}
                                            disabled={!hasPrevious}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full"
                                        >
                                            <ChevronLeft size={16} />
                                        </Button>
                                        <Button
                                            onClick={handleNext}
                                            disabled={!hasNext}
                                            variant="outline"
                                            size="sm"
                                            className="h-8 w-8 p-0 rounded-full"
                                        >
                                            <ChevronRight size={16} />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        // --- INLINE EXHIBITOR VIEW ---
                        <div className="flex flex-col h-full animate-in slide-in-from-right duration-300">
                            {/* Back Header */}
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setViewMode('point')}
                                    leftIcon={<ArrowLeft size={16} />}
                                    className="text-gray-600 hover:text-gray-900"
                                >
                                    Voltar para o Ponto
                                </Button>
                                <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                                    Detalhes da Exibidora
                                </div>
                            </div>

                            {/* Exhibitor Details Component */}
                            <div className="flex-1 overflow-hidden">
                                {exhibitorData ? (
                                    <ExhibitorDetails
                                        exhibitor={exhibitorData}
                                        onEdit={() => {
                                            setEditingExibidora(exhibitorData);
                                            setExibidoraModalOpen(true);
                                        }}
                                        className="h-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        Exibidora não encontrada
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </Modal>
    );
}
