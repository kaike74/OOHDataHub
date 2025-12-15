'use client';

import { useState, useEffect } from 'react';
import { Plus, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ClienteModal from './ClienteModal';

interface Cliente {
    id: number;
    nome: string;
    logo_r2_key: string | null;
    created_at: string;
}

export default function ClientesView() {
    const router = useRouter();
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>();

    useEffect(() => {
        loadClientes();
    }, []);

    const loadClientes = async () => {
        try {
            setLoading(true);
            const response = await fetch('https://ooh-api.kaike-458.workers.dev/api/clientes', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar clientes');
            }

            const data = await response.json();
            setClientes(data);
        } catch (error) {
            console.error('Erro ao carregar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCliente = async (cliente: Partial<Cliente>) => {
        try {
            const method = cliente.id ? 'PUT' : 'POST';
            const url = cliente.id
                ? `https://ooh-api.kaike-458.workers.dev/api/clientes/${cliente.id}`
                : 'https://ooh-api.kaike-458.workers.dev/api/clientes';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cliente),
            });

            if (!response.ok) {
                throw new Error('Erro ao salvar cliente');
            }

            await loadClientes();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            throw error;
        }
    };

    const handleClienteClick = (cliente: Cliente) => {
        // Navegar para a página de propostas do cliente
        router.push(`/clientes/${cliente.id}/propostas`);
    };

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-[#06055B] via-[#0A0A5C] to-[#060530]">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">Clientes</h1>
                        <p className="text-white/60">Gerencie seus clientes e suas propostas</p>
                    </div>
                    <button
                        onClick={() => {
                            setSelectedCliente(undefined);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FC1E75] to-[#FF6B9D] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FC1E75]/30 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Novo Cliente</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="w-12 h-12 border-4 border-[#FC1E75] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : clientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <Building2 className="w-16 h-16 text-white/20 mb-4" />
                        <h3 className="text-xl font-semibold text-white/60 mb-2">
                            Nenhum cliente cadastrado
                        </h3>
                        <p className="text-white/40 mb-6">
                            Comece adicionando seu primeiro cliente
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-[#FC1E75] to-[#FF6B9D] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FC1E75]/30 transition-all"
                        >
                            Adicionar Cliente
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {clientes.map((cliente) => (
                            <div
                                key={cliente.id}
                                onClick={() => handleClienteClick(cliente)}
                                className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden hover:border-[#FC1E75]/50 hover:shadow-xl hover:shadow-[#FC1E75]/20 transition-all cursor-pointer"
                            >
                                {/* Logo/Image Area */}
                                <div className="aspect-video bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center p-8">
                                    {cliente.logo_r2_key ? (
                                        <img
                                            src={`https://ooh-api.kaike-458.workers.dev/api/images/${cliente.logo_r2_key}`}
                                            alt={cliente.nome}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <Building2 className="w-20 h-20 text-white/20" />
                                    )}
                                </div>

                                {/* Client Name */}
                                <div className="p-4">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-[#FC1E75] transition-colors truncate">
                                        {cliente.nome}
                                    </h3>
                                    <p className="text-sm text-white/50 mt-1">
                                        Criado em {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>

                                {/* Hover Effect Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-[#FC1E75]/0 to-[#FC1E75]/0 group-hover:from-[#FC1E75]/10 group-hover:to-transparent transition-all pointer-events-none"></div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            <ClienteModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCliente(undefined);
                }}
                onSave={handleSaveCliente}
                cliente={selectedCliente}
            />
        </div>
    );
}
