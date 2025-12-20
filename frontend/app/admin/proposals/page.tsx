'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import {
    Search, Plus, Filter, MoreVertical, Building2,
    FileText, Calendar, DollarSign, Users, Loader2,
    MapPin, Menu, ChevronDown, ChevronRight, History, Trash2, Coins
} from 'lucide-react';
import NavigationMenu from '@/components/NavigationMenu';
import { useRouter } from 'next/navigation';
import CreateProposalModal from '@/components/CreateProposalModal';

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
    created_by?: number | null;
    creator_email?: string;
}

export default function AdminProposalsPage() {
    const router = useRouter();
    const [proposals, setProposals] = useState<AdminProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({});
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creatingForClientId, setCreatingForClientId] = useState<number | undefined>(undefined);
    const [creatingForClientName, setCreatingForClientName] = useState<string | undefined>(undefined);

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
            // If Client, bypass redirect
            const url = user?.role === 'client' ? '/?action=new' : '/';
            router.push(url);
        } catch (error) {
            console.error('Error opening proposal:', error);
        }
    };

    const handleDeleteProposta = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Deseja mover esta proposta para a lixeira?')) return;

        try {
            await api.deleteProposta(id);
            setProposals(current => current.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting proposal:', error);
            alert('Falha ao excluir proposta');
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
            {/* Modal */}
            <CreateProposalModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setCreatingForClientId(undefined);
                    setCreatingForClientName(undefined);
                }}
                initialClientId={creatingForClientId}
                initialClientName={creatingForClientName}
            />

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
                    {/* New Proposal Button - INTERNAL ONLY */}
                    {user?.role !== 'client' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all font-medium backdrop-blur-sm"
                        >
                            <Plus size={18} />
                            <span>Nova Proposta</span>
                        </button>
                    )}

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
                <div className="bg-white p-4 rounded-xl shadow-emidias-sm border border-emidias-gray-200 mb-8 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emidias-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por cliente, proposta ou e-mail..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-emidias-gray-50 border border-emidias-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-accent/20 focus:border-emidias-accent transition-all text-emidias-gray-900"
                        />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-emidias-accent" size={32} />
                    </div>
                ) : filteredGroupIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl border-2 border-dashed border-emidias-gray-200">
                        <FileText className="mx-auto text-emidias-gray-300 mb-3" size={48} />
                        <p className="text-emidias-gray-500 font-medium mb-4">Nenhuma proposta encontrada</p>
                        {user?.role === 'client' && (
                            <p className="text-sm text-gray-400 max-w-md text-center">
                                Ainda não há propostas compartilhadas com você. Entre em contato com a equipe para criar sua primeira proposta.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-10">
                        {filteredGroupIds.map(clientIdStr => {
                            const clientId = Number(clientIdStr);
                            const group = groupedProposals[clientId];
                            const isTwOpen = expandedGroups[clientId];

                            return (
                                <div key={clientId} className="group-list">
                                    {/* Client Header */}
                                    <div
                                        onClick={() => toggleGroup(clientId)}
                                        className="flex items-center gap-4 mb-4 cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <div className="w-16 h-16 bg-white rounded-2xl border border-gray-200 flex items-center justify-center p-2 shadow-sm">
                                            {group.client_logo ? (
                                                <img src={api.getImageUrl(group.client_logo)} alt={group.client_name} className="w-full h-full object-contain" />
                                            ) : (
                                                <Building2 className="text-gray-300" size={32} />
                                            )}
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-gray-900">{group.client_name}</h2>
                                            <p className="text-sm text-gray-500 font-medium flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emidias-accent" />
                                                {group.proposals.length} Campanha(s) Ativa(s)
                                            </p>
                                        </div>
                                        <div className={`ml-auto p-2 bg-white rounded-full border border-gray-200 shadow-sm transition-transform duration-300 ${isTwOpen ? 'rotate-180' : ''}`}>
                                            <ChevronDown size={20} className="text-gray-500" />
                                        </div>
                                    </div>

                                    {/* Grid of Proposals */}
                                    <div className={`transition-all duration-300 ease-in-out ${isTwOpen ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                            {group.proposals.map(proposal => (
                                                <div
                                                    key={proposal.id}
                                                    onClick={() => handleOpenProposal(proposal.id)}
                                                    className="relative bg-white rounded-2xl p-5 border border-gray-200 hover:border-emidias-accent/50 hover:shadow-xl hover:shadow-emidias-accent/5 cursor-pointer transition-all duration-300 flex flex-col group/card"
                                                >
                                                    {/* Status Strip */}
                                                    <div className={`absolute top-0 inset-x-0 h-1.5 rounded-t-2xl ${proposal.status === 'aprovada' ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                                        proposal.status === 'em_negociacao' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gray-200'
                                                        }`} />

                                                    {/* Header with Icon and Actions */}
                                                    <div className="flex justify-between items-start mb-4 mt-2">
                                                        <div className="p-2.5 bg-gray-50 rounded-xl group-hover/card:bg-emidias-accent/10 group-hover/card:text-emidias-accent transition-colors">
                                                            <FileText size={20} />
                                                        </div>

                                                        {user?.role !== 'client' && (
                                                            <button
                                                                onClick={(e) => handleDeleteProposta(proposal.id, e)}
                                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover/card:opacity-100"
                                                                title="Mover para lixeira"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Title & Commission */}
                                                    <div className="mb-4">
                                                        <h3 className="text-lg font-bold text-gray-900 group-hover/card:text-emidias-accent transition-colors line-clamp-1 mb-1">
                                                            {proposal.nome}
                                                        </h3>
                                                        {user?.role !== 'client' && (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 uppercase tracking-wide">
                                                                <Coins size={10} />
                                                                {proposal.comissao}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Stats Grid */}
                                                    <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-gray-500 mb-4 border-t border-gray-50 pt-3 mt-auto">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Criado em</span>
                                                            <span className="text-gray-700 font-medium">{formatDate(proposal.created_at)}</span>
                                                        </div>
                                                        <div className="flex flex-col text-right">
                                                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Status</span>
                                                            <span className={`font-medium ${proposal.status === 'aprovada' ? 'text-green-600' :
                                                                proposal.status === 'em_negociacao' ? 'text-blue-600' : 'text-gray-600'
                                                                }`}>
                                                                {proposal.status?.replace('_', ' ')}
                                                            </span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] text-gray-400 uppercase font-semibold">Pontos</span>
                                                            <span className="text-gray-700 font-medium flex items-center gap-1">
                                                                <MapPin size={12} />
                                                                {proposal.total_itens}
                                                            </span>
                                                        </div>
                                                        {user?.role !== 'client' && (
                                                            <div className="flex flex-col text-right">
                                                                <span className="text-[10px] text-gray-400 uppercase font-semibold">Valor</span>
                                                                <span className="text-gray-900 font-bold">
                                                                    {formatCurrency(proposal.total_valor || 0)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Footer (Creator / Share) */}
                                                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                                        {proposal.created_by ? (
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                                <Users size={12} />
                                                                <span className="max-w-[100px] truncate" title={proposal.creator_email}>
                                                                    {proposal.creator_email?.split('@')[0]}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-300">-</span>
                                                        )}

                                                        <div className="flex -space-x-2">
                                                            {proposal.shared_with?.slice(0, 3).map((share, i) => (
                                                                <div key={i} className="w-6 h-6 rounded-full bg-emidias-accent text-[8px] text-white flex items-center justify-center border-2 border-white font-bold" title={share.email}>
                                                                    {share.email[0].toUpperCase()}
                                                                </div>
                                                            ))}
                                                            {proposal.shared_with?.length > 3 && (
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 text-[8px] text-gray-500 flex items-center justify-center border-2 border-white font-bold">
                                                                    +{proposal.shared_with.length - 3}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Add Button for Client in this View */}
                                            {user?.role === 'client' && (
                                                <div
                                                    onClick={() => {
                                                        setCreatingForClientId(clientId);
                                                        setCreatingForClientName(group.client_name);
                                                        setIsCreateModalOpen(true);
                                                    }}
                                                    className="flex flex-col items-center justify-center bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emidias-accent/50 hover:bg-white cursor-pointer transition-all duration-300 min-h-[280px] group/add"
                                                >
                                                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover/add:scale-110 transition-transform text-gray-400 group-hover/add:text-emidias-accent">
                                                        <Plus size={24} />
                                                    </div>
                                                    <span className="font-semibold text-gray-500 group-hover/add:text-emidias-accent">Nova Proposta</span>
                                                </div>
                                            )}
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
