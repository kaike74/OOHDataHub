'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
    Search, Plus, Filter, MoreVertical, Building2,
    FileText, Calendar, DollarSign, Users, Mail, Loader2,
    MapPin, Menu, ChevronDown, ChevronRight
} from 'lucide-react';
import NavigationMenu from '@/components/NavigationMenu';
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
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setMenuOpen = useStore((state) => state.setMenuOpen);

    const user = useStore((state) => state.user);

    useEffect(() => {
        if (user) loadProposals();
    }, [user]);

    const loadProposals = async () => {
        try {
            setLoading(true);
            let data;
            if (user?.role === 'client') {
                data = await api.getPortalProposals();
            } else {
                data = await api.getAdminProposals();
            }
            setProposals(data);
            // Default all expanded
            const initialExpanded: Record<number, boolean> = {};
            data.forEach((p: AdminProposal) => {
                initialExpanded[p.client_id] = true;
            });
            setExpandedGroups(initialExpanded);
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

    const toggleGroup = (clientId: number) => {
        setExpandedGroups(prev => ({
            ...prev,
            [clientId]: !prev[clientId]
        }));
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
        const proposalMatch = group.proposals.some(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.shared_with.some(s => s.email.toLowerCase().includes(searchTerm.toLowerCase())));
        return clientMatch || proposalMatch;
    });

    return (
        <div className="min-h-screen bg-emidias-gray-50 pb-10">
            {/* Header */}
            <header className="gradient-primary px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 fixed top-0 left-0 right-0 h-[70px] border-b-4 border-emidias-accent shadow-emidias-xl">
                {/* Logo OOH Data Hub - Left */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
                        <MapPin size={22} className="text-emidias-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Admin Propostas
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                            Gestão Global
                        </p>
                    </div>
                </div>

                {/* Logo E-MÍDIAS - Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <img
                        src="https://raw.githubusercontent.com/kaike74/distribuicaoemidias/main/logo%20E-MIDIAS%20png%20fundo%20escuro%20HORIZONTAL%20(1).png"
                        alt="E-MÍDIAS Logo"
                        className="h-10 lg:h-12 object-contain drop-shadow-lg"
                    />
                </div>

                {/* Actions - Right */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Menu Button */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            <NavigationMenu />

            <div className="max-w-7xl mx-auto p-6 mt-[80px]">
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-emidias-sm border border-emidias-gray-200 mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emidias-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, proposta ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-emidias-gray-50 border border-emidias-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-accent/20 focus:border-emidias-accent transition-all text-emidias-gray-900"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-emidias-accent" size={32} />
                    </div>
                ) : filteredGroupIds.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-emidias-gray-200">
                        <FileText className="mx-auto text-emidias-gray-300 mb-3" size={48} />
                        <p className="text-emidias-gray-500 font-medium">Nenhuma proposta encontrada</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredGroupIds.map(clientIdStr => {
                            const clientId = Number(clientIdStr);
                            const group = groupedProposals[clientId];
                            const isTwOpen = expandedGroups[clientId];

                            return (
                                <div key={clientId} className="bg-white rounded-xl shadow-emidias-sm border border-emidias-gray-200 overflow-hidden transition-all duration-300 hover:shadow-emidias-md">
                                    {/* Client Header (Accordion Trigger) */}
                                    <div
                                        onClick={() => toggleGroup(clientId)}
                                        className="p-4 bg-gradient-to-r from-emidias-gray-50 to-white hover:from-emidias-gray-100 transition-colors cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white rounded-lg border border-emidias-gray-100 flex items-center justify-center overflow-hidden shadow-sm p-1">
                                                {group.client_logo ? (
                                                    <img src={api.getImageUrl(group.client_logo)} alt={group.client_name} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Building2 className="text-emidias-gray-300" size={24} />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-emidias-gray-900 text-lg">{group.client_name}</h3>
                                                <p className="text-xs text-emidias-gray-500 font-medium uppercase tracking-wider flex items-center gap-1">
                                                    <FileText size={10} />
                                                    {group.proposals.length} Propostas
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`p-2 rounded-full transition-transform duration-300 ${isTwOpen ? 'rotate-180 bg-emidias-gray-200/50' : 'bg-transparent'}`}>
                                            <ChevronDown size={20} className="text-emidias-gray-400" />
                                        </div>
                                    </div>

                                    {/* Proposals List (Collapsible) */}
                                    <div className={`transition-all duration-300 ease-in-out ${isTwOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        <div className="divide-y divide-emidias-gray-100 border-t border-emidias-gray-100">
                                            {group.proposals.map(proposal => (
                                                <div
                                                    key={proposal.id}
                                                    className="p-4 hover:bg-blue-50/50 transition-colors flex flex-col md:flex-row md:items-center gap-4 cursor-pointer group"
                                                    onClick={() => handleOpenProposal(proposal.id)}
                                                >
                                                    {/* Status Indicator Bar */}
                                                    <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${proposal.status === 'aprovada' ? 'bg-green-500' :
                                                        proposal.status === 'em_negociacao' ? 'bg-blue-500' :
                                                            'bg-gray-300'
                                                        }`} />

                                                    {/* Proposal Info */}
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-semibold text-emidias-gray-900 group-hover:text-emidias-accent transition-colors text-base relative">
                                                                {proposal.nome}
                                                            </h4>
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wide ${proposal.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                                                                proposal.status === 'em_negociacao' ? 'bg-blue-100 text-blue-700' :
                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {proposal.status?.replace('_', ' ')}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-4 text-sm text-emidias-gray-500 mt-2">
                                                            <div className="flex items-center gap-1.5" title="Data de Criação">
                                                                <Calendar size={14} className="text-emidias-gray-400" />
                                                                {formatDate(proposal.created_at)}
                                                            </div>
                                                            <div className="flex items-center gap-1.5" title="Comissão / Valor">
                                                                <DollarSign size={14} className="text-emidias-gray-400" />
                                                                <span className="font-medium text-emidias-gray-700">{proposal.comissao}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5" title="Total de Itens">
                                                                <MapPin size={14} className="text-emidias-gray-400" />
                                                                {proposal.total_itens} pontos
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Shared Info (Account) */}
                                                    <div className="flex flex-col items-end min-w-[200px] border-l border-emidias-gray-100 pl-4 md:text-right">
                                                        <p className="text-[10px] font-bold text-emidias-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1 justify-end">
                                                            Compartilhado com
                                                            <Users size={12} />
                                                        </p>
                                                        {proposal.shared_with && proposal.shared_with.length > 0 ? (
                                                            <div className="space-y-1.5">
                                                                {proposal.shared_with.map((user, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 justify-end text-sm text-emidias-gray-700 bg-emidias-gray-50 px-2 py-1 rounded-md border border-emidias-gray-100">
                                                                        <span className="truncate max-w-[150px] font-medium" title={user.email}>{user.email}</span>
                                                                        <div className="w-5 h-5 rounded-full bg-emidias-accent/10 flex items-center justify-center text-[10px] font-bold text-emidias-accent">
                                                                            {user.email[0].toUpperCase()}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-emidias-gray-400 italic bg-gray-50 px-2 py-1 rounded-md">
                                                                Privado / Não compartilhado
                                                            </span>
                                                        )}
                                                    </div>

                                                    <ChevronRight size={18} className="text-emidias-gray-300 opacity-0 group-hover:opacity-100 transition-opacity -mr-2" />
                                                </div>
                                            ))}
                                        </div>
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
