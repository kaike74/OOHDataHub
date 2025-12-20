
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
    ArrowLeft, Plus, Calendar, Coins, FileText, Loader2, History, Trash2,
    MoreVertical, Search, Filter, TrendingUp, DollarSign, MapPin
} from 'lucide-react';
import { Proposta } from '@/lib/types';
import PropostaModal from './PropostaModal';
import HistoryModal from './HistoryModal';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { SafeImage } from '@/components/ui/SafeImage';

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

    // Filtered
    const filteredPropostas = propostas.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const totalValue = propostas.reduce((acc, curr) => acc + (curr.total_valor || 0), 0);
    const totalItems = propostas.reduce((acc, curr) => acc + (curr.total_itens || 0), 0);
    const activeProposals = propostas.filter(p => p.status === 'aprovada' || p.status === 'em_negociacao').length;

    if (!selectedCliente) return null;

    return (
        <div className="h-full flex flex-col bg-emidias-gray-50 overflow-hidden">
            {/* Header Section with Gradient */}
            <div className="bg-white border-b border-emidias-gray-200 shadow-sm relative z-10">
                <div className="max-w-7xl mx-auto px-6 py-6">
                    {/* Breadcrumb / Back */}
                    <button
                        onClick={handleBack}
                        className="group flex items-center gap-2 text-sm font-medium text-emidias-gray-500 hover:text-emidias-accent mb-6 transition-colors"
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
                            <div className="relative w-full sm:w-80">
                                <Input
                                    icon={<Search size={18} />}
                                    placeholder="Buscar propostas..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-gray-50 focus:bg-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area - CSS Grid */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <Skeleton className="h-10 w-10 rounded-xl" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                            <Skeleton className="h-8 w-8 rounded-lg" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-6 w-3/4 rounded-md" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full rounded-md" />
                                        <Skeleton className="h-4 w-5/6 rounded-md" />
                                    </div>
                                    <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                        <Skeleton className="h-8 w-full rounded-md" />
                                        <Skeleton className="h-8 w-full rounded-md" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredPropostas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-gray-300 animate-in fade-in zoom-in duration-500">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                                <FileText size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma proposta encontrada</h3>
                            <p className="text-gray-500 max-w-sm text-center mb-6">Comece criando uma nova campanha para este cliente.</p>
                            <button
                                onClick={() => setIsPropostaModalOpen(true)}
                                className="text-emidias-accent font-medium hover:underline"
                            >
                                Criar primeira proposta
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                            {filteredPropostas.map((proposta) => (
                                <div
                                    key={proposta.id}
                                    onClick={() => handlePropostaClick(proposta)}
                                    className="group relative bg-white rounded-2xl p-5 border border-gray-200 hover:border-emidias-accent/50 hover:shadow-xl hover:shadow-emidias-accent/5 cursor-pointer transition-all duration-300 flex flex-col"
                                >
                                    {/* Status Line */}
                                    <div className={`absolute top-0 inset-x-0 h-1 rounded-t-2xl transition-all ${proposta.status === 'aprovada' ? 'bg-green-500' :
                                        proposta.status === 'em_negociacao' ? 'bg-blue-500' : 'bg-gray-300'
                                        }`} />

                                    <div className="flex justify-between items-start mb-4 mt-2">
                                        <div className="p-2.5 bg-gray-50 rounded-xl group-hover:bg-emidias-accent/10 group-hover:text-emidias-accent transition-colors">
                                            <FileText size={24} />
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedHistoryId(proposta.id);
                                                }}
                                                className="p-2 text-gray-400 hover:text-emidias-accent hover:bg-emidias-accent/10 rounded-lg transition-colors"
                                                title="Histórico de alterações"
                                            >
                                                <History size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteProposta(proposta.id, e)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Mover para lixeira"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-emidias-accent transition-colors mb-2 line-clamp-1">
                                        {proposta.nome}
                                    </h3>

                                    <div className="space-y-3 mb-6 flex-1">
                                        <div className="flex items-center text-sm text-gray-500 gap-2">
                                            <Calendar size={14} className="text-gray-400" />
                                            Criado em {new Date(proposta.created_at).toLocaleDateString()}
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Status</span>
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider ${proposta.status === 'aprovada'
                                                ? 'bg-green-100 text-green-700'
                                                : proposta.status === 'em_negociacao'
                                                    ? 'bg-blue-100 text-blue-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {proposta.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500">Comissão</span>
                                            <span className="font-medium text-gray-900 bg-gray-100 px-2 rounded">{proposta.comissao}</span>
                                        </div>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 mb-0.5">Pontos</p>
                                            <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                                                <MapPin size={14} className="text-emidias-accent/60" />
                                                {proposta.total_itens || 0}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-400 mb-0.5">Valor Est.</p>
                                            <div className="flex items-center justify-end gap-1.5 font-semibold text-gray-900">
                                                {(proposta.total_valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
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
