'use client';

import { useEffect, useState } from 'react';
import { Building2, FileText, MapPin, User, ArrowRight, Plus } from 'lucide-react';
import { Cliente, Proposta } from '@/lib/types';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UnifiedDetailModal } from '@/components/ui/UnifiedDetailModal';

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

    if (!client) return null;

    // Logo component
    const logo = client.logo_url ? (
        <SafeImage
            src={api.getImageUrl(client.logo_url)}
            alt={client.nome}
            className="w-full h-full object-contain"
        />
    ) : (
        <Building2 size={40} className="text-gray-300" />
    );

    return (
        <UnifiedDetailModal
            isOpen={isOpen}
            onClose={onClose}
            title={client.nome}
            subtitle={client.segmento}
            logo={logo}
            sections={[
                // Informações Básicas
                {
                    title: "Informações",
                    icon: <Building2 size={16} />,
                    content: (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs text-gray-500 font-medium block mb-1">CNPJ</span>
                                <span className="text-sm font-mono text-gray-900">{client.cnpj || 'Não informado'}</span>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs text-gray-500 font-medium block mb-1">Localização</span>
                                <div className="flex items-center gap-1.5 text-sm text-gray-900">
                                    <MapPin size={14} className="text-gray-400" />
                                    {client.cidade ? `${client.cidade}, ${client.uf}` : 'Não informado'}
                                </div>
                            </div>
                            {client.publico_alvo && (
                                <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <span className="text-xs text-gray-500 font-medium block mb-1">Público Alvo</span>
                                    <span className="text-sm text-gray-900">{client.publico_alvo}</span>
                                </div>
                            )}
                            <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
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
                    )
                },
                // Propostas
                {
                    title: "Propostas",
                    icon: <FileText size={16} />,
                    content: (
                        <div>
                            <div className="flex items-center justify-between mb-4">
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
                                            className="group bg-white border border-gray-200 rounded-xl p-3 hover:border-plura-accent/30 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
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
                    )
                }
            ]}
            actions={[
                {
                    label: "Criar Proposta",
                    onClick: () => router.push(`/propostas?client=${client.id}&create=true`),
                    icon: <Plus size={16} />,
                    variant: 'secondary'
                },
                {
                    label: "Editar Cliente",
                    onClick: () => router.push(`/clientes/editar/${client.id}`),
                    variant: 'primary'
                }
            ]}
        />
    );
}
