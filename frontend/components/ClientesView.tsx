import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Cliente } from '@/lib/types';
import ClientModal from './ClientModal';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import ClientsTable from './clients/ClientsTable';
import ClientDetailsSidebar from './clients/ClientDetailsSidebar';

interface ClientesViewProps {
    isModalOpen?: boolean;
    onCloseModal?: () => void;
    searchTerm?: string;
}

export default function ClientesView({ isModalOpen, onCloseModal, searchTerm = '' }: ClientesViewProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
    const [selectedClientDetails, setSelectedClientDetails] = useState<Cliente | null>(null);

    // Internal state for modal visibility
    const [internalModalOpen, setInternalModalOpen] = useState(false);

    // Sync with parent prop
    useEffect(() => {
        if (isModalOpen) {
            setInternalModalOpen(true);
        }
    }, [isModalOpen]);

    const handleCloseModal = () => {
        setInternalModalOpen(false);
        setEditingCliente(null);
        if (onCloseModal) onCloseModal();
    };

    const setSelectedCliente = useStore((state) => state.setSelectedCliente);

    useEffect(() => {
        loadClientes();
    }, []);

    const loadClientes = async () => {
        try {
            setIsLoading(true);
            const data = await api.getClientes();
            setClientes(data);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClienteClick = (cliente: Cliente) => {
        // Instead of navigating, open sidebar
        setSelectedClientDetails(cliente);
    };

    // Edit needs to open modal.
    const onEditClick = (cliente: Cliente, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCliente(cliente);
        setInternalModalOpen(true);
    };

    const handleDeleteCliente = async (cliente: Cliente, e: React.MouseEvent) => {
        e.stopPropagation();
        // Check if client has proposals
        try {
            const proposals = await api.getClientProposals(cliente.id);
            if (proposals && proposals.length > 0) {
                const confirmed = confirm(
                    `Este cliente tem ${proposals.length} proposta(s). ` +
                    `Tem certeza que deseja excluir? As propostas também serão removidas.`
                );
                if (!confirmed) return;
            } else {
                const confirmed = confirm(`Tem certeza que deseja excluir o cliente "${cliente.nome}"?`);
                if (!confirmed) return;
            }

            await api.deleteCliente(cliente.id);
            setClientes(prev => prev.filter(c => c.id !== cliente.id));
            if (selectedClientDetails?.id === cliente.id) {
                setSelectedClientDetails(null);
            }
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            alert('Erro ao excluir cliente. Tente novamente.');
        }
    };

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cnpj?.includes(searchTerm)
    );

    return (
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                <div className="w-full max-w-[1920px] mx-auto">
                    <ClientsTable
                        clients={filteredClientes}
                        isLoading={isLoading}
                        onRowClick={handleClienteClick}
                        onEdit={onEditClick}
                        onDelete={handleDeleteCliente}
                    />
                </div>
            </div>

            <ClientModal
                isOpen={internalModalOpen}
                onClose={handleCloseModal}
                onSuccess={() => {
                    loadClientes();
                    setEditingCliente(null);
                    handleCloseModal();
                }}
                editClient={editingCliente}
            />

            <ClientDetailsSidebar
                isOpen={!!selectedClientDetails}
                client={selectedClientDetails}
                onClose={() => setSelectedClientDetails(null)}
            />
        </div>
    );
}
