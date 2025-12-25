
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Search, Building2, ChevronRight, Loader2 } from 'lucide-react';
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

    const setSelectedCliente = useStore((state) => state.setSelectedCliente);
    const setCurrentView = useStore((state) => state.setCurrentView);

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
        c.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-emidias-gray-50 overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-emidias-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-emidias-gray-900">Clientes</h1>
                    <p className="text-emidias-gray-500 text-sm">Gerencie seus clientes e propostas</p>
                </div>
                <Button
                    onClick={() => setIsClientModalOpen(true)}
                    className="flex items-center gap-2"
                    leftIcon={<Plus size={20} />}
                >
                    Novo Cliente
                </Button>
            </div>

            {/* Filters */}
            <div className="flex-shrink-0 px-6 py-4">
                <div className="relative max-w-md">
                    <Input
                        icon={<Search size={20} />}
                        placeholder="Buscar cliente..."
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
                                onClick={() => handleClienteClick(cliente)}
                                className="bg-white rounded-xl p-4 border border-emidias-gray-200 hover:border-emidias-accent hover:shadow-emidias-md cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg bg-emidias-gray-50 flex items-center justify-center border border-emidias-gray-100 overflow-hidden relative">
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
                                        <div className="flex items-center gap-1 text-emidias-gray-500 text-sm mt-1">
                                            <span>Ver propostas</span>
                                            <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
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
                onClose={() => setIsClientModalOpen(false)}
                onSuccess={loadClientes}
            />
        </div>
    );
}
