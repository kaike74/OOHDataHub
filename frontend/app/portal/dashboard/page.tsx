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
    shared_with: { email: string; name: string }[];
}

export default function PortalDashboard() {
    const router = useRouter();
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<{ id: number; name: string; email: string } | null>(null);

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

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
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
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[30%]">Proposta</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Criado Por</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Compartilhado Com</th>
                                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Data</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Investimento</th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">CPM</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {proposals.map((proposal) => (
                                        <tr
                                            key={proposal.id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer group"
                                            onClick={() => router.push(`/portal/view?id=${proposal.id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                                                        <FileText size={18} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{proposal.nome}</div>
                                                        <div className="text-xs text-gray-500">{proposal.total_itens} pontos</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${user && proposal.created_by === user.id
                                                        ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                                                        : !proposal.created_by
                                                            ? 'bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-600/20'
                                                            : 'bg-gray-50 text-gray-600 ring-1 ring-inset ring-gray-500/10'
                                                    }`}>
                                                    {(() => {
                                                        if (!proposal.created_by) return 'E-Mídias';
                                                        if (user && proposal.created_by === user.id) return 'Você';
                                                        return proposal.creator_name || proposal.creator_email?.split('@')[0] || 'Outro Usuário';
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex -space-x-2 overflow-hidden items-center">
                                                    {proposal.shared_with && proposal.shared_with.length > 0 ? (
                                                        <>
                                                            {proposal.shared_with.slice(0, 3).map((u, i) => (
                                                                <div
                                                                    key={i}
                                                                    className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 cursor-help"
                                                                    title={`${u.name}\n${u.email}`}
                                                                >
                                                                    {getInitials(u.name)}
                                                                </div>
                                                            ))}
                                                            {proposal.shared_with.length > 3 && (
                                                                <div className="relative inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-50 flex items-center justify-center text-xs font-medium text-gray-500">
                                                                    +{proposal.shared_with.length - 3}
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Privado</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(proposal.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm font-medium text-gray-900">{formatCurrency(proposal.total_valor)}</div>
                                                <div className="text-xs text-gray-500">{formatNumber(proposal.total_impactos)} imp.</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="text-sm text-gray-600 font-mono">
                                                    {formatCurrency(calculateCPM(proposal.total_valor, proposal.total_impactos))}
                                                </div>
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
