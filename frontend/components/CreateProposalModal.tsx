
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
    const [selectedClientId, setSelectedClientId] = useState<number | 'pessoal' | ''>('');
    const [name, setName] = useState('');
    const [commission, setCommission] = useState('V4'); // Default for Internal

    const [isPersonal, setIsPersonal] = useState(false); // Toggle for "Pessoal" vs "Linked Client"

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
                    setIsPersonal(false);
                    setSelectedClientId(initialData.id_cliente);
                } else {
                    setIsPersonal(true);
                    setSelectedClientId(''); // Or keep it empty
                }

                setCommission((initialData.comissao as any) || 'V4');
            } else {
                // Create Mode
                setName('');

                if (initialClientId) {
                    setIsPersonal(false);
                    setSelectedClientId(Number(initialClientId));
                } else if (user?.role === 'client') {
                    // Default to Personal for clients? User said "Pessoal ... quando pessoa não quer definir"
                    // Maybe default to Linked if they have clients, else Personal?
                    // Let's default to Personal to be safe/simple, or stick to previous logic?
                    // User said "não consigo selecionar a opção pessoal".
                    // Let's default to Personal = false (Linked) if they have clients, so they see list.
                    // But if they want Personal, they toggle.
                    setIsPersonal(false);
                    setSelectedClientId('');
                } else {
                    setIsPersonal(false);
                    setSelectedClientId('');
                }

                if (user?.role === 'client') {
                    setCommission('V0');
                } else {
                    setCommission('V4');
                }
            }
        }
    }, [isOpen, user, initialClientId, initialData]);

    // Auto-select client if user is client and only has one (or if distinct 'pessoal' handling needed)
    useEffect(() => {
        if (isOpen && !isEditing && user?.role === 'client' && clients.length > 0 && !selectedClientId && !isPersonal) {
            // If client user has clients, default to the first one instead of 'pessoal'
            setSelectedClientId(clients[0].id);
        }
    }, [isOpen, isEditing, user, clients, selectedClientId, isPersonal]);


    const handleClientChange = (value: string) => {
        if (value === 'create_new') {
            setIsClientModalOpen(true);
            return;
        }
        setSelectedClientId(Number(value));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation: 
        // If NOT Personal, Client ID is required.
        if (!isPersonal && !selectedClientId) return;
        if (!name) return;

        try {
            setIsLoading(true);

            // If Personal, id_cliente is null. Else use selected ID.
            const finalClientId = isPersonal ? null : Number(selectedClientId);

            const payload = {
                id_cliente: finalClientId,
                nome: name,
                comissao: user?.role === 'client' ? 'V0' : commission
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

                    const url = user?.role === 'client' ? '/?action=new' : '/';
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
                setSelectedClientId(newestClient.id);
                setIsPersonal(false); // Ensure we are in linked mode
            }
        }, 300);
    };

    const footer = (
        <Button
            type="submit"
            form="create-proposal-form"
            isLoading={isLoading}
            disabled={(!isPersonal && !selectedClientId) || !name}
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
                subtitle={isEditing ? "Atualize os dados da proposta" : (user?.role === 'client' ? 'Crie uma nova seleção de pontos' : 'Preencha os dados da proposta')}
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
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <Building2 size={16} className="text-emidias-accent" />
                                Cliente
                            </span>

                            {/* Toggle Switch UI */}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPersonal(!isPersonal);
                                    if (!isPersonal) setSelectedClientId(''); // Clear if switching to personal
                                }}
                                className={`text-xs px-2 py-1 rounded-lg border transition-colors ${isPersonal
                                    ? 'bg-emidias-accent text-white border-emidias-accent'
                                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                            >
                                {isPersonal ? 'Sem Vínculo (Pessoal)' : 'Vincular Cliente'}
                            </button>
                        </label>

                        {!isPersonal ? (
                            <Select
                                value={String(selectedClientId)}
                                onChange={(e) => handleClientChange(e.target.value)}
                                required
                            >
                                <option value="" disabled>Selecione um cliente...</option>

                                {clients.length > 0 && <optgroup label="Meus Clientes">
                                    {clients.map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.nome}
                                        </option>
                                    ))}
                                </optgroup>}

                                <option value="create_new" className="text-emidias-accent font-semibold">
                                    + Criar Novo Cliente
                                </option>
                            </Select>
                        ) : (
                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-gray-500 text-sm italic text-center">
                                Esta proposta será criada como "Pessoal" e não estará vinculada a nenhum cliente específico.
                            </div>
                        )}
                    </div>

                    {/* Commission Field - HIDE for Clients, SHOW for Internal */}
                    {user?.role !== 'client' && (
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <DollarSign size={16} className="text-emidias-accent" />
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
