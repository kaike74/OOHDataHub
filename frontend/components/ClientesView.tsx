
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
    Search, Plus, Building2, Edit2, Trash2, ChevronRight, Menu, Users
} from 'lucide-react';
import { Cliente } from '@/lib/types';
import ClientModal from './ClientModal';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

interface ClientesViewProps {
    isModalOpen?: boolean;
    onCloseModal?: () => void;
}

export default function ClientesView({ isModalOpen, onCloseModal }: ClientesViewProps) {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

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
    const setCurrentView = useStore((state) => state.setCurrentView);
    // Removed legacy setMenuOpen usage

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
        setSelectedCliente(cliente);
        setCurrentView('propostas');
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
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            alert('Erro ao excluir cliente. Tente novamente.');
        }
    };

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cnpj?.includes(searchQuery)
    );

    return (
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
            {/* Local Sub-header or Search Bar */}
            <div className="bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-gray-800">Carteira de Clientes</h2>
                <div className="relative w-72">
                    <Input
                        icon={<Search size={18} />}
                        placeholder="Buscar por nome ou CNPJ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-gray-50 border-gray-200 focus:bg-white"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                        ))}
                    </div>
                ) : filteredClientes.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200 animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Building2 className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Nenhum cliente encontrado</h3>
                        <p className="text-gray-500 text-sm">Tente buscar por outro termo ou cadastre um novo cliente.</p>
                        <Button
                            className="mt-4"
                            variant="outline"
                            onClick={() => setInternalModalOpen(true)}
                        >
                            Cadastrar Cliente
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in-up duration-500">
                        {filteredClientes.map((cliente) => (
                            <div
                                key={cliente.id}
                                onClick={() => handleClienteClick(cliente)}
                                className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-emidias-accent/50 hover:shadow-xl hover:shadow-emidias-accent/5 cursor-pointer transition-all duration-300 flex flex-col group/card relative"
                            >
                                {/* Action Buttons */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-100 sm:opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => onEditClick(cliente, e)}
                                        className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-emidias-accent hover:border-emidias-accent rounded-lg transition-colors shadow-sm"
                                        title="Editar cliente"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteCliente(cliente, e)}
                                        className="p-2 bg-white border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-500 rounded-lg transition-colors shadow-sm"
                                        title="Excluir cliente"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                {/* Logo */}
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden mb-4 self-center relative">
                                    {cliente.logo_url ? (
                                        <SafeImage
                                            src={api.getImageUrl(cliente.logo_url)}
                                            alt={cliente.nome}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="text-gray-300" size={32} />
                                    )}
                                </div>

                                {/* Info */}
                                <div className="text-center">
                                    <h3 className="text-lg font-bold text-gray-900 group-hover/card:text-emidias-accent transition-colors line-clamp-1 mb-1">
                                        {cliente.nome}
                                    </h3>
                                    {cliente.cnpj && (
                                        <p className="text-xs text-gray-400 font-mono mb-2">
                                            {cliente.cnpj}
                                        </p>
                                    )}
                                    {cliente.segmento && (
                                        <p className="text-xs text-gray-500 mb-3">
                                            {cliente.segmento}
                                        </p>
                                    )}
                                </div>

                                {/* Action */}
                                <div className="mt-auto pt-3 border-t border-gray-100 text-center">
                                    <span className="text-xs text-emidias-accent font-medium flex items-center justify-center gap-1">
                                        Ver propostas
                                        <ChevronRight size={14} className="group-hover/card:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
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
        </div>
    );
}
