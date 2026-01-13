'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, Building2, FileText, ArrowRight, User } from 'lucide-react';
import { Cliente, Proposta } from '@/lib/types';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface ExtendedProposta extends Proposta {
    creator_email?: string;
    total_valor?: number;
}

interface ClientDetailsSidebarProps {
    client: Cliente | null;
    onClose: () => void;
    isOpen: boolean;
}

export default function ClientDetailsSidebar({ client, onClose, isOpen }: ClientDetailsSidebarProps) {
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

    // Parse specific JSON fields if they are strings
    const getRegions = () => {
        if (!client?.regioes_atuacao) return [];
        try {
            const parsed = JSON.parse(client.regioes_atuacao);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return client.regioes_atuacao.split(',').map(s => s.trim()); // Fallback
        }
    };

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

    if (!client) return null;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">Detalhes do Cliente</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Header Info */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 p-2 shadow-sm mb-4 flex items-center justify-center overflow-hidden">
                            {client.logo_url ? (
                                <SafeImage
                                    src={api.getImageUrl(client.logo_url)}
                                    alt={client.nome}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Building2 size={40} className="text-gray-300" />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center">{client.nome}</h3>
                        {client.segmento && (
                            <span className="mt-1 px-3 py-1 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                {client.segmento}
                            </span>
                        )}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
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

                    {/* Proposals List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FileText size={18} className="text-emidias-accent" />
                                Propostas
                            </h4>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {proposals.length}
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
                                        onClick={() => router.push(`/propostas/visualizar?id=${proposal.id}`)}
                                        className="group bg-white border border-gray-200 rounded-xl p-3 hover:border-emidias-accent/30 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h5 className="font-medium text-gray-900 text-sm group-hover:text-emidias-accent transition-colors">
                                                    {proposal.nome}
                                                </h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusBadge status={proposal.status} />
                                                    <span className="text-[10px] text-gray-400">
                                                        {formatDate(proposal.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emidias-accent group-hover:text-white transition-colors">
                                                <ArrowRight size={12} />
                                            </div>
                                        </div>

                                        <div className="flex items-end justify-between border-t border-gray-50 pt-2 mt-2">
                                            <div className="flex items-center gap-1.5">
                                                <User size={12} className="text-gray-400" />
                                                <span className="text-xs text-gray-500 truncate max-w-[120px]" title={proposal.creator_email || 'Sistema'}>
                                                    {/* Display email or ID or default */}
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

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            // Logic to create proposal for this client
                            // Could use router push or trigger modal in parent
                            router.push(`/propostas?client=${client.id}&create=true`);
                        }}
                        className="flex-1"
                    >
                        Criar Proposta
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => router.push(`/clientes/editar/${client.id}`)}
                        className="flex-1"
                    >
                        Editar Cliente
                    </Button>
                </div>
            </div>
        </>
    );
}
