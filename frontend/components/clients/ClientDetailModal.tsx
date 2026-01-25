'use client';

import { useEffect, useState } from 'react';
import { Building2, FileText, MapPin, User, ArrowRight, Plus, Edit, Trash2 } from 'lucide-react';
import { Cliente, Proposta } from '@/lib/types';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UnifiedStandardModal } from '@/components/ui/UnifiedStandardModal';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface ExtendedProposta extends Proposta {
    creator_email?: string;
    total_valor?: number;
}

interface ClientDetailModalProps {
    client: Cliente | null;
    onClose: () => void;
    isOpen: boolean;
}



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

    const handleDelete = async () => {
        if (!client || !confirm(`Tem certeza que deseja excluir o cliente "${client.nome}"?`)) return;
        setIsDeleting(true);
        try {
            await api.deleteCliente(client.id);
            onClose();
            window.location.reload();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            alert('Erro ao excluir cliente. Tente novamente.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!client) return null;

    // 1. HERO Content
    const HeroContent = (
        <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 p-3 flex-shrink-0 flex items-center justify-center">
                {client.logo_url ? (
                    <SafeImage src={api.getImageUrl(client.logo_url)} alt={client.nome} className="w-full h-full object-contain" />
                ) : (
                    <Building2 size={32} className="text-gray-300" />
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{client.nome}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    {client.segmento && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                            {client.segmento}
                        </span>
                    )}
                    <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {client.cidade ? `${client.cidade}, ${client.uf}` : 'Localização n/a'}
                    </span>
                </div>
            </div>
        </div>
    );

    // 2. Info Content (Cards)
    const InfoContent = (
        <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-green-50 text-green-700 rounded-lg"><Building2 size={16} /></div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dados Cadastrais</h3>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">CNPJ</span>
                        <span className="text-sm font-mono text-gray-900 bg-gray-50 px-2 py-1 rounded inline-block">{client.cnpj || 'Não informado'}</span>
                    </div>
                    {client.publico_alvo && (
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Público Alvo</span>
                            <span className="text-sm text-gray-700 leading-relaxed">{client.publico_alvo}</span>
                        </div>
                    )}
                </div>
            </div>

            {client.regioes_atuacao && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-3">Regiões de Atuação</span>
                    <div className="flex flex-wrap gap-2">
                        {(client.regioes_atuacao.startsWith('[') ? JSON.parse(client.regioes_atuacao) : client.regioes_atuacao.split(',')).map((reg: string, idx: number) => (
                            <span key={idx} className="px-2 py-1 bg-gray-50 border border-gray-100 rounded text-xs text-gray-600 font-medium">
                                {reg}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    // 3. Lists Content (Proposals)
    const ListContent = (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-50 text-blue-700 rounded-lg"><FileText size={16} /></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Propostas Recentes</h3>
                </div>
                <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{proposals.length}</span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 flex-1 overflow-hidden flex flex-col min-h-[300px] shadow-sm">
                {isLoadingProposals ? (
                    <div className="p-4 space-y-3">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-lg animate-pulse" />)}
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-400">
                        <FileText size={32} className="mb-2 opacity-20" />
                        <p className="text-xs">Nenhuma proposta encontrada</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto p-2 space-y-2 custom-scrollbar">
                        {proposals.map(proposal => (
                            <div
                                key={proposal.id}
                                onClick={() => router.push(`/propostas?id=${proposal.id}`)}
                                className="group p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{proposal.nome}</span>
                                    <StatusBadge status={proposal.status} />
                                </div>
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] text-gray-400">{formatDate(proposal.created_at)}</span>
                                    <span className="text-xs font-bold text-gray-900">{formatCurrency(proposal.total_valor || 0)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <UnifiedStandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalhes do Cliente"
            hero={HeroContent}
            // For Client, we give more space to Info and Lists, skipping Visual if there's no map
            infoContent={InfoContent}
            listContent={ListContent}
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
