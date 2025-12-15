
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { ArrowLeft, Plus, Calendar, Coins, FileText, Loader2 } from 'lucide-react';
import { Proposta } from '@/lib/types';
import PropostaModal from './PropostaModal';
import { api } from '@/lib/api';

export default function PropostasView() {
    const [propostas, setPropostas] = useState<Proposta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPropostaModalOpen, setIsPropostaModalOpen] = useState(false);

    const selectedCliente = useStore((state) => state.selectedCliente);
    const setSelectedCliente = useStore((state) => state.setSelectedCliente);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const token = useStore((state) => state.token);

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
                // api.getClientProposals returns the JSON directly now? 
                // Wait, api.ts fetchAPI returns `response.json()`.
                // So `response` is the data array.
                // NOTE: fetchAPIHelper usually returns parsed JSON.
                // Let's assume it returns the array or object.
                // Checking api.ts: `return response.json()`.
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

    const handlePropostaClick = (proposta: Proposta) => {
        setSelectedProposta(proposta);
        // Switch to the Cart View (Map + Cart)
        // Wait, currentView 'propostas' is THIS view.
        // I need a new view for the actual editing/cart.
        // Let's call it 'carrinho' or 'mapa_proposta'.
        // The store definition has map | exibidoras | clientes | propostas.
        // Maybe 'propostas' is the list, and 'map' (with selectedProposta set) is the cart view?
        // Logic: If selectedProposta is set AND view is map, show cart.
        // Let's reuse 'map' view but with Cart overlay.
        setCurrentView('map');
    };

    if (!selectedCliente) return null;

    return (
        <div className="h-full flex flex-col bg-emidias-gray-50">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-emidias-gray-200 px-6 py-4">
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 text-emidias-gray-500 hover:text-emidias-accent mb-4 transition-colors"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar para Clientes</span>
                </button>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {selectedCliente.logo_url && (
                            <img src={api.getImageUrl(selectedCliente.logo_url)} alt="Logo" className="w-12 h-12 object-contain" />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold text-emidias-gray-900">Propostas: {selectedCliente.nome}</h1>
                            <p className="text-emidias-gray-500 text-sm">{propostas.length} propostas cadastradas</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsPropostaModalOpen(true)}
                        className="btn-base btn-primary flex items-center gap-2"
                    >
                        <Plus size={20} />
                        <span>Nova Proposta</span>
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-emidias-accent" size={32} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {/* Table Header */}
                        <div className="grid grid-cols-5 gap-4 px-4 py-2 text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">
                            <div className="col-span-2">Nome</div>
                            <div>Comissão</div>
                            <div>Status</div>
                            <div className="text-right">Data</div>
                        </div>

                        {propostas.map((proposta) => (
                            <div
                                key={proposta.id}
                                onClick={() => handlePropostaClick(proposta)}
                                className="bg-white rounded-xl p-4 border border-emidias-gray-200 hover:border-emidias-accent hover:shadow-emidias-md cursor-pointer transition-all grid grid-cols-5 gap-4 items-center group"
                            >
                                <div className="col-span-2 font-semibold text-emidias-gray-900 group-hover:text-emidias-accent flex items-center gap-3">
                                    <FileText size={18} className="text-emidias-gray-400 group-hover:text-emidias-accent" />
                                    {proposta.nome}
                                </div>
                                <div className="flex items-center gap-2 text-emidias-gray-600">
                                    <Coins size={16} />
                                    <span className="badge badge-gray">{proposta.comissao}</span>
                                </div>
                                <div>
                                    <span className={`badge ${proposta.status === 'rascunho' ? 'badge-warning' : 'badge-success'}`}>
                                        {proposta.status}
                                    </span>
                                </div>
                                <div className="text-right text-emidias-gray-500 text-sm flex items-center justify-end gap-2">
                                    <Calendar size={14} />
                                    {new Date(proposta.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}

                        {propostas.length === 0 && (
                            <div className="text-center py-12 text-emidias-gray-400">
                                <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                <p>Nenhuma proposta encontrada.</p>
                                <p className="text-sm">Crie uma nova proposta para começar.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <PropostaModal
                isOpen={isPropostaModalOpen}
                onClose={() => setIsPropostaModalOpen(false)}
                clienteId={selectedCliente.id}
                onSuccess={(newProposta) => {
                    loadPropostas();
                    handlePropostaClick(newProposta); // Auto-open cart
                }}
            />
        </div>
    );
}
