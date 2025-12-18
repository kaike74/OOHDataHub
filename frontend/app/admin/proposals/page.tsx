'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
    Search, Plus, Filter, MoreVertical, Building2,
    FileText, Calendar, DollarSign, Users, Mail, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminProposal {
    id: number;
    nome: string;
    created_at: string;
    status: string;
    comissao: string;
    client_id: number;
    client_name: string;
    client_logo: string | null;
    total_itens: number;
    total_valor: number;
    shared_with: Array<{ email: string; name: string }>;
}

export default function AdminProposalsPage() {
    const router = useRouter();
    const [proposals, setProposals] = useState<AdminProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const setCurrentView = useStore((state) => state.setCurrentView);

    useEffect(() => {
        loadProposals();
    }, []);

    const loadProposals = async () => {
        try {
            setLoading(true);
            const data = await api.getAdminProposals();
            setProposals(data);
        } catch (error) {
            console.error('Error loading proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProposal = async (proposalId: number) => {
        try {
            const proposta = await api.getProposta(proposalId);
            setSelectedProposta(proposta);
            setCurrentView('map');
            router.push('/');
        } catch (error) {
            console.error('Error opening proposal:', error);
        }
    };

    // Group proposals by client
    const groupedProposals = proposals.reduce((acc, proposal) => {
        if (!acc[proposal.client_id]) {
            acc[proposal.client_id] = {
                client_name: proposal.client_name,
                client_logo: proposal.client_logo,
                proposals: []
            };
        }
        acc[proposal.client_id].proposals.push(proposal);
        return acc;
    }, {} as Record<number, { client_name: string; client_logo: string | null; proposals: AdminProposal[] }>);

    // Filter logic
    const filteredGroupIds = Object.keys(groupedProposals).filter(clientId => {
        const group = groupedProposals[Number(clientId)];
        const clientMatch = group.client_name.toLowerCase().includes(searchTerm.toLowerCase());
        const proposalMatch = group.proposals.some(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()));
        return clientMatch || proposalMatch;
    });

    return (
        <div className="min-h-screen bg-gray-50 pt-[70px]">
            <div className="max-w-7xl mx-auto p-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Propostas</h1>
                        <p className="text-gray-500 text-sm mt-1">Gerencie todas as propostas agrupadas por cliente</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente ou proposta..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-accent/20 focus:border-emidias-accent transition-all"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-emidias-accent" size={32} />
                    </div>
                ) : filteredGroupIds.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                        <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 font-medium">Nenhuma proposta encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {filteredGroupIds.map(clientIdStr => {
                            const clientId = Number(clientIdStr);
                            const group = groupedProposals[clientId];

                            return (
                                <div key={clientId} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Client Header */}
                                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-lg border border-gray-100 flex items-center justify-center overflow-hidden shadow-sm">
                                            {group.client_logo ? (
                                                <img src={api.getImageUrl(group.client_logo)} alt={group.client_name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="text-gray-300" size={24} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg">{group.client_name}</h3>
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{group.proposals.length} Propostas</p>
                                        </div>
                                    </div>

                                    {/* Proposals List */}
                                    <div className="divide-y divide-gray-100">
                                        {group.proposals.map(proposal => (
                                            <div
                                                key={proposal.id}
                                                className="p-4 hover:bg-blue-50/30 transition-colors flex flex-col md:flex-row md:items-center gap-4 cursor-pointer group"
                                                onClick={() => handleOpenProposal(proposal.id)}
                                            >
                                                {/* Proposal Info */}
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-semibold text-gray-900 group-hover:text-emidias-accent transition-colors">
                                                            {proposal.nome}
                                                        </h4>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${proposal.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                                                                proposal.status === 'em_negociacao' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                            }`}>
                                                            {proposal.status?.replace('_', ' ').toUpperCase()}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar size={14} />
                                                            {formatDate(proposal.created_at)}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <DollarSign size={14} />
                                                            {proposal.comissao}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <FileText size={14} />
                                                            {proposal.total_itens} itens
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Shared Info (Account) */}
                                                <div className="px-4 border-l border-gray-100 min-w-[200px]">
                                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                        <Users size={12} />
                                                        Compartilhado com
                                                    </p>
                                                    {proposal.shared_with && proposal.shared_with.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {proposal.shared_with.map((user, idx) => (
                                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                                                    <Mail size={12} className="text-gray-400" />
                                                                    <span className="truncate max-w-[180px]" title={user.email}>{user.email}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 italic">Ninguém</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
