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
import ProposalsTable from '@/components/ProposalsTable';
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
    id_cliente: number; // Mapped from client_id
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

            // Map client_id to id_cliente for compatibility with ProposalsTable
            const mappedData = data.map((p: any) => ({
                ...p,
                id_cliente: p.client_id || p.id_cliente
            }));

            setProposals(mappedData);
            // Default all expanded
            const initialExpanded: Record<number, boolean> = {};
            mappedData.forEach((p: AdminProposal) => {
                initialExpanded[p.client_id] = true; // Still use client_id for grouping logic if needed, though we removed grouping logic
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

            <div className="w-full max-w-[1920px] mx-auto p-6 mt-[80px]">
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
                <ProposalsTable
                    data={filteredProposals}
                    isLoading={loading}
                    showClientColumn={true}
                    onEdit={(p) => handleOpenProposal(p.id)}
                    onRowClick={(p) => handleOpenProposal(p.id)}
                    onDelete={handleDeleteProposta}
                    emptyMessage="Nenhuma proposta encontrada"
                    emptyActionLabel={user?.role === 'client' ? "Criar Nova Proposta" : undefined}
                    onEmptyAction={
                        user?.role === 'client'
                            ? () => {
                                setCreatingForClientId(undefined);
                                setIsCreateModalOpen(true);
                            }
                            : undefined
                    }
                />
            </div>
        </div>
    );
}
