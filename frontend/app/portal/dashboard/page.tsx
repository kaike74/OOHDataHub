'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, LogOut, FileText, Calendar, DollarSign, BarChart3, Target, ChevronRight, Search, ExternalLink, Building2 } from 'lucide-react';
import CreateProposalModal from '@/components/CreateProposalModal';

interface Proposal {
    id: number;
    nome: string;
    created_at: string;
    status: string;
    total_itens: number;
    total_valor: number;
    total_impactos: number;
    created_by: number | null;
    creator_name?: string;
    creator_email?: string;
    shared_with?: { name: string; email: string }[];
    client_id?: number;
    client_name?: string;
    client_logo?: string;
}

export default function PortalDashboard() {
    const router = useRouter();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [creatingForClientId, setCreatingForClientId] = useState<number | undefined>(undefined);

    useEffect(() => {
        checkAuth();
        fetchProposals();
    }, []);

    const checkAuth = () => {
        const storage = localStorage.getItem('ooh-client-auth-storage');
        if (!storage) {
            router.push('/portal/login');
            return;
        }
        try {
            const parsed = JSON.parse(storage);
            if (!parsed?.state?.token) {
                router.push('/portal/login');
                return;
            }
            setUser(parsed.state.user);
        } catch {
            router.push('/portal/login');
        }
    };

    const fetchProposals = async () => {
        try {
            const data = await api.getPortalProposals();
            setProposals(data);
        } catch (error) {
            console.error('Failed to fetch proposals', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('ooh-client-auth-storage');
        router.push('/portal/login');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('pt-BR').format(value);
    };

    const calculateCPM = (valor: number, impactos: number) => {
        if (!impactos || impactos === 0) return 0;
        return (valor / impactos) * 1000;
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-600/20">
                            ODH
                        </div>
                        <span className="font-semibold text-gray-900 border-l border-gray-200 pl-3 ml-1">Portal do Cliente</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {user && (
                            <div className="text-right hidden sm:block">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                        )}
                        <button
                            onClick={handleLogout}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            title="Sair"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Minhas Propostas</h1>
                        <p className="text-gray-500 mt-1">Acompanhe as propostas compartilhadas com você</p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : proposals.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma proposta encontrada</h3>
                        <p className="text-gray-500 mt-2">No momento não há propostas compartilhadas com sua conta.</p>
                    </div>
                ) : (
                    <div className="space-y-12">
                        {Object.entries(
                            proposals.reduce((groups, proposal) => {
                                const clientId = proposal.client_id || 0;
                                if (!groups[clientId]) {
                                    groups[clientId] = {
                                        clientName: proposal.client_name || 'Geral',
                                        clientLogo: proposal.client_logo,
                                        proposals: []
                                    };
                                }
                                groups[clientId].proposals.push(proposal);
                                return groups;
                            }, {} as Record<number, { clientName: string; clientLogo?: string; proposals: Proposal[] }>)
                        ).map(([clientId, group]) => (
                            <div key={clientId} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Group Header */}
                                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 font-bold overflow-hidden shadow-sm">
                                            {group.clientLogo ? (
                                                <img src={group.clientLogo} alt={group.clientName} className="w-full h-full object-cover" />
                                            ) : (
                                                <Building2 size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{group.clientName}</h3>
                                            <p className="text-xs text-gray-500">{group.proposals.length} propostas</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setCreatingForClientId(Number(clientId));
                                            setIsCreateModalOpen(true);
                                        }}
                                        className="px-4 py-2 bg-emidias-primary hover:bg-emidias-primary-dark text-white rounded-lg text-sm font-semibold shadow-sm transition-colors flex items-center gap-2"
                                    >
                                        <div className="bg-white/20 p-1 rounded-md">
                                            <FileText size={14} className="text-white" />
                                        </div>
                                        Nova Proposta
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-white border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposta</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Compartilhado com</th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Investimento</th>
                                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-24">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {group.proposals.map((proposal) => (
                                                <tr
                                                    key={proposal.id}
                                                    className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                                    onClick={() => router.push(`/portal/view?id=${proposal.id}`)}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 group-hover:scale-105 transition-all shadow-sm">
                                                                <FileText size={20} />
                                                            </div>
                                                            <div>
                                                                <div className="font-semibold text-gray-900 text-base mb-0.5">{proposal.nome}</div>
                                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                                    <div className="flex items-center gap-1">
                                                                        <Calendar size={12} />
                                                                        {new Date(proposal.created_at).toLocaleDateString()}
                                                                    </div>
                                                                    <span>•</span>
                                                                    <div className="flex items-center gap-1">
                                                                        <Target size={12} />
                                                                        {proposal.total_itens} pontos
                                                                    </div>
                                                                    <span>•</span>
                                                                    <span>
                                                                        Por: <span className="font-medium text-gray-700">
                                                                            {(() => {
                                                                                if (!proposal.created_by) return 'E-Mídias';
                                                                                // @ts-ignore
                                                                                if (user && proposal.created_by === user.id) return 'Você';
                                                                                return proposal.creator_name || proposal.creator_email || 'Usuário';
                                                                            })()}
                                                                        </span>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex -space-x-2 overflow-hidden py-1">
                                                            {proposal.shared_with && proposal.shared_with.length > 0 ? (
                                                                proposal.shared_with.slice(0, 5).map((share, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        className="relative group/avatar cursor-help"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 uppercase shadow-sm">
                                                                            {share.name ? share.name.charAt(0) : share.email.charAt(0)}
                                                                        </div>
                                                                        {/* Tooltip */}
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                                                                            <div className="font-semibold">{share.name || 'Usuário'}</div>
                                                                            <div className="text-gray-300 text-[10px]">{share.email}</div>
                                                                            {/* Arrow */}
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic pl-1">Apenas você</span>
                                                            )}
                                                            {proposal.shared_with && proposal.shared_with.length > 5 && (
                                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 shadow-sm z-10">
                                                                    +{proposal.shared_with.length - 5}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="text-sm font-bold text-gray-900">{formatCurrency(proposal.total_valor)}</div>
                                                            <div className="text-xs text-gray-500 flex items-center gap-1" title="Impactos totais">
                                                                <BarChart3 size={10} />
                                                                {formatNumber(proposal.total_impactos)} imp.
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.push(`/portal/view?id=${proposal.id}`);
                                                            }}
                                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group-hover:scale-105"
                                                        >
                                                            <ExternalLink size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <CreateProposalModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                initialClientId={creatingForClientId}
            />
        </div>
    );
}
