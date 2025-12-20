import { useState, useEffect } from 'react';
import { Building2, DollarSign, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialClientId?: number;
    initialClientName?: string;
}

export default function CreateProposalModal({ isOpen, onClose, initialClientId, initialClientName }: CreateProposalModalProps) {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const setCurrentView = useStore((state) => state.setCurrentView);

    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [error, setError] = useState('');

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
            setError('');
            setName('');
            console.log('User when opening modal:', user);
            console.log('Initial Client ID passed:', initialClientId);

            if (user?.role === 'client') {
                if (initialClientId !== undefined && initialClientId !== null) {
                    setSelectedClientId(Number(initialClientId));
                    setCommission('V0'); // Strict V0 for Clients
                } else {
                    console.error('Client user tried to create proposal without specifying client.');
                    setError('Erro: Cliente não especificado.');
                }
            } else {
                setSelectedClientId('');
                setCommission('V4');
            }
        }
    }, [isOpen, user, initialClientId]);

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
                const fullProposal = await api.getProposta(response.id);
                setSelectedProposta(fullProposal);

                const url = user?.role === 'client' ? '/?action=new' : '/';
                router.push(url);
                setCurrentView('map');
                onClose();
            }
        } catch (error) {
            console.error('Error creating proposal:', error);
            setError('Erro ao criar proposta. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const footer = (
        <Button
            type="submit"
            form="create-proposal-form"
            isLoading={isLoading}
            disabled={!selectedClientId || !name}
            className="w-full"
        >
            Iniciar Proposta
        </Button>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Nova Proposta"
            subtitle={user?.role === 'client' ? 'Crie uma nova seleção de pontos' : 'Preencha os dados da proposta'}
            footer={footer}
        >
            <form id="create-proposal-form" onSubmit={handleSubmit} className="space-y-6">

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                        {error}
                    </div>
                )}

                <Select
                    label="Cliente"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(Number(e.target.value))}
                    required
                    disabled={user?.role === 'client'}
                    icon={<Building2 size={16} />}
                >
                    <option value="" disabled>Selecione um cliente...</option>
                    {user?.role === 'client' ? (
                        <option value={selectedClientId}>
                            {clients.find(c => c.id === selectedClientId)?.nome ||
                                (user as any)?.client_name ||
                                'Cliente Selecionado'}
                        </option>
                    ) : (
                        clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.nome}
                            </option>
                        ))
                    )}
                </Select>

                <Input
                    label="Nome da Proposta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Campanha Verão 2025"
                    required
                    icon={<FileText size={16} />}
                />

                <div className="space-y-2">
                    <label className="text-sm font-semibold text-emidias-gray-700 flex items-center gap-2">
                        <DollarSign size={16} className="text-emidias-accent" />
                        Tabela de Comissão
                    </label>
                    {user?.role === 'client' ? (
                        <div className="w-full p-3 bg-emidias-gray-100 border border-emidias-gray-200 rounded-xl font-medium text-emidias-gray-600 cursor-not-allowed flex items-center justify-between">
                            <span>Tabela Cliente (V0)</span>
                            <span className="text-xs bg-emidias-gray-200 px-2 py-1 rounded text-emidias-gray-500">Padrão</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-3 gap-3">
                            {['V2', 'V3', 'V4'].map((opt) => (
                                <Button
                                    key={opt}
                                    type="button"
                                    variant={commission === opt ? 'primary' : 'outline'}
                                    onClick={() => setCommission(opt)}
                                    className={commission !== opt ? "bg-white hover:bg-gray-50" : ""}
                                >
                                    {opt}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </form>
        </Modal>
    );
}
