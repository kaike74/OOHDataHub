'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Building2, FileText, MapPin, Phone, Mail, Pencil, Tag, Calendar, Upload } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import type { Contato } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { SafeImage } from '@/components/ui/SafeImage';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import BulkImportModal from '@/components/bulk-import/BulkImportModal';
import { UnifiedDetailModal } from '@/components/ui/UnifiedDetailModal';

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
        <div className="space-y-2">
            {contatos.map((contato) => (
                <div key={contato.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-plura-accent/30 transition-all flex flex-col gap-1.5">
                    {contato.nome && (
                        <p className="font-semibold text-gray-900 text-sm">{contato.nome}</p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        {contato.telefone && (
                            <a
                                href={`tel:${contato.telefone}`}
                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-plura-accent transition-colors"
                            >
                                <Phone size={12} />
                                {contato.telefone}
                            </a>
                        )}
                        {contato.email && (
                            <a
                                href={`mailto:${contato.email}`}
                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-plura-accent transition-colors"
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

export default function ExhibitorDetailModal() {
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
    const isOpen = !!selectedExibidora && isSidebarOpen && !selectedPonto;

    if (!selectedExibidora) return null;

    // Logo component
    const logo = selectedExibidora.logo_r2_key ? (
        <SafeImage
            src={api.getImageUrl(selectedExibidora.logo_r2_key)}
            alt={selectedExibidora.nome}
            className="w-full h-full object-cover"
        />
    ) : (
        <Building2 size={40} className="text-gray-300" />
    );

    // Subtitle with creation date
    const subtitle = selectedExibidora.created_at ? (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Calendar size={12} />
            <span>Cadastrado em {formatDate(selectedExibidora.created_at)}</span>
        </div>
    ) : undefined;

    return (
        <>
            <UnifiedDetailModal
                isOpen={isOpen}
                onClose={handleClose}
                title={selectedExibidora.nome}
                subtitle={subtitle}
                logo={logo}
                sections={[
                    // Stats
                    ...(stats && stats.totalPontos > 0 ? [{
                        content: (
                            <div className="p-3 bg-gradient-to-r from-plura-accent/5 to-transparent rounded-xl border border-plura-accent/10 flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-600">Total de Pontos</p>
                                <p className="text-2xl font-bold text-plura-accent">
                                    {stats.totalPontos}
                                </p>
                            </div>
                        )
                    }] : []),
                    // Informações
                    {
                        title: "Informações",
                        icon: <Building2 size={16} />,
                        content: (
                            <div className="space-y-4">
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
                            </div>
                        )
                    },
                    // Regiões de Atuação
                    ...(stats && stats.cidades.length > 0 ? [{
                        title: "Atuação",
                        icon: <Tag size={16} />,
                        content: (
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
                        )
                    }] : []),
                    // Contatos
                    {
                        title: "Contatos",
                        icon: <Phone size={16} />,
                        content: <ContatosExibidora idExibidora={selectedExibidora.id} />
                    }
                ]}
                actions={[
                    {
                        label: "Editar",
                        onClick: handleEdit,
                        icon: <Pencil size={16} />,
                        variant: 'primary'
                    },
                    {
                        label: "Cadastro em Massa",
                        onClick: handleBulkImport,
                        icon: <Upload size={16} />,
                        variant: 'secondary'
                    }
                ]}
            />

            {/* Bulk Import Modal */}
            <BulkImportModal />
        </>
    );
}
