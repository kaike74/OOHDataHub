
import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Plus, Search, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { Cliente } from '@/lib/types';
import { api } from '@/lib/api'; // Need to add clients methods to api
import ClientModal from './ClientModal';

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
            // We need to implement api.getClientes()
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api'}/clientes`, {
                headers: {
                    'Authorization': `Bearer ${useStore.getState().token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setClientes(data);
            }
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClienteClick = (cliente: Cliente) => {
        setSelectedCliente(cliente);
        setCurrentView('propostas'); // Switch to proposals view
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
                <button
                    onClick={() => setIsClientModalOpen(true)}
                    className="btn-base btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>Novo Cliente</span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex-shrink-0 px-6 py-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emidias-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        className="input-base pl-10 w-full"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="animate-spin text-emidias-accent" size={32} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredClientes.map((cliente) => (
                            <div
                                key={cliente.id}
                                onClick={() => handleClienteClick(cliente)}
                                className="bg-white rounded-xl p-4 border border-emidias-gray-200 hover:border-emidias-accent hover:shadow-emidias-md cursor-pointer transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-lg bg-emidias-gray-50 flex items-center justify-center border border-emidias-gray-100 overflow-hidden">
                                        {cliente.logo_url ? (
                                            <img src={cliente.logo_url} alt={cliente.nome} className="w-full h-full object-contain" />
                                        ) : (
                                            <Building2 className="text-emidias-gray-400" size={24} />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-emidias-gray-900 truncate group-hover:text-emidias-accent transition-colors">
                                            {cliente.nome}
                                        </h3>
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
