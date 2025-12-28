'use client';

import { useState, useEffect } from 'react';
import { Proposta, User } from '@/lib/types';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
    Search, Plus, Building2, FileText, Users, Loader2,
    MapPin, Menu, ChevronDown, Trash2, Coins, TrendingUp
} from 'lucide-react';
import NavigationMenu from '@/components/NavigationMenu';
import { useRouter, useSearchParams } from 'next/navigation';
import CreateProposalModal from '@/components/CreateProposalModal';
import ClientModal from '@/components/ClientModal';
import ProposalsTable from '@/components/ProposalsTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';
import MainLayout from '@/components/layout/MainLayout';

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
    const [editingClient, setEditingClient] = useState<any | null>(null);
    const [editingProposal, setEditingProposal] = useState<Proposta | null>(null);

    // Filters
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
            const url = user?.role === 'client' ? `/?id=${proposalId}` : `/?id=${proposalId}`;
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

    const handleEditProposal = (proposal: any) => {
        // Map table item back to Proposta if needed, or fetch full?
        // ProposalTableItem has most fields, but we should probably fetch full or just cast if simple edit
        // For name/client edit, table item is enough usually if types match
        // But CreateProposalModal expects Proposta type.
        // We'll cast item to Proposta for now as it has base fields
        setEditingProposal(proposal as Proposta); // Cast to Proposta
        setIsCreateModalOpen(true);
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

    // Breadcrumbs
    const breadcrumbs = [
        { label: 'Admin', href: '/admin' },
        { label: 'Propostas', active: true }
    ];

    // Actions
    const renderActions = () => (
        <Button
            onClick={() => {
                setEditingProposal(null);
                setIsCreateModalOpen(true);
            }}
            variant="accent"
            className="shadow-accent shadow-emidias-accent/20"
            leftIcon={<Plus size={18} strokeWidth={2.5} />}
        >
            <span className="hidden sm:inline">Nova Proposta</span>
        </Button>
    );

    return (
        <MainLayout
            user={user}
            breadcrumbs={breadcrumbs}
            counts={{ propostas: proposals.length }}
            actions={renderActions()}
        >
            <div className="w-full max-w-[1920px] mx-auto p-4 sm:p-6 lg:p-8">
                {/* Modal */}
                <CreateProposalModal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setEditingProposal(null);
                    }}
                    initialData={editingProposal}
                />

                {/* Filters and Actions Bar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-4 w-full md:w-auto md:min-w-[400px]">
                        <div className="relative flex-1">
                            <Input
                                placeholder="Buscar por cliente, proposta ou e-mail..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                icon={<Search size={20} className="text-gray-400" />}
                                className="bg-gray-50 border-gray-200 focus:bg-white focus:border-emidias-primary transition-colors"
                            />
                        </div>
                    </div>

                    {/* Mobile Create Button - Only show if not covered by TopBar actions (TopBar actions might be hidden on mobile depending on design)
                        My TopBar design keeps actions visible. So this might be redundant. 
                        But let's keep it if we think TopBar space is limited. 
                        Actually, TopBar actions are visible. Removing redundancy.
                    */}
                    {/* <Button ... className="sm:hidden" ... />  <- Removed */}
                </div>

                {/* Content */}
                <ProposalsTable
                    data={filteredProposals}
                    isLoading={loading}
                    showClientColumn={true}
                    onEdit={handleEditProposal}
                    onRowClick={(p) => handleOpenProposal(p.id)}
                    onDelete={handleDeleteProposta}
                    emptyMessage="Nenhuma proposta encontrada com os filtros selecionados."
                    emptyActionLabel="Criar Nova Proposta"
                    onEmptyAction={() => {
                        setEditingProposal(null);
                        setIsCreateModalOpen(true);
                    }}
                />
            </div>
        </MainLayout>
    );
}
