
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Search, Building2, ChevronRight, Loader2, Edit2, Trash2, MoreVertical, Users, TrendingUp, Package, Clock } from 'lucide-react';
import { Cliente } from '@/lib/types';
import { api } from '@/lib/api';
import ClientModal from './ClientModal';
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
    const [showStats, setShowStats] = useState(true);

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

    // Stats calculations
    const totalClientes = clientes.length;
    const segmentos = [...new Set(clientes.filter(c => c.segmento).map(c => c.segmento))];
    const recentClientes = [...clientes]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

    return (
        <div className="h-full flex flex-col bg-emidias-gray-50 overflow-hidden relative">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-emidias-gray-200 px-6 py-4 flex items-center justify-between z-20 relative">
                <div className="flex items-center gap-4">
                    {/* Menu Toggle - Visible on mobile/tablet or if sidebar is hidden */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all lg:hidden"
                    >
                        <div className="space-y-1.5">
                            <span className="block w-6 h-0.5 bg-current rounded-full"></span>
                            <span className="block w-6 h-0.5 bg-current rounded-full"></span>
                            <span className="block w-6 h-0.5 bg-current rounded-full"></span>
                        </div>
                    </button>

                    <div>
                        <h1 className="text-2xl font-bold text-emidias-gray-900 tracking-tight">Clientes</h1>
                        <p className="text-emidias-gray-500 text-sm flex items-center gap-2">
                            Gerenciamento de Carteira
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setMenuOpen(true)}
                        variant="ghost"
                        className="hidden lg:flex text-gray-500 hover:text-gray-900"
                    >
                        Menu
                    </Button>
                    <Button
                        onClick={() => setIsClientModalOpen(true)}
                        className="flex items-center gap-2 shadow-lg shadow-emidias-accent/20"
                        leftIcon={<Plus size={20} />}
                    >
                        Novo Cliente
                    </Button>
                </div>
            </div>

            {/* Stats Dashboard */}
            {showStats && !isLoading && clientes.length > 0 && (
                <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Clientes */}
                        <div className="bg-gradient-to-br from-emidias-primary to-emidias-primary-dark rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Total de Clientes</p>
                                    <p className="text-3xl font-bold">{totalClientes}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Segmentos */}
                        <div className="bg-gradient-to-br from-emidias-accent to-pink-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Segmentos</p>
                                    <p className="text-3xl font-bold">{segmentos.length}</p>
                                </div>
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <Package size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Adicionados Recentemente */}
                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Este Mês</p>
                                    <p className="text-3xl font-bold">
                                        {clientes.filter(c => {
                                            const createdDate = new Date(c.created_at);
                                            const now = new Date();
                                            return createdDate.getMonth() === now.getMonth() &&
                                                   createdDate.getFullYear() === now.getFullYear();
                                        }).length}
                                    </p>
                                </div>
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                    <TrendingUp size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Último Adicionado */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-1">Último Adicionado</p>
                                    {recentClientes[0] ? (
                                        <p className="text-sm font-bold truncate">{recentClientes[0].nome}</p>
                                    ) : (
                                        <p className="text-sm font-bold">-</p>
                                    )}
                                </div>
                                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0 ml-2">
                                    <Clock size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex-shrink-0 px-6 py-4">
                <div className="relative max-w-md">
                    <Input
                        icon={<Search size={20} />}
                        placeholder="Buscar cliente por nome ou CNPJ..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 border border-emidias-gray-200">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-16 h-16 rounded-lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-5 w-3/4" />
                                        <Skeleton className="h-4 w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredClientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300 animate-in fade-in zoom-in duration-500">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <Building2 size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Nenhum cliente encontrado</h3>
                        <p className="text-gray-500 text-sm">Tente buscar por outro termo ou cadastre um novo cliente.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
                        {filteredClientes.map((cliente) => (
                            <div
                                key={cliente.id}
                                className="bg-white rounded-xl p-4 border border-emidias-gray-200 hover:border-emidias-accent hover:shadow-emidias-md transition-all group relative"
                            >
                                {/* Action Buttons */}
                                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => handleEditCliente(cliente, e)}
                                        className="p-1.5 bg-white border border-gray-200 text-gray-600 hover:text-emidias-accent hover:border-emidias-accent rounded-lg transition-colors shadow-sm"
                                        title="Editar cliente"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => handleDeleteCliente(cliente, e)}
                                        className="p-1.5 bg-white border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-500 rounded-lg transition-colors shadow-sm"
                                        title="Excluir cliente"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>

                                <div
                                    onClick={() => handleClienteClick(cliente)}
                                    className="flex items-center gap-4 cursor-pointer"
                                >
                                    <div className="w-16 h-16 rounded-lg bg-emidias-gray-50 flex items-center justify-center border border-emidias-gray-100 overflow-hidden relative shrink-0">
                                        {cliente.logo_url ? (
                                            <SafeImage
                                                src={api.getImageUrl(cliente.logo_url)}
                                                alt={cliente.nome}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Building2 className="text-emidias-gray-400" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-emidias-gray-900 truncate group-hover:text-emidias-accent transition-colors">
                                            {cliente.nome}
                                        </h3>
                                        {cliente.cnpj && (
                                            <p className="text-xs text-gray-400 font-mono mt-0.5 truncate">
                                                {cliente.cnpj}
                                            </p>
                                        )}
                                        {cliente.segmento && (
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                {cliente.segmento}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-1 text-emidias-gray-500 text-xs mt-2">
                                            <span>Ver propostas</span>
                                            <ChevronRight size={12} className="group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </div>
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
