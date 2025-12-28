
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
    ArrowLeft, Plus, Calendar, Coins, FileText, Loader2, History, Trash2,
    MoreVertical, Search, Filter, TrendingUp, DollarSign, MapPin, List, LayoutGrid
} from 'lucide-react';
import { Proposta } from '@/lib/types';
import PropostaModal from './PropostaModal';
import HistoryModal from './HistoryModal';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { SafeImage } from '@/components/ui/SafeImage';
import ProposalsTable from '@/components/ProposalsTable';
import ProposalsKanban from '@/components/ProposalsKanban';

// Extended type for frontend usage with stats
interface ExtendedProposta extends Proposta {
    total_itens?: number;
    total_valor?: number;
}

export default function PropostasView() {
    const [propostas, setPropostas] = useState<ExtendedProposta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPropostaModalOpen, setIsPropostaModalOpen] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

    const selectedCliente = useStore((state) => state.selectedCliente);
    const setSelectedCliente = useStore((state) => state.setSelectedCliente);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);

    useEffect(() => {
        if (selectedCliente) {
            loadPropostas();
        }
    }, [selectedCliente]);

    const loadPropostas = async () => {
        if (!selectedCliente) return;

        try {
            setIsLoading(true);
            const response = await api.getClientProposals(selectedCliente.id);
            if (response) {
                setPropostas(response);
            }
        } catch (error) {
            console.error('Erro ao carregar propostas:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setSelectedCliente(null);
        setCurrentView('clientes');
    };

    const handlePropostaClick = async (proposta: Proposta) => {
        try {
            setIsLoading(true);
            const fullProposta = await api.getProposta(proposta.id);
            if (!fullProposta.itens) fullProposta.itens = [];
            setSelectedProposta(fullProposta);
            setCurrentView('map');
        } catch (error) {
            console.error('Erro ao carregar detalhes da proposta:', error);
            setSelectedProposta(proposta);
            setCurrentView('map');
        } finally {
            setIsLoading(false);
        }
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

    // Check user role for commission visibility correction
    const user = useStore((state) => state.user);

    // Filtered and Sorted
    const filteredPropostas = propostas
        .filter(p => p.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

    // Stats
    const totalValue = propostas.reduce((acc, curr) => acc + (curr.total_valor || 0), 0);
    const totalItems = propostas.reduce((acc, curr) => acc + (curr.total_itens || 0), 0);

    if (!selectedCliente) return null;

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 shadow-sm relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Breadcrumb / Back */}
                    <button
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-emidias-accent mb-6 transition-colors"
                    >
                        <div className="p-1 rounded-full bg-gray-100 group-hover:bg-emidias-accent/10 transition-colors">
                            <ArrowLeft size={16} />
                        </div>
                        <span>Voltar para Clientes</span>
                    </button>

                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex items-start gap-5">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-emidias-accent/20 rounded-2xl blur-lg group-hover:blur-xl transition-all opacity-0 group-hover:opacity-100" />
                                <div className="relative w-20 h-20 rounded-2xl bg-white border border-gray-100 shadow-lg p-2 flex items-center justify-center overflow-hidden">
                                    {selectedCliente.logo_url ? (
                                        <SafeImage
                                            src={api.getImageUrl(selectedCliente.logo_url)}
                                            alt="Logo"
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-3xl font-bold text-gray-300">{selectedCliente.nome.substring(0, 2).toUpperCase()}</span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{selectedCliente.nome}</h1>
                                <p className="text-gray-500 mt-1 flex items-center gap-2">
                                    Gerenciamento de Campanhas OOH
                                </p>

                                <div className="flex items-center gap-4 mt-4 text-sm">
                                    <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-100 flex items-center gap-2">
                                        <FileText size={14} />
                                        {propostas.length} Propostas
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-green-50 text-green-700 font-medium border border-green-100 flex items-center gap-2">
                                        <Coins size={14} />
                                        {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Total (Est.)
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 w-full md:w-auto">
                            <Button
                                onClick={() => setIsPropostaModalOpen(true)}
                                size="lg"
                                leftIcon={<Plus size={20} className="stroke-[3px]" />}
                                className="shadow-lg shadow-emidias-accent/20 hover:shadow-emidias-accent/40"
                            >
                                Criar Nova Proposta
                            </Button>
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg border border-gray-200">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    title="Visualização em Lista"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('kanban')}
                                    className={`p-2 rounded-md transition-all ${viewMode === 'kanban' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}
                                    title="Visualização em Kanban"
                                >
                                    <LayoutGrid size={18} />
                                </button>
                            </div>
                            <div className="relative w-full sm:w-60">
                                <Input
                                    icon={<Search size={18} />}
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-50 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin bg-gray-50/50">
                <div className="w-full max-w-[1920px] mx-auto h-full">
                    {viewMode === 'list' ? (
                        <ProposalsTable
                            data={filteredPropostas}
                            isLoading={isLoading}
                            showClientColumn={false}
                            onEdit={(item) => handlePropostaClick(item as unknown as Proposta)}
                            onRowClick={(item) => handlePropostaClick(item as unknown as Proposta)}
                            onDelete={handleDeleteProposta}
                            onHistory={(id, e) => {
                                e.stopPropagation();
                                setSelectedHistoryId(id);
                            }}
                            emptyMessage="Nenhuma proposta encontrada para este cliente"
                            emptyActionLabel="Criar primeira proposta"
                            onEmptyAction={() => setIsPropostaModalOpen(true)}
                        />
                    ) : (
                        <ProposalsKanban
                            data={filteredPropostas as any} // Cast safely
                            isLoading={isLoading}
                            onEdit={(item) => handlePropostaClick(item as unknown as Proposta)}
                            onDelete={handleDeleteProposta}
                            onHistory={(id, e) => {
                                e.stopPropagation();
                                setSelectedHistoryId(id);
                            }}
                        />
                    )}
                </div>
            </div>

            <PropostaModal
                isOpen={isPropostaModalOpen}
                onClose={() => setIsPropostaModalOpen(false)}
                clienteId={selectedCliente.id}
                onSuccess={(newProposta) => {
                    loadPropostas();
                    handlePropostaClick(newProposta);
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
