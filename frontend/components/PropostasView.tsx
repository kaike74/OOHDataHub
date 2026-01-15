
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
    ArrowLeft, Plus, Calendar, Coins, FileText, Loader2, History, Trash2,
    MoreVertical, Search, Filter, TrendingUp, DollarSign, MapPin, Building2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Proposta } from '@/lib/types';
import PropostaModal from './PropostaModal';
import HistoryModal from './HistoryModal';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { SafeImage } from '@/components/ui/SafeImage';
import ProposalsTable from '@/components/ProposalsTable';

// Extended type for frontend usage with stats
interface ExtendedProposta extends Proposta {
    total_itens?: number;
    total_valor?: number;
}


interface PropostasViewProps {
    isModalOpen?: boolean;
    onCloseModal?: () => void;
    searchTerm?: string;
}

export default function PropostasView({ isModalOpen, onCloseModal, searchTerm = '' }: PropostasViewProps) {
    const [propostas, setPropostas] = useState<ExtendedProposta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Use internal state synchronized with prop for modal
    const [internalModalOpen, setInternalModalOpen] = useState(false);

    useEffect(() => {
        if (isModalOpen) setInternalModalOpen(true);
    }, [isModalOpen]);

    const handleCloseModal = () => {
        setInternalModalOpen(false);
        if (onCloseModal) onCloseModal();
    };

    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
    // Removed local searchTerm state

    const selectedCliente = useStore((state) => state.selectedCliente);
    const setSelectedCliente = useStore((state) => state.setSelectedCliente);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const user = useStore((state) => state.user);

    useEffect(() => {
        loadPropostas();
    }, [selectedCliente]);

    const loadPropostas = async () => {
        try {
            setIsLoading(true);
            // If selectedCliente, fetch theirs. Else fetch all (global view)
            const response = selectedCliente
                ? await api.getClientProposals(selectedCliente.id)
                : await api.getAdminProposals();

            if (response) {
                setPropostas(response);
            }
        } catch (error) {
            console.error('Erro ao carregar propostas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const router = useRouter();

    const handleBack = () => {
        setSelectedCliente(null);
        router.push('/clientes');
    };

    const handlePropostaClick = (proposta: Proposta) => {
        // We navigate to the dedicated proposal page with correct params
        const uid = user?.id ? `uid=${user.id}&` : '';
        const id = proposta.public_token || proposta.id;
        router.push(`/propostas?${uid}id=${id}`);
    };

    const handleDeleteProposta = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Deseja mover esta proposta para a lixeira?')) return;

        try {
            await api.deleteProposta(id);
            setPropostas(current => current.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error deleting proposal:', error);
            alert('Falha ao excluir proposta');
        }
    };

    // Check user role for commission visibility correction (already hooked above)

    // Filtered and Sorted
    const filteredPropostas = propostas
        .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

    // Stats
    const totalValue = propostas.reduce((acc, curr) => acc + (curr.total_valor || 0), 0);
    const totalItems = propostas.reduce((acc, curr) => acc + (curr.total_itens || 0), 0);

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            {/* Sub-header with Search (REMOVED - Lifted to TopBar) */}


            {/* Content Area - Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                <div className="w-full max-w-[1920px] mx-auto">
                    {/* If we have a client selected to show context, maybe keep a small banner? 
                        For now, removing big header to fit MainLayout standard. */}

                    {selectedCliente && (
                        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                                    {selectedCliente.logo_url ? (
                                        <SafeImage
                                            src={api.getImageUrl(selectedCliente.logo_url)}
                                            alt={selectedCliente.nome}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="text-gray-400" />
                                    )}
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">{selectedCliente.nome}</h2>
                                    <p className="text-xs text-gray-500">Filtrando propostas deste cliente</p>
                                </div>
                            </div>
                            <Button onClick={handleBack} variant="ghost" size="sm" leftIcon={<ArrowLeft size={16} />}>
                                Ver todos
                            </Button>
                        </div>
                    )}

                    <ProposalsTable
                        data={filteredPropostas}
                        isLoading={isLoading}
                        showClientColumn={!selectedCliente}
                        onEdit={(item) => handlePropostaClick(item as unknown as Proposta)}
                        onRowClick={(item) => handlePropostaClick(item as unknown as Proposta)}
                        onDelete={handleDeleteProposta}
                        onHistory={(id, e) => {
                            e.stopPropagation();
                            setSelectedHistoryId(id);
                        }}
                        emptyMessage="Nenhuma proposta encontrada."
                        emptyActionLabel="Criar proposta"
                        onEmptyAction={() => setInternalModalOpen(true)}
                    />
                </div>
            </div>

            <PropostaModal
                isOpen={internalModalOpen}
                onClose={handleCloseModal}
                clienteId={selectedCliente?.id || 0} // 0 triggers selection inside modal if supported or handles error
                onSuccess={(newProposta) => {
                    loadPropostas();
                    handlePropostaClick(newProposta);
                    handleCloseModal();
                }}
            />

            <HistoryModal
                isOpen={!!selectedHistoryId}
                onClose={() => setSelectedHistoryId(null)}
                type="proposals"
                id={selectedHistoryId || 0}
            />
        </div>
    );
}
