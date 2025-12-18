import { useState, useEffect } from 'react';
import { X, Loader2, Building2, DollarSign, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CreateProposalModal({ isOpen, onClose }: CreateProposalModalProps) {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const setCurrentView = useStore((state) => state.setCurrentView);

    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);

    // Form States
    const [selectedClientId, setSelectedClientId] = useState<number | ''>('');
    const [name, setName] = useState('');
    const [commission, setCommission] = useState('V4'); // Default for Internal

    // Load clients for internal users
    useEffect(() => {
        if (isOpen && user?.role !== 'client') {
            const loadClients = async () => {
                try {
                    const data = await api.getClientes();
                    setClients(data);
                } catch (error) {
                    console.error('Error loading clients:', error);
                }
            };
            loadClients();
        }
    }, [isOpen, user]);

    // Reset form when opening
    useEffect(() => {
        if (isOpen) {
            setName('');
            if (user?.role === 'client') {
                setSelectedClientId(user.client_id || ''); // Assuming user object has client_id
                setCommission('CLIENT');
            } else {
                setSelectedClientId('');
                setCommission('V4');
            }
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClientId || !name) return;

        try {
            setIsLoading(true);
            const payload = {
                id_cliente: Number(selectedClientId),
                nome: name,
                comissao: commission
            };

            const response = await api.createProposta(payload);

            if (response.success && response.id) {
                // Fetch full proposal details to set in store
                const fullProposal = await api.getProposta(response.id);
                setSelectedProposta(fullProposal);

                // Navigate to Map
                // If Client, add action=new to bypass redirect
                const url = user?.role === 'client' ? '/?action=new' : '/';
                router.push(url);
                setCurrentView('map');
                onClose();
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
            alert('Erro ao criar proposta. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scale-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-emidias-primary to-emidias-accent p-6 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <h2 className="text-2xl font-bold">Nova Proposta</h2>
                    <p className="text-white/80 text-sm mt-1">
                        {user?.role === 'client' ? 'Crie uma nova seleção de pontos' : 'Preencha os dados da proposta'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Client Selection (Internal Only) */}
                    {user?.role !== 'client' && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-emidias-gray-700 flex items-center gap-2">
                                <Building2 size={16} className="text-emidias-accent" />
                                Cliente
                            </label>
                            <select
                                value={selectedClientId}
                                onChange={(e) => setSelectedClientId(Number(e.target.value))}
                                className="w-full p-3 bg-emidias-gray-50 border border-emidias-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emidias-accent/50 transition-all font-medium"
                                required
                            >
                                <option value="" disabled>Selecione um cliente...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Proposal Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-emidias-gray-700 flex items-center gap-2">
                            <FileText size={16} className="text-emidias-accent" />
                            Nome da Proposta
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Campanha Verão 2025"
                            className="w-full p-3 bg-emidias-gray-50 border border-emidias-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emidias-accent/50 transition-all font-medium"
                            required
                        />
                    </div>

                    {/* Commission Selection (Internal Only) */}
                    {user?.role !== 'client' && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-emidias-gray-700 flex items-center gap-2">
                                <DollarSign size={16} className="text-emidias-accent" />
                                Tabela de Comissão
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {['V2', 'V3', 'V4'].map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setCommission(opt)}
                                        className={`p-3 rounded-xl border font-bold transition-all ${commission === opt
                                                ? 'bg-emidias-accent text-white border-emidias-accent shadow-lg scale-105'
                                                : 'bg-white text-emidias-gray-500 border-emidias-gray-200 hover:bg-emidias-gray-50'
                                            }`}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !selectedClientId || !name}
                        className="w-full py-4 bg-gradient-to-r from-emidias-primary to-emidias-accent text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={24} className="animate-spin" />
                                Criando...
                            </>
                        ) : (
                            'Iniciar Proposta'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
