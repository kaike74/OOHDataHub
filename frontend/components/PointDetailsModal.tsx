'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, Calendar, DollarSign, ChevronLeft, ChevronRight, MessageSquare, Plus, Edit2, Phone, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useEffect, useState, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import GoogleMap from '@/components/map/GoogleMap';

export default function PointDetailsModal({ readOnly = false }: { readOnly?: boolean }) {
    const {
        selectedPonto,
        setSelectedPonto,
        exibidoras,
        isAuthenticated,
        user
    } = useStore();

    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [viewMode, setViewMode] = useState<'details' | 'exhibitor'>('details');
    // Exhibitor Details State
    const [exhibitorProposals, setExhibitorProposals] = useState<any[]>([]);
    const [isLoadingExhibitorData, setIsLoadingExhibitorData] = useState(false);

    const imagens = selectedPonto?.imagens || [];
    const hasImages = imagens.length > 0;
    const currentImageUrl = hasImages ? api.getImageUrl(imagens[currentImageIndex]) : null;

    useEffect(() => {
        if (selectedPonto) {
            setViewMode('details');
            setCurrentImageIndex(0);
        }
    }, [selectedPonto]);

    useEffect(() => {
        if (viewMode === 'exhibitor' && selectedPonto?.id_exibidora) {
            loadExhibitorData(selectedPonto.id_exibidora);
        }
    }, [viewMode, selectedPonto]);

    const loadExhibitorData = async (exibidoraId: number) => {
        setIsLoadingExhibitorData(true);
        try {
            const proposals = await api.getExhibitorProposals(exibidoraId);
            setExhibitorProposals(proposals);
        } catch (error) {
            console.error('Erro ao carregar dados da exibidora:', error);
        } finally {
            setIsLoadingExhibitorData(false);
        }
    };

    if (!selectedPonto) return null;

    const handleClose = () => {
        setSelectedPonto(null);
        setViewMode('details');
    };

    const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);

    const exibidora = exibidoras.find(e => e.id === selectedPonto.id_exibidora) as any;

    // Helper to render badges
    const renderBadge = (text: string, icon?: React.ReactNode) => (
        <div className="bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
            {icon}
            {text}
        </div>
    );

    // Helper for Tooltip
    const SimpleTooltip = ({ children, content }: { children: React.ReactNode, content: string | React.ReactNode }) => (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{content}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );

    // Inline Exhibitor Details View
    const renderExhibitorView = () => {
        if (!exibidora) return null;

        return (
            <div className="p-6 space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                    <Button variant="ghost" size="sm" onClick={() => setViewMode('details')} leftIcon={<ChevronLeft size={16} />}>
                        Voltar
                    </Button>
                    <h3 className="text-lg font-bold text-gray-900">Detalhes da Exibidora</h3>
                </div>

                {/* Exibidora Header */}
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-3 p-2">
                        {exibidora.logo_url ? (
                            <img src={exibidora.logo_url} alt={exibidora.nome} className="w-full h-full object-contain" />
                        ) : (
                            <span className="text-2xl font-bold text-gray-300">{exibidora.nome.charAt(0)}</span>
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">{exibidora.nome}</h2>
                    <div className="flex gap-2 mt-2">
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                            {exibidora.totalPontos || 0} Pontos
                        </span>
                        <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                            {exibidora.cidades?.length || 0} Cidades
                        </span>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">CNPJ</span>
                        <p className="font-mono text-sm text-gray-800 mt-1">{exibidora.cnpj || '-'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Regiões</span>
                        <SimpleTooltip content={exibidora.ufs?.join(', ') || ''}>
                            <p className="text-sm text-gray-800 mt-1 line-clamp-1 cursor-help">{exibidora.ufs?.join(', ') || '-'}</p>
                        </SimpleTooltip>
                    </div>
                </div>

                {/* Proposals History */}
                <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-3 text-sm">
                        <ExternalLink size={14} className="text-emidias-accent" />
                        Histórico Recente
                    </h4>
                    {isLoadingExhibitorData ? (
                        <div className="space-y-2">
                            <div className="h-8 bg-gray-100 rounded animate-pulse" />
                            <div className="h-8 bg-gray-100 rounded animate-pulse" />
                        </div>
                    ) : exhibitorProposals.length > 0 ? (
                        <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {exhibitorProposals.slice(0, 3).map((prop) => (
                                <div key={prop.id} className="p-3 flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-700">{prop.nome}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${prop.status === 'aprovada' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {prop.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Nenhuma proposta recente.</p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <Modal
            isOpen={!!selectedPonto}
            onClose={handleClose}
            maxWidth="4xl"
            hideCloseButton
            noPadding
            className="overflow-hidden"
        >
            <div className="absolute top-4 right-4 z-50">
                <button
                    onClick={handleClose}
                    className="p-2 bg-white/80 hover:bg-white rounded-full text-gray-500 shadow-sm backdrop-blur-sm transition-colors"
                >
                    <X size={20} />
                </button>
            </div>

            {viewMode === 'exhibitor' ? (
                renderExhibitorView()
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[500px] p-6">
                    {/* Left Column: Image & Details */}
                    <div className="flex flex-col gap-6">
                        {/* Image Card - Rounded as requested */}
                        <div className="relative aspect-video w-full bg-gray-100 rounded-2xl overflow-hidden shadow-sm group">
                            {hasImages ? (
                                <>
                                    <img
                                        src={currentImageUrl!}
                                        alt={selectedPonto.codigo_ooh}
                                        className="w-full h-full object-cover"
                                    />
                                    {imagens.length > 1 && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); prevImage(); }} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100">
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); nextImage(); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-sm transition-colors opacity-0 group-hover:opacity-100">
                                                <ChevronRight size={16} />
                                            </button>
                                        </>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center flex-col text-gray-300 gap-2">
                                    <Building2 size={32} />
                                    <span className="text-xs font-medium">Sem imagem</span>
                                </div>
                            )}

                            {/* Floating Header Badges - "Blur preto sombra" */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                                {renderBadge(selectedPonto.codigo_ooh)}
                                {selectedPonto.tipo && renderBadge(selectedPonto.tipo.split(',')[0], <Ruler size={10} />)}
                            </div>

                            {/* Pagination Badge */}
                            {hasImages && (
                                <div className="absolute bottom-4 right-4 bg-black/40 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                                    {currentImageIndex + 1} / {imagens.length}
                                </div>
                            )}
                        </div>

                        {/* Map Preview (Small) & Address */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900 leading-tight mb-1">
                                    {selectedPonto.endereco}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    {selectedPonto.cidade} - {selectedPonto.uf}, {selectedPonto.pais}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400 font-mono">
                                    <span>{selectedPonto.latitude?.toFixed(6)}, {selectedPonto.longitude?.toFixed(6)}</span>
                                </div>
                            </div>

                            {selectedPonto.ponto_referencia && (
                                <div className="text-xs text-gray-500 border-t border-gray-100 pt-3">
                                    <SimpleTooltip content={selectedPonto.ponto_referencia}>
                                        <p className="line-clamp-2 cursor-help">
                                            <span className="font-semibold text-gray-700">Ref:</span> {selectedPonto.ponto_referencia}
                                        </p>
                                    </SimpleTooltip>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Stats & Cards */}
                    <div className="flex flex-col gap-4">

                        {/* 1. Valores Card */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <DollarSign size={14} className="text-green-500" /> Valores
                            </h3>
                            <div className="space-y-3">
                                {selectedPonto.produtos?.map((prod, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm">
                                        <div>
                                            <span className="font-semibold text-gray-700 block text-xs uppercase">{prod.tipo}</span>
                                            {prod.periodo && <span className="text-[10px] text-gray-400 uppercase">{prod.periodo}</span>}
                                        </div>
                                        <span className="font-bold text-gray-900">{formatCurrency(prod.valor)}</span>
                                    </div>
                                ))}
                                {(!selectedPonto.produtos || selectedPonto.produtos.length === 0) && (
                                    <p className="text-sm text-gray-400 italic">Sob consulta</p>
                                )}
                            </div>
                        </div>

                        {/* 2. Performance Card + Medidas */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Users size={14} className="text-blue-500" /> Performance
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Impacto Diário</span>
                                    <span className="text-2xl font-bold text-gray-900">
                                        {selectedPonto.fluxo ? new Intl.NumberFormat('pt-BR', { notation: 'standard' }).format(selectedPonto.fluxo) : '-'}
                                    </span>
                                    <span className="text-[10px] text-gray-400 ml-1">pessoas</span>
                                </div>

                                {/* Medidas - New Field Placement */}
                                <div>
                                    <span className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Medidas</span>
                                    <div className="flex items-center gap-1.5">
                                        <Ruler size={16} className="text-gray-300" />
                                        <span className="text-xl font-bold text-gray-900">
                                            {selectedPonto.medidas || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Exibidora Card */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Building2 size={14} className="text-purple-500" /> Exibidora
                            </h3>

                            {exibidora ? (
                                <div className="relative">
                                    {/* Link para Inline Details */}
                                    <div
                                        onClick={() => setViewMode('exhibitor')}
                                        className="font-bold text-gray-900 hover:text-emidias-primary cursor-pointer transition-colors flex items-center gap-2 mb-3"
                                    >
                                        {exibidora.nome}
                                        <ChevronRight size={14} className="text-gray-300" />
                                    </div>

                                    {/* Contatos */}
                                    <div className="space-y-3 mb-4">
                                        {exibidora.contatos?.slice(0, 2).map((c: any, idx: number) => (
                                            <div key={idx} className="flex items-start justify-between text-xs group/contact">
                                                <div>
                                                    <span className="font-medium text-gray-700 block">{c.nome}</span>
                                                    <span className="text-gray-400">{c.email}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-gray-400">{c.telefone}</span>

                                                    {/* Edit Button */}
                                                    <button className="p-1 text-gray-300 hover:text-emidias-primary opacity-0 group-hover/contact:opacity-100 transition-opacity">
                                                        <Edit2 size={12} />
                                                    </button>

                                                    {/* Comments Tooltip */}
                                                    {c.observacoes && (
                                                        <SimpleTooltip content={c.observacoes}>
                                                            <MessageSquare size={12} className="text-gray-300 hover:text-emidias-accent cursor-help" />
                                                        </SimpleTooltip>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Action Button: Cadastrar Contato (Replacement for Filter) */}
                                    <div className="flex justify-end pt-2 border-t border-gray-50">
                                        <Button variant="ghost" size="sm" className="h-8 text-[10px] text-emidias-primary hover:bg-purple-50 uppercase tracking-wide font-bold" leftIcon={<Plus size={12} />}>
                                            Cadastrar Contato
                                        </Button>
                                    </div>

                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Dados não disponíveis</p>
                            )}
                        </div>

                        {/* 4. Propostas Card (Placeholder/Readonly) */}
                        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm border-dashed">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FileText size={14} className="text-gray-400" /> Propostas
                            </h3>
                            <div className="h-20 flex items-center justify-center text-xs text-gray-300 font-medium">
                                Disponível para propostas
                            </div>
                        </div>

                    </div>
                </div>
            )}
        </Modal>
    );
}
