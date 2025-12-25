
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Search, Building2, ChevronRight, Loader2, Edit2, Trash2, Menu, Users } from 'lucide-react';
import { Cliente } from '@/lib/types';
import { api } from '@/lib/api';
import ClientModal from './ClientModal';
import NavigationMenu from '@/components/NavigationMenu';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ClientesView() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);

    const setSelectedCliente = useStore((state) => state.setSelectedCliente);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setMenuOpen = useStore((state) => state.setMenuOpen);

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

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.cnpj?.includes(searchQuery)
    );

    const handleEditCliente = (cliente: Cliente, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingCliente(cliente);
        setIsClientModalOpen(true);
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

    const handleModalClose = () => {
        setIsClientModalOpen(false);
        setEditingCliente(null);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <header className="px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 fixed top-0 left-0 right-0 h-[70px] bg-gradient-to-r from-emidias-primary to-[#0A0970] border-b-4 border-emidias-accent shadow-xl text-white">
                {/* Logo OOH Data Hub - Left */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
                        <Users size={22} className="text-emidias-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Clientes
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                            Gerenciamento de Carteira
                        </p>
                    </div>
                </div>

                {/* Logo E-MÍDIAS - Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="text-xl font-bold tracking-tight text-white/90">
                        OOH DATA HUB
                    </div>
                </div>

                {/* Actions - Right */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* New Client Button */}
                    <Button
                        onClick={() => setIsClientModalOpen(true)}
                        className="hidden sm:flex bg-white/10 hover:bg-white/20 text-white border-0"
                        leftIcon={<Plus size={18} />}
                    >
                        Novo Cliente
                    </Button>

                    {/* Menu Button */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            <NavigationMenu />

            <div className="max-w-7xl mx-auto p-6 mt-[80px]">
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-8 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Input
                            icon={<Search size={20} />}
                            placeholder="Buscar por nome ou CNPJ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-50 border-gray-200 focus:bg-white"
                        />
                    </div>
                </div>

                {/* Content */}
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
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => handleEditCliente(cliente, e)}
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
                                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden mb-4 self-center">
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
                isOpen={isClientModalOpen}
                onClose={handleModalClose}
                onSuccess={() => {
                    loadClientes();
                    setEditingCliente(null);
                }}
                editClient={editingCliente}
            />
        </div>
    );
}
