
import { useState, useEffect } from 'react';
import { Building2, DollarSign, FileText, Plus, User as UserIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import ClientModal from '@/components/ClientModal';
import { Proposta } from '@/lib/types';

interface CreateProposalModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialClientId?: number;
    initialClientName?: string;
    initialData?: Proposta | null; // For Edit Mode
}

export default function CreateProposalModal({ isOpen, onClose, initialClientId, initialClientName, initialData }: CreateProposalModalProps) {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const setCurrentView = useStore((state) => state.setCurrentView);

    const [isLoading, setIsLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [error, setError] = useState('');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    // Form States
    // Use string type to handle 'pessoal' (no client) and numeric IDs as strings
    const [selectedClientId, setSelectedClientId] = useState<string>('');
    const [name, setName] = useState('');
    const [commission, setCommission] = useState('V4'); // Default for Internal

    const isEditing = !!initialData;

    const loadClients = async () => {
        try {
            const data = await api.getClientes();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    };

    // Load clients for ALL users (API now handles filtering)
    useEffect(() => {
        if (isOpen) {
            loadClients();
        }
    }, [isOpen]);

    // Reset form when opening or changing initialData
    useEffect(() => {
        if (isOpen) {
            setError('');

            if (initialData) {
                // Edit Mode
                setName(initialData.nome);

                if (initialData.id_cliente) {
                    setSelectedClientId(String(initialData.id_cliente));
                } else {
                    setSelectedClientId('pessoal'); // Null client = Pessoal
                }

                setCommission((initialData.comissao as any) || 'V4');
            } else {
                // Create Mode
                setName('');

                if (initialClientId) {
                    setSelectedClientId(String(initialClientId));
                } else if (user?.type === 'external') {
                    // Default to first client if available?
                    // Or force user to choose?
                    // Let's force choice or default to 'pessoal' if requested, implies intentional selection.
                    // Making empty initially forces user to pick.
                    setSelectedClientId('');
                } else {
                    setSelectedClientId('');
                }

                if (user?.type === 'external') {
                    setCommission('V0');
                } else {
                    setCommission('V4');
                }
            }
        }
    }, [isOpen, user, initialClientId, initialData]);

    // Auto-select client if user is client and only has one (or if distinct 'pessoal' handling needed)
    useEffect(() => {
        if (isOpen && !isEditing && user?.type === 'external' && clients.length > 0 && !selectedClientId) {
            // If client user has clients, default to the first one instead of 'pessoal'
            setSelectedClientId(String(clients[0].id));
        }
    }, [isOpen, isEditing, user, clients, selectedClientId]);


    const handleClientChange = (value: string) => {
        if (value === 'create_new') {
            setIsClientModalOpen(true);
            return;
        }
        setSelectedClientId(value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: Required selection
        if (!selectedClientId) return;
        if (!name) return;

        try {
            setIsLoading(true);

            // "Pessoal" means null id_cliente. Else use selected ID.
            const finalClientId = selectedClientId === 'pessoal' ? null : Number(selectedClientId);

            const payload = {
                id_cliente: finalClientId,
                nome: name,
                comissao: user?.type === 'external' ? 'V0' : commission
            };

            if (isEditing && initialData) {
                // UPDATE
                await api.updateProposta(initialData.id, payload);
                onClose();
                window.location.reload();
            } else {
                // CREATE
                const response = await api.createProposta(payload);

                if (response.success && response.id) {
                    const fullProposal = await api.getProposta(response.id);
                    setSelectedProposta(fullProposal);

                    const url = user?.type === 'external' ? '/?action=new' : '/';
                    router.push(url);
                    setCurrentView('map');
                    onClose();
                }
            }
        } catch (error) {
            console.error('Error saving proposal:', error);
            setError('Erro ao salvar proposta. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClientSuccess = async () => {
        await loadClients();
        setIsClientModalOpen(false);

        // Auto-select the newest client
        setTimeout(async () => {
            const updatedClients = await api.getClientes();
            if (updatedClients && updatedClients.length > 0) {
                const newestClient = updatedClients[updatedClients.length - 1];
                setSelectedClientId(String(newestClient.id));
            }
        }, 300);
    };

    const footer = (
        <Button
            type="submit"
            form="create-proposal-form"
            isLoading={isLoading}
            disabled={!selectedClientId || !name}
            className="w-full"
        >
            {isEditing ? 'Salvar Alterações' : 'Iniciar Proposta'}
        </Button>
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={isEditing ? "Editar Proposta" : "Nova Proposta"}
                subtitle={isEditing ? "Atualize os dados da proposta" : (user?.type === 'external' ? 'Crie uma nova seleção de pontos' : 'Preencha os dados da proposta')}
                footer={footer}
                zIndex={50}
            >
                <form id="create-proposal-form" onSubmit={handleSubmit} className="space-y-6">

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <Input
                        label="Nome da Proposta"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Campanha Verão 2025"
                        required
                        icon={<FileText size={16} />}
                    />

                    {/* Client Selection Logic */}
                    <Select
                        label="Cliente"
                        value={selectedClientId}
                        onChange={(e) => handleClientChange(e.target.value)}
                        required
                        icon={<Building2 size={16} />}
                    >
                        <option value="" disabled>Selecione um cliente...</option>

                        {/* Always show Pessoal option */}
                        <option value="pessoal">📂 Pessoal (Sem Cliente Vinculado)</option>

                        {clients.length > 0 && <optgroup label="Meus Clientes">
                            {clients.map(client => (
                                <option key={client.id} value={client.id}>
                                    {client.nome}
                                </option>
                            ))}
                        </optgroup>}

                        <option value="create_new" className="text-plura-accent font-semibold">
                            + Criar Novo Cliente
                        </option>
                    </Select>

                    {/* Commission Field - HIDE for Clients, SHOW for Internal */}
                    {user?.type !== 'external' && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <DollarSign size={16} className="text-plura-accent" />
                                Tabela de Comissão
                            </label>
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
                        </div>
                    )}
                </form>
            </Modal>

            <ClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSuccess={handleClientSuccess}
            />
        </>
    );
}
