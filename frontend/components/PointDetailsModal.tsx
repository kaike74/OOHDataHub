'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, DollarSign, ChevronLeft, ChevronRight, Eye, ShoppingCart, Copy, ExternalLink, Loader2, Tag, Navigation, Phone, Mail, MessageSquare, Trash2, Edit, History, Search, Minimize2, Check, Expand, Share2, Download, Plus, Clock, User, TrendingUp, ChevronDown, ChevronUp, Crosshair, Edit2, Maximize2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';


import { useState, useEffect, useRef, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { toast } from 'sonner';
import { ExhibitorPopover } from '@/components/ui/ExhibitorPopover';
import AddressSearch from '@/components/AddressSearch';
import HistoryModal from '@/components/HistoryModal';
import CreateProposalModal from '@/components/CreateProposalModal';
import ExhibitorDetailsModal from '@/components/exhibitors/ExhibitorDetailsModal';
import ExibidoraModal from '@/components/ExibidoraModal';
import type { Contato, Proposta } from '@/lib/types';
import { getNextValidBiWeeklyStartDate, getSuggestedBiWeeklyEndDate, formatDateForInput, generateMonthlyPeriodId } from '@/lib/periodUtils';

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
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const setExibidoraFormMode = useStore((state) => state.setExibidoraFormMode);

    const setPontos = useStore((state) => state.setPontos); // For deletion update
    const pontos = useStore((state) => state.pontos); // For deletion update

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isAddingToCart, setIsAddingToCart] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    // New states for enhancements
    const [exhibitorContacts, setExhibitorContacts] = useState<Contato[]>([]);
    const [lastUpdate, setLastUpdate] = useState<{ date: string; user: string; action: string } | null>(null);
    const [isCreateProposalOpen, setIsCreateProposalOpen] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExhibitorModalOpen, setIsExhibitorModalOpen] = useState(false);
    const [selectedExhibitorForModal, setSelectedExhibitorForModal] = useState<any>(null);

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

    // For Map context: track which proposals contain this point
    const [pointProposals, setPointProposals] = useState<Proposta[]>([]);

    // Navigation logic differs by context
    const canNavigate = isInProposalContext
        ? (cartItems.length > 1 && pointModalIndex !== -1 && pointModalIndex !== undefined)
        : pontos.length > 1; // In Map, navigate through all filtered points

    const currentIndex = pointModalIndex;
    const hasPrevious = isInProposalContext
        ? currentIndex > 0
        : pontos.findIndex(p => p.id === selectedPonto?.id) > 0;
    const hasNext = isInProposalContext
        ? currentIndex < cartItems.length - 1
        : pontos.findIndex(p => p.id === selectedPonto?.id) < pontos.length - 1;

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

    // Fetch proposals containing this point (for Map context)
    useEffect(() => {
        if (!selectedPonto || isInProposalContext) {
            setPointProposals([]);
            return;
        }

        const fetchPointProposals = async () => {
            try {
                const allProposals = await api.getAdminProposals();
                const proposalsWithPoint = allProposals.filter((p: any) =>
                    p.itens?.some((item: any) => String(item.id_ooh) === String(selectedPonto.id))
                );
                setPointProposals(proposalsWithPoint);
            } catch (error) {
                console.error('Error fetching point proposals:', error);
            }
        };

        fetchPointProposals();
    }, [selectedPonto?.id, isInProposalContext]);

    // Fetch exhibitor contacts (Map context only)
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

    // Fetch last update from history (Map context only)
    useEffect(() => {
        if (!selectedPonto?.id || isInProposalContext) {
            setLastUpdate(null);
            return;
        }

        const fetchLastUpdate = async () => {
            try {
                const history = await api.getHistory('points', selectedPonto.id);
                if (history && history.length > 0) {
                    const latest = history[0];
                    setLastUpdate({
                        date: latest.created_at,
                        user: latest.user_name || 'Usuário Desconhecido',
                        action: latest.action
                    });
                }
            } catch (error) {
                console.error('Error fetching point history:', error);
            }
        };

        fetchLastUpdate();
    }, [selectedPonto?.id, isInProposalContext]);

    // Lightbox keyboard handlers (ESC to close, arrows to navigate)
    useEffect(() => {
        if (!isLightboxOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsLightboxOpen(false);
            } else if (e.key === 'ArrowLeft' && imagens.length > 1) {
                setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
            } else if (e.key === 'ArrowRight' && imagens.length > 1) {
                setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isLightboxOpen, imagens.length]);

    const handleClose = useCallback(() => {
        setPointModalOpen(false);
        setSelectedPonto(null);
    }, [setPointModalOpen, setSelectedPonto]);

    const handlePrevious = useCallback(() => {
        if (!hasPrevious) return;

        if (isInProposalContext) {
            // Proposals: Navigate through cart items
            const newIndex = currentIndex - 1;
            const item = cartItems[newIndex];
            const ponto = useStore.getState().pontos.find(p => p.id === item.id_ooh);
            if (ponto) {
                setSelectedPonto(ponto);
                setPointModalIndex(newIndex);
            }
        } else {
            // Map: Navigate through all filtered points
            const currentPontoIndex = pontos.findIndex(p => p.id === selectedPonto?.id);
            if (currentPontoIndex > 0) {
                setSelectedPonto(pontos[currentPontoIndex - 1]);
                setPointModalIndex(-1); // Reset index for map context
            }
        }
    }, [hasPrevious, isInProposalContext, currentIndex, cartItems, pontos, selectedPonto, setSelectedPonto, setPointModalIndex]);

    const handleNext = useCallback(() => {
        if (!hasNext) return;

        if (isInProposalContext) {
            // Proposals: Navigate through cart items
            const newIndex = currentIndex + 1;
            const item = cartItems[newIndex];
            const ponto = useStore.getState().pontos.find(p => p.id === item.id_ooh);
            if (ponto) {
                setSelectedPonto(ponto);
                setPointModalIndex(newIndex);
            }
        } else {
            // Map: Navigate through all filtered points
            const currentPontoIndex = pontos.findIndex(p => p.id === selectedPonto?.id);
            if (currentPontoIndex < pontos.length - 1) {
                setSelectedPonto(pontos[currentPontoIndex + 1]);
                setPointModalIndex(-1); // Reset index for map context
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

            // Calculate VALID default period (next full bi-week)
            const today = new Date();
            const nextStart = getNextValidBiWeeklyStartDate(today);
            const nextEnd = getSuggestedBiWeeklyEndDate(nextStart);

            const startStr = formatDateForInput(nextStart);
            const endStr = nextEnd ? formatDateForInput(nextEnd) : '';

            // Construct period ID for selection (start_end)
            const periodId = nextEnd ? generateMonthlyPeriodId(nextStart, nextEnd) : '';

            const item = {
                id_proposta: selectedProposta.id,
                id_ooh: selectedPonto.id,
                periodo_inicio: startStr,
                periodo_fim: endStr,
                valor_locacao: valorLocacao,
                valor_papel: valorPapel,
                valor_lona: valorLona,
                periodo_comercializado: 'bissemanal',
                observacoes: '',
                fluxo_diario: selectedPonto.fluxo || 0,
                selected_periods: periodId ? [periodId] : []
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

    // New handlers for enhancements
    const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedPonto) return;

        setIsUploadingImage(true);
        try {
            await api.uploadImage(file, String(selectedPonto.id), imagens.length);
            // Refresh point data
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

    const handleCreateProposal = useCallback(() => {
        setIsCreateProposalOpen(true);
    }, []);

    const handleSharePoint = useCallback(() => {
        if (!selectedPonto) return;
        const url = `${window.location.origin}/mapa?ponto=${selectedPonto.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link do ponto copiado!');
    }, [selectedPonto]);

    const handleExportPDF = useCallback(() => {
        toast.info('Exportação em PDF será implementada em breve');
    }, []);

    // Calculate CPM
    const calculateCPM = useCallback((valor: number, fluxo: number): number | null => {
        if (!fluxo || fluxo === 0) return null;
        return parseFloat(((valor / fluxo) * 1000).toFixed(2));
    }, []);

    if (!selectedPonto || !isPointModalOpen) return null;

    const proposalItem = selectedProposta?.itens?.find((i: any) => i.id_ooh === selectedPonto.id);
    const isInCart = !!proposalItem;
    const cartIds = selectedProposta?.itens?.map((i: any) => i.id_ooh) || [];

    return (
        <Modal
            isOpen={isPointModalOpen}
            onClose={handleClose}
            maxWidth="6xl"
            className="p-0 overflow-hidden rounded-3xl" // Visually consistent rounding
            zIndex={2000}
            hideCloseButton={true}
        >
            {/* --- REDESIGNED LAYOUT --- */}
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

                                {/* Header Overlay for Info */}
                                <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex justify-between items-start">
                                    {/* Left: OOH Code */}
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Código</span>
                                        <span className="text-lg font-black text-white tracking-widest uppercase leading-none shadow-black drop-shadow-md">{selectedPonto.codigo_ooh}</span>
                                    </div>

                                    {/* Right: Type Badge */}
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Tipo</span>
                                        <span className="text-sm font-bold text-white tracking-wide uppercase leading-none shadow-black drop-shadow-md">{selectedPonto.tipo}</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 flex-col gap-2">
                                <Building2 size={40} strokeWidth={1} />
                                <p className="text-sm">Sem imagem</p>
                            </div>
                        )}

                        {/* Bottom Overlay for Size & Zoom */}
                        {imagens.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 z-20 flex justify-between items-end bg-gradient-to-t from-black/80 to-transparent">
                                {/* Left: Size */}
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Tamanho</span>
                                    <span className="text-sm font-black text-white tracking-widest uppercase leading-none shadow-black drop-shadow-md">
                                        {selectedPonto.medidas || 'N/A'}
                                        {!(selectedPonto.medidas?.toLowerCase().includes('m') || selectedPonto.medidas?.toLowerCase().includes('px')) && (
                                            <span className="text-xs align-top opacity-70 ml-0.5">m</span>
                                        )}
                                    </span>
                                </div>

                                {/* Right: Zoom Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsLightboxOpen(true);
                                    }}
                                    className="h-8 w-8 rounded-lg bg-white/20 hover:bg-white/40 text-white backdrop-blur-md flex items-center justify-center transition-all border border-white/30 hover:border-white/50"
                                    title="Expandir Imagem"
                                >
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Thumbnails Row - ALWAYS SHOW when images exist */}
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

                            {/* Upload Button (Admin Only) */}
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

                    {/* Upload Button for no images (Admin Only) */}
                    {imagens.length === 0 && canEdit && (
                        <div className="h-16 bg-black/80 backdrop-blur-sm border-t border-white/10 px-2 py-1.5 flex items-center justify-center">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploadingImage}
                                className="h-12 px-4 bg-emidias-primary hover:bg-emidias-primary/90 text-white rounded-lg flex items-center gap-2 transition-all"
                            >
                                {isUploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                                Adicionar Imagem
                            </button>
                        </div>
                    )}

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

                    {/* Header - Address & Coordinates Focused */}
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
                                            <Tooltip delayDuration={300}>
                                                <TooltipTrigger asChild>
                                                    <span className="text-gray-300 italic truncate text-xs max-w-[200px] cursor-help border-b border-dotted border-gray-300 hover:border-gray-400 transition-colors">
                                                        • {selectedPonto.ponto_referencia}
                                                    </span>
                                                </TooltipTrigger>
                                                <TooltipContent className="max-w-[300px] text-xs bg-gray-900 text-white border-gray-800">
                                                    <p>{selectedPonto.ponto_referencia}</p>
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

                    {/* Content Body - Organized Grid 2x2 */}
                    <div className="flex-1 p-5 overflow-y-auto custom-scrollbar relative">
                        <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full">
                            {/* Card 1: Valores */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-full">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
                                        <DollarSign size={16} />
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Valores</h3>
                                        <p className="text-[9px] text-gray-400 tracking-tight leading-none font-bold">V1</p>
                                    </div>
                                </div>

                                {proposalItem ? (
                                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[9px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-tighter ring-1 ring-blue-200">ITEM DO PLANO</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[11px] text-gray-500 font-medium font-mono uppercase">Locação</span>
                                                <span className="text-base font-black text-gray-900">{formatCurrency(proposalItem.valor_locacao)}</span>
                                            </div>
                                            {proposalItem.valor_papel > 0 && (
                                                <div className="flex justify-between items-end pt-1.5 border-t border-blue-100">
                                                    <span className="text-[11px] text-gray-500 font-medium font-mono uppercase">Produção</span>
                                                    <span className="text-xs font-bold text-gray-700">{formatCurrency(proposalItem.valor_papel)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2 flex-1 flex flex-col justify-center">
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
                                )}
                            </div>

                            {/* Card 2: Performance */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-full">
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

                            {/* Card 3: Exibidora */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-full group overflow-hidden">
                                <div className="flex items-center gap-2 mb-2 shrink-0">
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Exibidora</h3>
                                        <button
                                            onClick={() => {
                                                const exhibitorData = exibidoras.find(e => e.id === selectedPonto.id_exibidora);
                                                if (exhibitorData) {
                                                    // Enrich data to match ExhibitorDetailsModal expectations
                                                    const pontosExibidora = pontos.filter((p) => p.id_exibidora === exhibitorData.id);
                                                    const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))];
                                                    const ufs = [...new Set(pontosExibidora.map((p) => p.uf).filter(Boolean))];

                                                    const enrichedExhibitor = {
                                                        ...exhibitorData,
                                                        totalPontos: pontosExibidora.length,
                                                        cidades: cidades,
                                                        ufs: ufs,
                                                        contatos: exhibitorContacts,
                                                        pontos: pontosExibidora
                                                    };

                                                    setSelectedExhibitorForModal(enrichedExhibitor);
                                                    setIsExhibitorModalOpen(true);
                                                }
                                            }}
                                            className="text-xs font-bold text-gray-900 leading-tight truncate hover:text-emidias-primary hover:underline transition-all text-left"
                                        >
                                            {selectedPonto.exibidora_nome}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
                                    {/* Contacts Section */}
                                    <div className="space-y-1.5">
                                        {exhibitorContacts.length > 0 ? (
                                            exhibitorContacts.slice(0, 1).map((contact, idx) => (
                                                <div key={idx} className="bg-gray-50/50 rounded-xl p-2 border border-gray-100/50 relative group/contact">
                                                    <div className="flex justify-between items-center mb-0.5">
                                                        <div className="flex items-center gap-1.5 min-w-0">
                                                            <span className="text-xs font-bold text-gray-700 truncate">{contact.nome || 'Contato'}</span>
                                                            {contact.observacoes && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <MessageSquare size={10} className="text-yellow-500 fill-yellow-500/20 shrink-0" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="text-xs">
                                                                            {contact.observacoes}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>

                                                    </div>
                                                    <div className="flex justify-between items-end">
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-mono text-gray-500 block truncate">{contact.telefone}</span>
                                                            <p className="text-[10px] text-gray-400 truncate">{contact.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[9px] text-gray-400 italic">Sem contatos diretos</p>
                                        )}

                                    </div>

                                </div>

                                {/* Footer Actions for Exhibitor Card */}
                                {canEdit && (
                                    <div className="pt-2 mt-auto border-t border-gray-50 shrink-0">
                                        <button
                                            onClick={() => {
                                                const exhibitorData = exibidoras.find(e => e.id === selectedPonto.id_exibidora);
                                                if (exhibitorData) {
                                                    const pontosExibidora = pontos.filter((p) => p.id_exibidora === exhibitorData.id);
                                                    const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))];
                                                    const ufs = [...new Set(pontosExibidora.map((p) => p.uf).filter(Boolean))];

                                                    const enrichedExhibitor = {
                                                        ...exhibitorData,
                                                        totalPontos: pontosExibidora.length,
                                                        cidades: cidades,
                                                        ufs: ufs,
                                                        contatos: exhibitorContacts,
                                                        pontos: pontosExibidora
                                                    };

                                                    setEditingExibidora(enrichedExhibitor); // Set for editing
                                                    setExibidoraFormMode('contacts'); // Only contacts
                                                    setIsExhibitorModalOpen(false); // Make sure details is closed or handled? Wait user wants details modal -> manage.
                                                    // Actually from PointDetails we usually open ExhibitorDetailsModal OR ExibidoraModal?
                                                    // User said "Button managed in contacts card of exhibitor details modal" AND "Button manage in exhibitor card of point details modal".
                                                    // So this button opens ExibidoraModal directly in contacts mode?
                                                    // Yes, user said "same as managing contacts in exhibitor details".
                                                    // So it should open the Form Modal.
                                                    useStore.getState().setExibidoraModalOpen(true);
                                                }
                                            }}
                                            className="w-full py-1.5 text-[10px] font-bold text-emidias-primary bg-emidias-primary/5 hover:bg-emidias-primary/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            <Edit2 size={10} />
                                            Gerenciar Contatos
                                        </button>
                                    </div>
                                )}

                                {/* Regions Section */}

                            </div>




                            {/* Card 4: Propostas */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex flex-col h-full">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2 mb-3 truncate leading-none">
                                    <ShoppingCart size={14} className="text-blue-500" />
                                    Propostas
                                    {pointProposals.length > 0 && <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded-full text-[9px] font-black">{pointProposals.length}</span>}
                                </h3>

                                <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2">
                                    {pointProposals.length > 0 ? (
                                        pointProposals.map((proposta) => (
                                            <div key={proposta.id} className="group bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl p-2 transition-all duration-200">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5 mb-0.5">
                                                            <div className={cn(
                                                                "w-1 h-1 rounded-full",
                                                                proposta.status === 'aprovado' ? "bg-green-500" :
                                                                    proposta.status === 'em validação' ? "bg-yellow-500" : "bg-gray-300"
                                                            )} />
                                                            <h4 className="font-black text-[9px] text-gray-900 truncate uppercase tracking-tight" title={proposta.nome}>{proposta.nome}</h4>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[8px] text-gray-500 font-medium">
                                                            {(() => {
                                                                const item = proposta.itens?.find(i => String(i.id_ooh) === String(selectedPonto.id));
                                                                if (item?.periodo_inicio) {
                                                                    return <span className="truncate italic">Até {new Date(item.periodo_fim!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>;
                                                                }
                                                                return <span className="italic">Ver Detalhes</span>;
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleClose();
                                                            window.location.href = `/propostas?id=${proposta.id}`;
                                                        }}
                                                        className="h-6 w-6 flex items-center justify-center text-gray-300 hover:text-emidias-primary transition-all shrink-0"
                                                        title="Acessar Proposta"
                                                    >
                                                        <ExternalLink size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="h-full border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-1 opacity-50">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase">Disponível</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions - Context Aware */}
                    <div className="p-3 border-t border-gray-100 bg-white z-20 shrink-0 flex items-center justify-between">

                        {/* Left Side: Navigation + Admin Actions */}
                        <div className="flex items-center gap-2">
                            {canNavigate && (
                                <div className="flex items-center bg-gray-50 rounded-lg p-1">
                                    <button onClick={handlePrevious} disabled={!hasPrevious} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-gray-600" title="Anterior">
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-[10px] font-medium text-gray-500 px-2">
                                        {isInProposalContext
                                            ? `${currentIndex + 1} / ${cartItems.length}`
                                            : `${pontos.findIndex(p => p.id === selectedPonto?.id) + 1} / ${pontos.length}`
                                        }
                                    </span>
                                    <button onClick={handleNext} disabled={!hasNext} className="p-1.5 hover:bg-white hover:shadow-sm rounded-md disabled:opacity-30 transition-all text-gray-600" title="Próximo">
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            )}


                        </div>

                        {/* Right Side: Context-Aware Actions */}
                        <div className="flex items-center gap-3">
                            {/* Admin & Share Actions (Moved from Left) */}
                            {!isInProposalContext && (
                                <div className="flex items-center gap-2 mr-2">
                                    {canEdit && (
                                        <button onClick={handleHistory} className="p-2 text-gray-400 hover:text-purple-600 bg-gray-50 hover:bg-purple-50 rounded-lg transition-all border border-gray-100" title="Histórico">
                                            <History size={16} />
                                        </button>
                                    )}

                                    <button onClick={handleSharePoint} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-all border border-gray-100" title="Compartilhar">
                                        <Share2 size={16} />
                                    </button>

                                    {canEdit && (
                                        <>
                                            <button onClick={handleEdit} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-lg transition-all border border-gray-100" title="Editar">
                                                <Edit size={16} />
                                            </button>
                                            {!isDeleting && (
                                                <button onClick={handleDelete} disabled={isDeleting} className="p-2 text-gray-400 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded-lg transition-all border border-gray-100" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Observações/Notas Button */}
                            {selectedPonto.observacoes && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 text-xs font-bold border-yellow-200 text-yellow-700 bg-yellow-50/50 hover:bg-yellow-50"
                                    leftIcon={<FileText size={14} />}
                                    onClick={() => alert(`Observações do Ponto:\n\n${selectedPonto.observacoes}`)}
                                >
                                    Ver Notas
                                </Button>
                            )}

                            {/* Ver na Lista - ONLY in Proposals Context */}
                            {isInProposalContext && isInCart && (
                                <Button onClick={handleViewInProposal} variant="outline" size="sm" className="h-9 px-3 text-xs border-gray-200 text-gray-600" leftIcon={<ExternalLink size={14} />}>
                                    Ver na Lista
                                </Button>
                            )}

                            {/* Add/Remove Cart - ONLY in Proposals Context */}
                            {isInProposalContext && !readOnly && (
                                <Button
                                    onClick={handleAddToCart}
                                    disabled={isAddingToCart}
                                    title={isInCart ? "Remover do Plano" : "Adicionar ao Plano"}
                                    className={cn("h-9 w-9 p-0 rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center",
                                        isInCart ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-500 hover:bg-green-600 text-white"
                                    )}
                                >
                                    {isAddingToCart ? <Loader2 size={16} className="animate-spin" /> : isInCart ? <Trash2 size={16} /> : <ShoppingCart size={16} />}
                                </Button>
                            )}
                        </div>
                    </div>

                </div>
            </div >

            {/* --- LIGHTBOX OVERLAY --- */}
            {
                isLightboxOpen && (
                    <div
                        className="fixed inset-0 z-[2100] bg-black/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        {/* Close Lightbox */}
                        <button
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-10"
                        >
                            <X size={32} />
                        </button>

                        {/* Main Image */}
                        <div
                            className="w-full h-full max-w-7xl max-h-[90vh] p-4 flex items-center justify-center relative"
                            onClick={(e) => e.stopPropagation()}
                        >
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
                )
            }

            <HistoryModal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                type="points"
                id={selectedPonto.id}
            />

            {/* Hidden File Input for Image Upload */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
            />

            {/* Create Proposal Modal */}
            {
                isCreateProposalOpen && (
                    <CreateProposalModal
                        isOpen={isCreateProposalOpen}
                        onClose={() => setIsCreateProposalOpen(false)}
                    />
                )
            }

            <ExhibitorDetailsModal
                isOpen={isExhibitorModalOpen}
                onClose={() => setIsExhibitorModalOpen(false)}
                exibidoras={selectedExhibitorForModal}
                canEdit={canEdit}
            />
            <ExibidoraModal zIndex={2200} />
        </Modal >
    );
}
