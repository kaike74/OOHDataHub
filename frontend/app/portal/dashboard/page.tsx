'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, LogOut, FileText, Calendar, DollarSign, BarChart3, Target, ChevronRight, Search, ExternalLink } from 'lucide-react';

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
}

export default function PortalDashboard() {
    const router = useRouter();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{ name: string; email: string } | null>(null);

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
                    {/* Placeholder for future search/filter */}
                    {/* <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Buscar..." className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20" />
                    </div> */}
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
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Proposta</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Investimento</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Impactos</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">CPM</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {proposals.map((proposal) => (
                                        <tr
                                            key={proposal.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                            onClick={() => router.push(`/portal/view?id=${proposal.id}`)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{proposal.nome}</div>
                                                        <div className="text-xs text-gray-500">{proposal.total_itens} pontos</div>

                                                        {/* CREATED BY ROW */}
                                                        <div className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                                                            <span>Em {new Date(proposal.created_at).toLocaleDateString()}</span>
                                                            <span>•</span>
                                                            <span>Por:</span>
                                                            <span className="font-medium text-gray-600">
                                                                {(() => {
                                                                    if (!proposal.created_by) return 'E-Mídias';
                                                                    // @ts-ignore
                                                                    if (user && proposal.created_by === user.id) return 'Você';
                                                                    return proposal.creator_name || proposal.creator_email || 'Usuário';
                                                                })()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-gray-900">{formatCurrency(proposal.total_valor)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm text-gray-600">{formatNumber(proposal.total_impactos)}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm text-gray-600 font-mono">
                                                    {formatCurrency(calculateCPM(proposal.total_valor, proposal.total_impactos))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/portal/view?id=${proposal.id}`);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 rounded-full hover:bg-blue-50 transition-colors"
                                                >
                                                    <ExternalLink size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div >
                )
                }
            </main >
        </div >
    );
}
