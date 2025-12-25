
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

            {/* Content Area - Table */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                <div className="max-w-7xl mx-auto">
                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-xl" />
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
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Proposta</th>
                                            {/* Hide Commission for External Users */}
                                            {user?.role !== 'client' && (
                                                <th className="px-6 py-4">Comissão</th>
                                            )}
                                            <th className="px-6 py-4">Criado em</th>
                                            <th className="px-6 py-4 text-center">Pontos</th>
                                            <th className="px-6 py-4 text-right">Valor Est.</th>
                                            <th className="px-6 py-4 text-right">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredPropostas.map((proposta) => (
                                            <tr
                                                key={proposta.id}
                                                onClick={() => handlePropostaClick(proposta)}
                                                className="group hover:bg-emidias-accent/5 transition-colors cursor-pointer"
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${proposta.status === 'aprovada'
                                                            ? 'bg-green-100 text-green-700'
                                                            : proposta.status === 'em_negociacao'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${proposta.status === 'aprovada' ? 'bg-green-500' :
                                                                proposta.status === 'em_negociacao' ? 'bg-blue-500' : 'bg-yellow-500'
                                                            }`} />
                                                        {proposta.status.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-gray-900 group-hover:text-emidias-accent transition-colors">
                                                        {proposta.nome}
                                                    </div>
                                                </td>

                                                {/* Hide Commission for External Users */}
                                                {user?.role !== 'client' && (
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="font-mono text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                            {proposta.comissao}
                                                        </span>
                                                    </td>
                                                )}

                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(proposta.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700">
                                                        <MapPin size={14} className="text-gray-400" />
                                                        {proposta.total_itens || 0}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span className="font-semibold text-gray-900">
                                                        {(proposta.total_valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedHistoryId(proposta.id);
                                                            }}
                                                            className="p-2 text-gray-400 hover:text-emidias-accent hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                                            title="Histórico de alterações"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDeleteProposta(proposta.id, e)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                                            title="Mover para lixeira"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
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
