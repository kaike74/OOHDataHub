'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
    Search, Plus, Building2, FileText, Users, Loader2,
    MapPin, Menu, ChevronDown, Trash2, Coins
} from 'lucide-react';
import NavigationMenu from '@/components/NavigationMenu';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateProposalModal from '@/components/CreateProposalModal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

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
    const searchParams = useSearchParams();
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
        if (!user) {
            // Read email from params to pass to login for auto-fill
            // The invite link format is /admin/proposals?id=X&email=Y
            const emailParam = searchParams.get('email');
            let loginUrl = '/login';
            if (emailParam) {
                loginUrl += `?email=${encodeURIComponent(emailParam)}`;
            }
            router.push(loginUrl);
            return;
        }
        loadProposals();
    }, [user, router, searchParams]);

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

    // Unified Table View Logic
    const filteredProposals = proposals
        .filter(p => {
            const searchLower = searchTerm.toLowerCase();
            return (
                p.nome.toLowerCase().includes(searchLower) ||
                p.client_name.toLowerCase().includes(searchLower) ||
                p.creator_email?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); // Should use updated_at if available

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
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
            <header className="bg-gradient-to-r from-emidias-primary to-[#0A0970] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 fixed top-0 left-0 right-0 h-[70px] border-b-4 border-emidias-accent shadow-xl text-white">
                {/* Logo OOH Data Hub - Left */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
                        <MapPin size={22} className="text-emidias-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Admin Propostas
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                            Gestão Global
                        </p>
                    </div>
                </div>

                {/* Logo E-MÍDIAS - Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="text-xl font-bold tracking-tight text-white/90">
                        OOH DATA HUB
                    </div>
                </div>

                {/* Actions - Right */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* New Proposal Button - INTERNAL ONLY */}
                    {user?.role !== 'client' && (
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            variant="primary"
                            className="hidden sm:flex bg-white/10 hover:bg-white/20 text-white border-0"
                            leftIcon={<Plus size={18} />}
                        >
                            <span>Nova Proposta</span>
                        </Button>
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
                {/* Filters and Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center">
                    <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4 w-full md:w-auto md:min-w-[400px]">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Buscar por cliente, proposta ou e-mail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={<Search size={20} />}
                                className="bg-gray-50 border-gray-200 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Mobile Create Button */}
                    {user?.role !== 'client' && (
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            variant="primary"
                            className="w-full md:w-auto sm:hidden"
                            leftIcon={<Plus size={18} />}
                        >
                            <span>Nova Proposta</span>
                        </Button>
                    )}
                </div>

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map(i => (
                            <Skeleton key={i} className="h-16 w-full rounded-xl" />
                        ))}
                    </div>
                ) : filteredProposals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 animate-in fade-in zoom-in duration-500">
                        <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                        <p className="text-gray-500 font-medium mb-4">Nenhuma proposta encontrada</p>
                        {user?.role === 'client' && (
                            <div className="text-center">
                                <p className="text-sm text-gray-400 max-w-md mx-auto mb-6">
                                    Comece criando sua primeira campanha.
                                </p>
                                <Button
                                    onClick={() => {
                                        setCreatingForClientId(undefined); // Will default to 'pessoal' in modal logic
                                        setIsCreateModalOpen(true);
                                    }}
                                    leftIcon={<Plus size={18} />}
                                >
                                    Criar Nova Proposta
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in-up duration-500">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Cliente</th>
                                        <th className="px-6 py-4">Proposta</th>
                                        {/* Internal Only: Commission */}
                                        {user?.role !== 'client' && (
                                            <th className="px-6 py-4">Comissão</th>
                                        )}
                                        <th className="px-6 py-4">Criado em</th>
                                        <th className="px-6 py-4 text-center">Pontos</th>
                                        <th className="px-6 py-4 text-right">Valor</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredProposals.map((proposal) => (
                                        <tr
                                            key={proposal.id}
                                            onClick={() => handleOpenProposal(proposal.id)}
                                            className="group hover:bg-emidias-accent/5 transition-colors cursor-pointer"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${proposal.status === 'aprovada'
                                                        ? 'bg-green-100 text-green-700'
                                                        : proposal.status === 'em_negociacao'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${proposal.status === 'aprovada' ? 'bg-green-500' :
                                                            proposal.status === 'em_negociacao' ? 'bg-blue-500' : 'bg-yellow-500'
                                                        }`} />
                                                    {proposal.status.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 p-1 flex items-center justify-center">
                                                        {proposal.client_logo ? (
                                                            <SafeImage
                                                                src={api.getImageUrl(proposal.client_logo)}
                                                                alt={proposal.client_name}
                                                                className="w-full h-full object-contain"
                                                            />
                                                        ) : (
                                                            <Building2 size={14} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-gray-900 line-clamp-1">{proposal.client_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 group-hover:text-emidias-accent transition-colors line-clamp-1">
                                                    {proposal.nome}
                                                </div>
                                            </td>

                                            {/* Commission */}
                                            {user?.role !== 'client' && (
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="font-mono text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                        {proposal.comissao}
                                                    </span>
                                                </td>
                                            )}

                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(proposal.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    {proposal.total_itens}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(proposal.total_valor || 0)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {user?.role !== 'client' ? (
                                                    <button
                                                        onClick={(e) => handleDeleteProposta(proposal.id, e)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 opacity-0 group-hover:opacity-100"
                                                        title="Mover para lixeira"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                ) : (
                                                    // For clients, we might want fewer actions or different ones.
                                                    // Maybe View details arrow?
                                                    <span className="text-gray-300 text-sm">Ver</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
