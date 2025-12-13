'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { X, Building2, FileText, MapPin, Phone, Mail, Pencil, Tag, Calendar } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Contato } from '@/lib/types';
import { formatDate } from '@/lib/utils';

// Componente para exibir contatos da exibidora
function ContatosExibidora({ idExibidora }: { idExibidora: number | null | undefined }) {
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!idExibidora) return;

        const fetchContatos = async () => {
            setLoading(true);
            try {
                const data = await api.getContatos(idExibidora);
                setContatos(data);
            } catch (error) {
                console.error('Erro ao buscar contatos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContatos();
    }, [idExibidora]);

    if (loading || contatos.length === 0) return null;

    return (
        <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Contatos</p>
            {contatos.map((contato) => (
                <div key={contato.id} className="p-3 bg-emidias-gray-50 rounded-lg border border-emidias-gray-100 hover:border-emidias-accent/30 transition-all">
                    {contato.nome && (
                        <p className="font-medium text-emidias-gray-900 text-sm">{contato.nome}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2">
                        {contato.telefone && (
                            <a
                                href={`tel:${contato.telefone}`}
                                className="flex items-center gap-1.5 text-xs text-emidias-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Phone size={12} />
                                {contato.telefone}
                            </a>
                        )}
                        {contato.email && (
                            <a
                                href={`mailto:${contato.email}`}
                                className="flex items-center gap-1.5 text-xs text-emidias-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Mail size={12} />
                                {contato.email}
                            </a>
                        )}
                    </div>
                    {contato.observacoes && (
                        <p className="text-xs text-emidias-gray-500 mt-2 italic">{contato.observacoes}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function ExibidoraSidebar() {
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const selectedPonto = useStore((state) => state.selectedPonto);
    const isSidebarOpen = useStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useStore((state) => state.setSidebarOpen);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const setExibidoraModalOpen = useStore((state) => state.setExibidoraModalOpen);
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

    const handleClose = useCallback(() => {
        setSidebarOpen(false);
        setFilterExibidora([]);
        setCurrentView('exibidoras');
    }, [setSidebarOpen, setFilterExibidora, setCurrentView]);

    const handleEdit = useCallback(() => {
        if (!selectedExibidora) return;
        setEditingExibidora(selectedExibidora);
        setExibidoraModalOpen(true);
    }, [selectedExibidora, setEditingExibidora, setExibidoraModalOpen]);

    // Só mostra se tiver exibidora selecionada e NÃO tiver ponto selecionado
    if (!selectedExibidora || !isSidebarOpen || selectedPonto) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden transition-opacity"
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-full sm:w-[420px] bg-white shadow-emidias-2xl z-30 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col animate-slide-in-right">
                {/* Close Button - Floating */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 backdrop-blur-sm"
                    title="Fechar"
                >
                    <X size={20} strokeWidth={2.5} />
                </button>

                {/* Header com Logo */}
                <div className="relative h-32 bg-gradient-to-br from-emidias-primary to-emidias-accent flex-shrink-0">
                    {selectedExibidora.logo_r2_key ? (
                        <>
                            <img
                                src={api.getImageUrl(selectedExibidora.logo_r2_key)}
                                alt={selectedExibidora.nome}
                                className="w-full h-full object-cover transition-opacity duration-500"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center">
                                <Building2 size={64} className="text-white/30 mx-auto mb-2" />
                                <p className="text-white/50 text-sm">Sem logo</p>
                            </div>
                        </div>
                    )}

                    {/* Meta Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <h2 className="text-2xl font-bold mb-1 drop-shadow-lg">
                            {selectedExibidora.nome}
                        </h2>
                        {selectedExibidora.created_at && (
                            <div className="flex items-center gap-2 text-sm text-white/80">
                                <Calendar size={14} />
                                <span>{formatDate(selectedExibidora.created_at)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-6">
                        {/* Stats Badge */}
                        {stats && stats.totalPontos > 0 && (
                            <div className="p-4 bg-gradient-to-r from-emidias-gray-50 to-transparent rounded-xl border border-emidias-gray-100">
                                <p className="text-sm text-emidias-gray-500 mb-1">Total de Pontos</p>
                                <p className="text-3xl font-bold text-emidias-accent">
                                    {stats.totalPontos}
                                </p>
                            </div>
                        )}

                        {/* Info Items */}
                        <div className="space-y-3">
                            {/* CNPJ */}
                            {selectedExibidora.cnpj && (
                                <div className="sidebar-info-item">
                                    <FileText className="sidebar-info-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">CNPJ</p>
                                        <p className="text-emidias-gray-900 font-medium mt-0.5 font-mono">{selectedExibidora.cnpj}</p>
                                    </div>
                                </div>
                            )}

                            {/* Razão Social */}
                            {selectedExibidora.razao_social && (
                                <div className="sidebar-info-item">
                                    <Building2 className="sidebar-info-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Razão Social</p>
                                        <p className="text-emidias-gray-900 font-medium mt-0.5">{selectedExibidora.razao_social}</p>
                                    </div>
                                </div>
                            )}

                            {/* Endereço de Faturamento */}
                            {selectedExibidora.endereco && (
                                <div className="sidebar-info-item">
                                    <MapPin className="sidebar-info-icon" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold text-emidias-gray-500 uppercase tracking-wider">Endereço de Faturamento</p>
                                        <p className="text-emidias-gray-900 font-medium mt-0.5">{selectedExibidora.endereco}</p>
                                    </div>
                                </div>
                            )}

                            {/* Regiões de Atuação */}
                            {stats && stats.cidades.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Tag className="w-5 h-5 text-emidias-accent" />
                                        <h3 className="font-semibold text-emidias-gray-900">Regiões de Atuação</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {stats.cidades.map((cidade, idx) => (
                                            <span
                                                key={idx}
                                                className="badge badge-accent"
                                            >
                                                {cidade}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contatos */}
                            {selectedExibidora.id && (
                                <div className="sidebar-info-item flex-col items-start">
                                    <ContatosExibidora idExibidora={selectedExibidora.id} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Footer - Fixed */}
                <div className="flex-shrink-0 p-4 border-t border-emidias-gray-100 bg-white/80 backdrop-blur-sm">
                    {/* Icon-only action buttons in a compact row */}
                    <div className="flex items-center justify-around gap-2">
                        {/* Edit */}
                        <button
                            onClick={handleEdit}
                            className="flex items-center justify-center w-11 h-11 rounded-lg bg-emidias-primary/10 text-emidias-primary hover:bg-emidias-primary hover:text-white transition-all hover:scale-105"
                            title="Editar Exibidora"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
