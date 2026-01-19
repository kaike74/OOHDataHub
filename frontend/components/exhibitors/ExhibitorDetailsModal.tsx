import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Building2, Phone, Mail, MessageSquare, ExternalLink, Users, Edit2, TrendingUp, Edit } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { formatCurrency, cn } from '@/lib/utils';
import GoogleMap from '@/components/map/GoogleMap';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { useRouter } from 'next/navigation';

import { SafeImage } from '@/components/ui/SafeImage';

interface ExhibitorProposalStats {
    id: number;
    nome: string;
    points: number;
    pontos_count: number;
    status: string;
}

interface ExhibitorDetailsModalProps {
    exibidoras: any | null;
    isOpen: boolean;
    onClose: () => void;
    canEdit?: boolean;
}

export default function ExhibitorDetailsModal({ exibidoras, isOpen, onClose, canEdit = false }: ExhibitorDetailsModalProps) {
    const [proposals, setProposals] = useState<ExhibitorProposalStats[]>([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const [localContacts, setLocalContacts] = useState<any[]>([]);
    const setExibidoraModalOpen = useStore((state) => state.setExibidoraModalOpen);
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const setExibidoraFormMode = useStore((state) => state.setExibidoraFormMode);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && exibidoras?.id) {
            loadProposals(exibidoras.id);

            // If contacts are provided in prop, use them. Otherwise fetch.
            if (exibidoras.contatos && Array.isArray(exibidoras.contatos) && exibidoras.contatos.length > 0) {
                setLocalContacts(exibidoras.contatos);
            } else if (exibidoras.contatos && Array.isArray(exibidoras.contatos) && exibidoras.contatos.length === 0) {
                // Provided but empty (could be really empty, or just initialized empty)
                // We check if we should fetch. If the parent explicitly passed empty, maybe we shouldn't?
                // But for safety against "NA" issues, let's fetch if empty array. 
                // Wait, ExibidorasView passes empty array if no contacts. We don't want to double fetch.
                // But PointDetailsModal passes 'exhibitorContacts' which might be empty [] because of context.
                // It is safer to try fetching if empty.
                loadContacts(exibidoras.id);
            } else {
                // Not provided at all
                loadContacts(exibidoras.id);
            }
        } else {
            setProposals([]);
            setLocalContacts([]);
        }
    }, [isOpen, exibidoras]);

    const loadContacts = async (id: number) => {
        try {
            const data = await api.getContatos(id);
            setLocalContacts(data || []);
        } catch (error) {
            console.error("Failed to load contacts", error);
        }
    };

    const loadProposals = async (id: number) => {
        setIsLoadingProposals(true);
        try {
            const data = await api.getExhibitorProposals(id);
            setProposals(data);
        } catch (error) {
            console.error('Failed to load proposals', error);
            setProposals([]);
        } finally {
            setIsLoadingProposals(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            'rascunho': 'bg-gray-100 text-gray-700',
            'em_negociacao': 'bg-blue-50 text-blue-700',
            'aprovada': 'bg-green-50 text-green-700',
            'rejeitada': 'bg-red-50 text-red-700',
            'finalizada': 'bg-gray-800 text-white',
        };
        const colorClass = colors[status?.toLowerCase()] || colors['rascunho'];
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
                {status?.replace('_', ' ') || 'Rascunho'}
            </span>
        );
    };

    if (!exibidoras) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="6xl"
            className="p-0 overflow-hidden rounded-3xl"
            zIndex={2050} // Slightly higher than PointDetailsModal (2000)
            hideCloseButton={true}
        >
            <div className="flex flex-row h-[600px] bg-white overflow-hidden shadow-2xl rounded-3xl">
                {/* --- LEFT: VISUALS (40%) --- */}
                <div className="w-[40%] h-full flex flex-col bg-gray-50 border-r border-gray-100 relative">
                    {/* Map Section (50%) */}
                    <div className="h-[50%] w-full relative bg-gray-200">
                        <GoogleMap
                            readOnly={true}
                            showProposalActions={false}
                            forcedFilterExibidora={[exibidoras.id]}
                            enableStreetView={false}
                        // Pass custom style or simplify controls if needed
                        />
                        {/* Overlay Info */}
                        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10">
                            <h3 className="text-white font-bold text-shadow-sm flex items-center gap-2">
                                <MapPin size={16} />
                                Locais de Atuação
                            </h3>
                        </div>
                    </div>

                    {/* Points List Section (50%) */}
                    <div className="flex-1 bg-white flex flex-col min-h-0 border-t border-gray-100">
                        <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pontos Cadastrados</span>
                            <span className="bg-white border border-gray-200 px-2 py-0.5 rounded-md text-[10px] font-mono text-gray-600">
                                {exibidoras.pontos?.length || 0}
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            {exibidoras.pontos && exibidoras.pontos.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {exibidoras.pontos.map((p: any) => {
                                        const locacao = p.produtos?.find((prod: any) => prod.tipo === 'Locação');
                                        const valor = locacao?.valor;
                                        const periodo = locacao?.periodo || '';

                                        return (
                                            <div key={p.id} className="p-3 hover:bg-gray-50 transition-colors group">
                                                <div className="flex justify-between items-start gap-2 mb-1">
                                                    <p className="text-xs font-medium text-gray-700 line-clamp-2" title={`${p.endereco}, ${p.numero} - ${p.bairro}`}>
                                                        {p.endereco}, {p.numero} - {p.bairro}
                                                    </p>
                                                    <span className="text-xs font-bold text-emidias-primary whitespace-nowrap bg-emidias-primary/5 px-1.5 py-0.5 rounded">
                                                        {valor ? formatCurrency(valor) : '-'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                                        <MapPin size={10} />
                                                        {p.cidade}/{p.uf}
                                                    </div>
                                                    {periodo && <div className="text-[9px] text-gray-300 font-bold uppercase">{periodo}</div>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2 p-4">
                                    <MapPin size={24} className="opacity-20" />
                                    <p className="text-xs text-center">Nenhum ponto cadastrado.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT: DATA (60%) --- */}
                <div className="w-[60%] h-full flex flex-col bg-white relative">
                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-100 shrink-0 bg-white z-20 flex justify-between items-start">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center p-2 relative overflow-hidden group">
                                {exibidoras.logo_r2_key || exibidoras.logo_url ? (
                                    <SafeImage
                                        src={exibidoras.logo_r2_key ? api.getImageUrl(exibidoras.logo_r2_key) : exibidoras.logo_url}
                                        alt={exibidoras.nome}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-gray-300">{exibidoras.nome.charAt(0)}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 leading-tight">{exibidoras.nome}</h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-mono text-gray-500 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                        {exibidoras.cnpj || 'CNPJ não informado'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {canEdit && (
                                <button
                                    onClick={() => {
                                        setEditingExibidora(exibidoras);
                                        setExibidoraModalOpen(true);
                                    }}
                                    className="h-8 w-8 rounded-xl bg-gray-50 hover:bg-emidias-primary/10 hover:text-emidias-primary text-gray-500 flex items-center justify-center transition-all border border-gray-200"
                                    title="Editar Exibidora"
                                >
                                    <Edit size={16} />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="h-8 w-8 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-all border border-gray-200"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content Body - No Global Scroll */}
                    <div className="flex-1 p-6 flex flex-col min-h-0 overflow-hidden">
                        <div className="grid grid-cols-2 gap-4 shrink-0 mb-4">
                            {/* Stats Cards */}
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Regiões Atendidas</span>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-800 leading-relaxed" title={exibidoras.ufs?.join(', ')}>
                                        {exibidoras.ufs?.length > 0 ? exibidoras.ufs.join(', ') : 'N/A'}
                                    </p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cidades</span>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-800 leading-relaxed max-h-[40px] overflow-hidden text-ellipsis line-clamp-2" title={exibidoras.cidades?.join(', ')}>
                                        {exibidoras.cidades?.length > 0 ? exibidoras.cidades.join(', ') : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Contacts Card */}
                            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm col-span-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Users size={14} className="text-emidias-primary" />
                                        Contatos
                                    </h3>
                                    {canEdit && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] px-2"
                                            leftIcon={<Edit2 size={10} />}
                                            onClick={() => {
                                                setEditingExibidora(exibidoras);
                                                setExibidoraFormMode('contacts');
                                                setExibidoraModalOpen(true);
                                            }}
                                        >
                                            Gerenciar
                                        </Button>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {localContacts && localContacts.length > 0 ? (
                                        localContacts.slice(0, 4).map((contact: any, idx: number) => (
                                            <div key={idx} className="bg-gray-50/50 rounded-xl p-2.5 border border-gray-100/50 hover:border-emidias-primary/20 transition-colors group/contact">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-[11px] font-bold text-gray-700 truncate">{contact.nome}</span>
                                                        {contact.observacoes && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <MessageSquare size={10} className="text-yellow-500 fill-yellow-500/20" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="text-xs max-w-[200px]">
                                                                        {contact.observacoes}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="space-y-0.5">
                                                    {contact.telefone && (
                                                        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                                            <Phone size={9} /> {contact.telefone}
                                                        </div>
                                                    )}
                                                    {contact.email && (
                                                        <div className="flex items-center gap-1.5 text-[9px] text-gray-500 truncate" title={contact.email}>
                                                            <Mail size={9} /> {contact.email}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-xs text-gray-400 italic col-span-2 text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            Nenhum contato cadastrado
                                        </p>
                                    )}
                                    {localContacts.length > 4 && (
                                        <div className="col-span-2 flex justify-center sticky bottom-0 z-10">
                                            <span className="text-[9px] text-gray-400 font-medium">+ {localContacts.length - 4} contatos</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Proposals Card - Flexible & Scrollable */}
                        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0">
                            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-3 shrink-0">
                                <TrendingUp size={14} className="text-emidias-primary" />
                                Histórico de Propostas
                            </h3>

                            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative">
                                {isLoadingProposals ? (
                                    <div className="space-y-2 animate-pulse">
                                        <div className="h-10 bg-gray-50 rounded-lg" />
                                        <div className="h-10 bg-gray-50 rounded-lg" />
                                        <div className="h-10 bg-gray-50 rounded-lg" />
                                    </div>
                                ) : proposals.length > 0 ? (
                                    <div className="space-y-2">
                                        {proposals.map((prop, idx) => (
                                            <div
                                                key={prop.id}
                                                className="p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100 rounded-xl group"
                                                onClick={() => router.push(`/propostas?id=${prop.id}`)}
                                            >
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-bold text-gray-800 group-hover:text-emidias-primary transition-colors">{prop.nome}</span>
                                                    <StatusBadge status={prop.status} />
                                                </div>
                                                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded text-[10px] font-bold text-gray-500">
                                                    {prop.pontos_count || prop.points || 0} pts
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200 h-full flex flex-col items-center justify-center">
                                        <p className="text-gray-400 text-xs">Nenhuma proposta encontrada.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
