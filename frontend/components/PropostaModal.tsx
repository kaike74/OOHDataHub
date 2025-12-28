
import { useState, useEffect } from 'react';
import { X, Loader2, Coins, Building2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Proposta, Cliente } from '@/lib/types';
import { api } from '@/lib/api';
import ClientModal from './ClientModal';

interface PropostaModalProps {
    isOpen: boolean;
    onClose: () => void;
    clienteId?: number;
    onSuccess: (proposta: Proposta) => void;
}

export default function PropostaModal({ isOpen, onClose, clienteId, onSuccess }: PropostaModalProps) {
    const [nome, setNome] = useState('');
    const [comissao, setComissao] = useState<'V2' | 'V3' | 'V4'>('V2');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Client Selection State
    const [availableClientes, setAvailableClientes] = useState<Cliente[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<number | string>(clienteId || '');
    const [isLoadingClients, setIsLoadingClients] = useState(false);
    const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setNome('');
            setComissao('V2');

            // If valid clienteId is passed, use it. Otherwise reset selection.
            if (clienteId && clienteId > 0) {
                setSelectedClientId(clienteId);
            } else {
                setSelectedClientId('');
                loadClientes();
            }
        }
    }, [isOpen, clienteId]);

    const loadClientes = async () => {
        try {
            setIsLoadingClients(true);
            const data = await api.getClientes();
            setAvailableClientes(data);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setIsLoadingClients(false);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Interpret 'personal' (value 0) as null for backend if needed, or specific ID.
        // Assuming backend handles optional id_cliente or specific '0' as personal.
        // If backend REQUIRES id_cliente, 'Personal' concept needs backend support.
        // Assuming user means "Without associating to a specific client company".
        // Let's send null if value is 0.

        const finalClientId = Number(selectedClientId);

        // Allow 0 (Personal) but block empty if not strict 0 check
        if (selectedClientId === '' || (selectedClientId !== 0 && !finalClientId)) {
            alert('Por favor, selecione um cliente ou "Pessoal".');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await api.createProposta({
                id_cliente: finalClientId === 0 ? undefined : finalClientId,
                nome,
                comissao
            });

            const newProposta: Proposta = {
                id: result.id,
                id_cliente: finalClientId,
                nome,
                comissao,
                status: 'rascunho',
                created_at: new Date().toISOString()
            };
            onSuccess(newProposta);
            onClose();
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao criar proposta. Tente novamente.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'new') {
            setIsNewClientModalOpen(true);
            setSelectedClientId(''); // Reset or keep previous while creating? Reset to force selection later.
        } else {
            setSelectedClientId(Number(val));
        }
    };

    const handleClientCreated = async () => {
        await loadClientes();
        // Optionally select the last created one if we could identify it.
        // For now, just refresh list.
        setIsNewClientModalOpen(false);
    };

    const showClientSelect = !clienteId || clienteId === 0;

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900">Nova Proposta</h2>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Client Selection (Conditional) */}
                        {showClientSelect && (
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                    <Building2 size={16} className="text-gray-400" />
                                    Cliente
                                </label>
                                {isLoadingClients ? (
                                    <div className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" />
                                        Carregando clientes...
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={selectedClientId}
                                        onChange={handleClientChange}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none bg-white appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>Selecione um cliente...</option>
                                        <option value={0}>👤 Pessoal (Sem Cliente)</option>
                                        <option value="new" className="font-bold text-emidias-accent">+ Cadastrar Novo Cliente</option>
                                        <hr />
                                        {availableClientes.map(cliente => (
                                            <option key={cliente.id} value={cliente.id}>
                                                {cliente.nome}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Nome da Proposta</label>
                            <input
                                type="text"
                                required
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none"
                                placeholder="Ex: Campanha Verão 2025"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Comissão</label>
                            <div className="grid grid-cols-3 gap-3">
                                {(['V2', 'V3', 'V4'] as const).map((opt) => (
                                    <button
                                        key={opt}
                                        type="button"
                                        onClick={() => setComissao(opt)}
                                        className={`py-3 px-4 rounded-xl border font-semibold transition-all flex flex-col items-center gap-1 ${comissao === opt
                                            ? 'bg-emidias-accent text-white border-emidias-accent shadow-lg shadow-emidias-accent/20'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-emidias-accent/50 hover:bg-gray-50'
                                            }`}
                                    >
                                        <span className="text-lg">{opt}</span>
                                        <span className="text-[10px] opacity-80 font-normal">
                                            {opt === 'V2' ? '+25%' : opt === 'V3' ? '+56%' : '+95%'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting || (selectedClientId === '' && showClientSelect)}
                                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-emidias-accent hover:bg-emidias-accent-dark shadow-lg shadow-emidias-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar e Abrir Mapa'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Inline Client Creation Modal */}
            <ClientModal
                isOpen={isNewClientModalOpen}
                onClose={() => setIsNewClientModalOpen(false)}
                onSuccess={handleClientCreated}
            />
        </>
    );
}
