'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { X, Building2, FileText, MapPin, Phone, Mail, Pencil, Tag, Calendar, Upload } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Contato } from '@/lib/types';
import { formatDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import BulkImportModal from '@/components/bulk-import/BulkImportModal';

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
        <div className="mt-4 space-y-2 w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contatos</p>
            {contatos.map((contato) => (
                <div key={contato.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-emidias-accent/30 transition-all flex flex-col gap-1.5">
                    {contato.nome && (
                        <p className="font-semibold text-gray-900 text-sm">{contato.nome}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {contato.telefone && (
                            <a
                                href={`tel:${contato.telefone}`}
                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Phone size={12} />
                                {contato.telefone}
                            </a>
                        )}
                        {contato.email && (
                            <a
                                href={`mailto:${contato.email}`}
                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Mail size={12} />
                                {contato.email}
                            </a>
                        )}
                    </div>
                    {contato.observacoes && (
                        <p className="text-xs text-gray-500 mt-1 italic">{contato.observacoes}</p>
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

    const startImport = useBulkImportStore((state) => state.startImport);
    const handleBulkImport = useCallback(() => {
        if (!selectedExibidora) return;
        startImport(selectedExibidora.id, selectedExibidora.nome);
    }, [selectedExibidora, startImport]);

    // Só mostra se tiver exibidora selecionada e NÃO tiver ponto selecionado
    if (!selectedExibidora || !isSidebarOpen || selectedPonto) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden transition-opacity animate-in fade-in"
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-full sm:w-80 bg-white/95 backdrop-blur-xl shadow-emidias-2xl z-40 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col border-l border-white/20 animate-in slide-in-from-right">

                {/* Header com Logo */}
                <div className="relative h-44 bg-gray-100 flex-shrink-0 group">
                    <button
                        onClick={handleClose}
                        className="absolute top-3 right-3 z-20 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-all backdrop-blur-md opacity-0 group-hover:opacity-100"
                        title="Fechar"
                    >
                        <X size={18} strokeWidth={2.5} />
                    </button>

                    {selectedExibidora.logo_r2_key ? (
                        <>
                            <SafeImage
                                src={api.getImageUrl(selectedExibidora.logo_r2_key)}
                                alt={selectedExibidora.nome}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <Building2 size={40} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-xs">Sem logo</p>
                            </div>
                        </div>
                    )}

                    {/* Meta Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 pt-10 text-white leading-tight">
                        <h2 className="text-xl font-bold mb-1 drop-shadow-md tracking-tight">
                            {selectedExibidora.nome}
                        </h2>
                        {selectedExibidora.created_at && (
                            <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                                <Calendar size={12} />
                                <span>{formatDate(selectedExibidora.created_at)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-6">
                        {/* Stats Badge */}
                        {stats && stats.totalPontos > 0 && (
                            <div className="p-3 bg-gradient-to-r from-emidias-accent/5 to-transparent rounded-xl border border-emidias-accent/10 flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-600">Total de Pontos</p>
                                <p className="text-2xl font-bold text-emidias-accent">
                                    {stats.totalPontos}
                                </p>
                            </div>
                        )}

                        {/* Info Items */}
                        <div className="space-y-4">
                            {/* CNPJ */}
                            {selectedExibidora.cnpj && (
                                <div className="flex gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                        <FileText size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CNPJ</p>
                                        <p className="text-gray-900 font-medium text-sm mt-0.5 font-mono">{selectedExibidora.cnpj}</p>
                                    </div>
                                </div>
                            )}

                            {/* Razão Social */}
                            {selectedExibidora.razao_social && (
                                <div className="flex gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                        <Building2 size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Razão Social</p>
                                        <p className="text-gray-900 font-medium text-sm mt-0.5 leading-snug">{selectedExibidora.razao_social}</p>
                                    </div>
                                </div>
                            )}

                            {/* Endereço */}
                            {selectedExibidora.endereco && (
                                <div className="flex gap-3">
                                    <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                        <MapPin size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endereço</p>
                                        <p className="text-gray-900 font-medium text-sm mt-0.5 leading-snug">{selectedExibidora.endereco}</p>
                                    </div>
                                </div>
                            )}

                            {/* Regiões de Atuação */}
                            {stats && stats.cidades.length > 0 && (
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Tag size={14} className="text-gray-400" />
                                        <h3 className="font-bold text-xs uppercase text-gray-400 tracking-widest">Atuação</h3>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {stats.cidades.map((cidade, idx) => (
                                            <span
                                                key={idx}
                                                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
                                            >
                                                {cidade}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Contatos */}
                            {selectedExibidora.id && (
                                <div className="pt-2 border-t border-gray-100">
                                    <ContatosExibidora idExibidora={selectedExibidora.id} />
                                </div>
                            )}
                        </div>

                        {/* Bottom Spacer */}
                        <div className="h-12"></div>
                    </div>
                </div>

                {/* Actions Footer - Glassmorphic */}
                <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white/80 backdrop-blur-md">
                    <div className="flex gap-2">
                        <Button
                            onClick={handleBulkImport}
                            variant="outline"
                            className="flex-1 shadow-sm hover:shadow-md transition-all rounded-xl"
                            leftIcon={<Upload size={18} />}
                        >
                            Cadastro em Massa
                        </Button>
                        <Button
                            onClick={handleEdit}
                            variant="primary"
                            className="flex-1 shadow-md hover:shadow-lg transition-all rounded-xl"
                            leftIcon={<Pencil size={18} />}
                        >
                            Editar
                        </Button>
                    </div>
                </div>

                {/* Bulk Import Modal */}
                <BulkImportModal />
            </div>
        </>
    );
}
