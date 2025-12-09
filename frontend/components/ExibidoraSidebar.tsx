'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { X, Building2, FileText, MapPin, Phone, Mail, ArrowLeft, Pencil } from 'lucide-react';
import { useMemo } from 'react';

export default function ExibidoraSidebar() {
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const isSidebarOpen = useStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useStore((state) => state.setSidebarOpen);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);
    const pontos = useStore((state) => state.pontos);

    // Calcular estatísticas da exibidora
    const stats = useMemo(() => {
        if (!selectedExibidora) return null;

        const pontosExibidora = pontos.filter((p) => p.id_exibidora === selectedExibidora.id);
        const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))];
        const ufs = [...new Set(pontosExibidora.map((p) => p.uf).filter(Boolean))];

        return {
            totalPontos: pontosExibidora.length,
            cidades: cidades as string[],
            ufs: ufs as string[],
        };
    }, [selectedExibidora, pontos]);

    const handleVoltar = () => {
        setSidebarOpen(false);
        setFilterExibidora(null);
        setCurrentView('exibidoras');
    };

    const handleEdit = () => {
        // TODO: Implementar modal de edição de exibidora
        alert('Funcionalidade de edição será implementada em breve');
    };

    if (!selectedExibidora || !isSidebarOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-full sm:w-96 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-in-out overflow-y-auto">
                {/* Header com Logo */}
                <div className="relative h-48 bg-gradient-to-br from-emidias-primary to-emidias-accent flex items-center justify-center">
                    {selectedExibidora.logo_r2_key ? (
                        <img
                            src={api.getImageUrl(selectedExibidora.logo_r2_key)}
                            alt={selectedExibidora.nome}
                            className="w-full h-full object-contain p-8 bg-white/10"
                        />
                    ) : (
                        <Building2 size={80} className="text-white/80" />
                    )}

                    {/* Botão Fechar */}
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="absolute top-3 right-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-all z-10"
                        title="Fechar"
                    >
                        <X size={20} strokeWidth={2} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Nome */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {selectedExibidora.nome}
                        </h2>
                        {stats && (
                            <p className="text-sm text-gray-500 mt-1">
                                {stats.totalPontos} ponto{stats.totalPontos !== 1 ? 's' : ''} cadastrado{stats.totalPontos !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>

                    {/* Informações */}
                    <div className="space-y-4">
                        {/* CNPJ */}
                        {selectedExibidora.cnpj && (
                            <div className="flex items-start gap-3">
                                <FileText className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">CNPJ</p>
                                    <p className="text-gray-900">{selectedExibidora.cnpj}</p>
                                </div>
                            </div>
                        )}

                        {/* Razão Social */}
                        {selectedExibidora.razao_social && (
                            <div className="flex items-start gap-3">
                                <Building2 className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">Razão Social</p>
                                    <p className="text-gray-900">{selectedExibidora.razao_social}</p>
                                </div>
                            </div>
                        )}

                        {/* Endereço de Faturamento */}
                        {selectedExibidora.endereco && (
                            <div className="flex items-start gap-3">
                                <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">Endereço de Faturamento</p>
                                    <p className="text-gray-900">{selectedExibidora.endereco}</p>
                                </div>
                            </div>
                        )}

                        {/* Telefone */}
                        {selectedExibidora.telefone && (
                            <div className="flex items-start gap-3">
                                <Phone className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">Telefone</p>
                                    <p className="text-gray-900">{selectedExibidora.telefone}</p>
                                </div>
                            </div>
                        )}

                        {/* Email */}
                        {selectedExibidora.email && (
                            <div className="flex items-start gap-3">
                                <Mail className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">E-mail</p>
                                    <p className="text-gray-900">{selectedExibidora.email}</p>
                                </div>
                            </div>
                        )}

                        {/* Regiões de Atuação */}
                        {stats && stats.cidades.length > 0 && (
                            <div>
                                <p className="font-medium text-gray-700 mb-2">Regiões de Atuação</p>
                                <div className="flex flex-wrap gap-2">
                                    {stats.cidades.map((cidade, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                        >
                                            {cidade}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="mt-8 space-y-3">
                        {/* Voltar para Exibidoras */}
                        <button
                            onClick={handleVoltar}
                            className="w-full bg-emidias-accent text-white py-3 rounded-lg font-medium hover:bg-[#E01A6A] transition flex items-center justify-center gap-2 shadow-lg hover-lift"
                        >
                            <ArrowLeft size={18} />
                            Voltar para Exibidoras
                        </button>

                        {/* Editar */}
                        <button
                            onClick={handleEdit}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                        >
                            <Pencil size={18} />
                            Editar Exibidora
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
