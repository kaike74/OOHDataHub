'use client';

import { useEffect, useState } from 'react';
import { Building2, FileText, MapPin, User, ArrowRight, Plus, Edit, Trash2 } from 'lucide-react';
import { Cliente, Proposta } from '@/lib/types';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UnifiedSplitModal } from '@/components/ui/UnifiedSplitModal';

interface ExtendedProposta extends Proposta {
    creator_email?: string;
    total_valor?: number;
}

interface ClientDetailModalProps {
    client: Cliente | null;
    onClose: () => void;
    isOpen: boolean;
}

const StatusBadge = ({ status }: { status: string }) => {
    const colors: any = {
        'rascunho': 'bg-gray-100 text-gray-700',
        'em_negociacao': 'bg-blue-50 text-blue-700 border-blue-100',
        'aprovada': 'bg-green-50 text-green-700 border-green-100',
        'rejeitada': 'bg-red-50 text-red-700 border-red-100',
        'finalizada': 'bg-gray-800 text-white',
    };
    const colorClass = colors[status?.toLowerCase()] || colors['rascunho'];

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${colorClass.includes('border') ? '' : 'border-transparent'} ${colorClass}`}>
            {status?.replace('_', ' ') || 'Rascunho'}
        </span>
    );
};

export default function ClientDetailModal({ client, onClose, isOpen }: ClientDetailModalProps) {
    const [proposals, setProposals] = useState<ExtendedProposta[]>([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && client) {
            loadProposals(client.id);
        } else {
            setProposals([]);
        }
    }, [isOpen, client]);

    const loadProposals = async (clientId: number) => {
        setIsLoadingProposals(true);
        try {
            const data = await api.getClientProposals(clientId);
            setProposals(data as ExtendedProposta[]);
        } catch (error) {
            console.error('Error loading client proposals:', error);
        } finally {
            setIsLoadingProposals(false);
        }
    };

    const getRegions = () => {
        if (!client?.regioes_atuacao) return [];
        try {
            const parsed = JSON.parse(client.regioes_atuacao);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return client.regioes_atuacao.split(',').map(s => s.trim());
        }
    };

    const handleDelete = async () => {
        if (!client || !confirm(`Tem certeza que deseja excluir o cliente "${client.nome}"?`)) return;
        setIsDeleting(true);
        try {
            await api.deleteCliente(client.id);
            onClose();
            // Reload page to refresh list
            window.location.reload();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            alert('Erro ao excluir cliente. Tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!client) return null;

    // LEFT CONTENT: Logo/Visual
    const LeftContent = (
        <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-plura-primary to-plura-primary-light p-8">
            <div className="w-48 h-48 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 p-6 flex items-center justify-center mb-6 shadow-2xl">
                {client.logo_url ? (
                    <SafeImage
                        src={api.getImageUrl(client.logo_url)}
                        alt={client.nome}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <Building2 size={80} className="text-white/40" />
                )}
            </div>

            {/* Client Name */}
            <h2 className="text-2xl font-bold text-white text-center mb-2 drop-shadow-lg">
                {client.nome}
            </h2>

            {/* Segment Badge */}
            {client.segmento && (
                <span className="px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white border border-white/30">
                    {client.segmento}
                </span>
            )}
        </div>
    );

    // RIGHT CONTENT: Data
    const RightContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Building2 size={20} className="text-plura-accent" />
                    Informações do Cliente
                </h1>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs text-gray-500 font-medium block mb-1">CNPJ</span>
                        <span className="text-sm font-mono text-gray-900">{client.cnpj || 'Não informado'}</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs text-gray-500 font-medium block mb-1">Localização</span>
                        <div className="flex items-center gap-1.5 text-sm text-gray-900">
                            <MapPin size={14} className="text-gray-400" />
                            {client.cidade ? `${client.cidade}, ${client.uf}` : 'Não informado'}
                        </div>
                    </div>
                    {client.publico_alvo && (
                        <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium block mb-1">Público Alvo</span>
                            <span className="text-sm text-gray-900">{client.publico_alvo}</span>
                        </div>
                    )}
                    <div className="col-span-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-xs text-gray-500 font-medium block mb-2">Regiões de Atuação</span>
                        <div className="flex flex-wrap gap-2">
                            {getRegions().length > 0 ? getRegions().map((reg, idx) => (
                                <span key={idx} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                    {reg}
                                </span>
                            )) : <span className="text-sm text-gray-400 italic">Nenhuma região informada</span>}
                        </div>
                    </div>
                </div>

                {/* Proposals Section */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText size={18} className="text-plura-accent" />
                            Propostas
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {proposals.length} {proposals.length === 1 ? 'proposta' : 'propostas'}
                        </span>
                    </div>

                    {isLoadingProposals ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : proposals.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-sm text-gray-500">Nenhuma proposta encontrada</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {proposals.map(proposal => (
                                <div
                                    key={proposal.id}
                                    onClick={() => router.push(`/propostas?id=${proposal.id}`)}
                                    className="group bg-white border border-gray-200 rounded-xl p-3 hover:border-plura-accent/30 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h5 className="font-medium text-gray-900 text-sm group-hover:text-plura-accent transition-colors">
                                                {proposal.nome}
                                            </h5>
                                            <div className="flex items-center gap-2 mt-1">
                                                <StatusBadge status={proposal.status} />
                                                <span className="text-[10px] text-gray-400">
                                                    {formatDate(proposal.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-plura-accent group-hover:text-white transition-colors">
                                            <ArrowRight size={12} />
                                        </div>
                                    </div>

                                    <div className="flex items-end justify-between border-t border-gray-50 pt-2 mt-2">
                                        <div className="flex items-center gap-1.5">
                                            <User size={12} className="text-gray-400" />
                                            <span className="text-xs text-gray-500 truncate max-w-[120px]" title={proposal.creator_email || 'Sistema'}>
                                                {proposal.creator_email ? proposal.creator_email : (proposal.created_by ? `#${proposal.created_by}` : 'Sistema')}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900">
                                                {formatCurrency(proposal.total_valor || 0)}
                                            </div>
                                            <div className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 rounded inline-block">
                                                Comissão {proposal.comissao}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <UnifiedSplitModal
            isOpen={isOpen}
            onClose={onClose}
            leftContent={LeftContent}
            leftBackground="dark"
            rightContent={RightContent}
            actions={[
                {
                    icon: Plus,
                    label: "Nova Proposta",
                    onClick: () => router.push(`/propostas?client=${client.id}&create=true`),
                    variant: 'default'
                },
                {
                    icon: Edit,
                    label: "Editar",
                    onClick: () => router.push(`/clientes/editar/${client.id}`),
                    variant: 'primary'
                },
                {
                    icon: Trash2,
                    label: "Deletar",
                    onClick: handleDelete,
                    variant: 'danger',
                    isLoading: isDeleting
                }
            ]}
        />
    );
}
