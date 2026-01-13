'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import ExhibitorsTable from '@/components/exhibitors/ExhibitorsTable';
import ExhibitorDetailsSidebar from '@/components/exhibitors/ExhibitorDetailsSidebar';

interface ExibidorasViewProps {
    isModalOpen?: boolean;
    onCloseModal?: () => void;
    searchTerm?: string;
}

export default function ExibidorasView({ isModalOpen, onCloseModal, searchTerm = '' }: ExibidorasViewProps) {
    const exibidoras = useStore((state) => state.exibidoras);
    const pontos = useStore((state) => state.pontos);
    const setExibidoraModalOpen = useStore((state) => state.setExibidoraModalOpen);
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);

    // State for Sidebar
    const [selectedExibidoraDetails, setSelectedExibidoraDetails] = useState<any | null>(null);

    // Sync prop with internal/store modal state
    useEffect(() => {
        if (isModalOpen) {
            setExibidoraModalOpen(true);
        }
    }, [isModalOpen, setExibidoraModalOpen]);

    const [contatosMap, setContatosMap] = useState<Record<number, any[]>>({});

    // Carregar contatos de todas as exibidoras
    useEffect(() => {
        const loadContatos = async () => {
            const contatosData: Record<number, any[]> = {};
            await Promise.all(
                exibidoras.map(async (exibidora) => {
                    try {
                        const contatos = await api.getContatos(exibidora.id);
                        contatosData[exibidora.id] = contatos;
                    } catch (err) {
                        contatosData[exibidora.id] = [];
                    }
                })
            );
            setContatosMap(contatosData);
        };

        if (exibidoras.length > 0) {
            loadContatos();
        }
    }, [exibidoras]);

    // Calcular estatísticas de cada exibidora
    const exibidorasComStats = useMemo(() => {
        return exibidoras.map((exibidora) => {
            const pontosExibidora = pontos.filter((p) => p.id_exibidora === exibidora.id);
            const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))];
            const ufs = [...new Set(pontosExibidora.map((p) => p.uf).filter(Boolean))];

            return {
                ...exibidora,
                totalPontos: pontosExibidora.length,
                cidades: cidades as string[],
                ufs: ufs as string[],
                contatos: contatosMap[exibidora.id] || [],
            };
        });
    }, [exibidoras, pontos, contatosMap]);

    // Filtrar exibidoras com base na pesquisa
    const filteredExibidoras = useMemo(() => {
        if (!searchTerm.trim()) return exibidorasComStats;

        const query = searchTerm.toLowerCase();
        return exibidorasComStats.filter((exibidora) => {
            if (exibidora.nome.toLowerCase().includes(query)) return true;
            if (exibidora.cidades.some((cidade) => cidade.toLowerCase().includes(query))) return true;
            if (exibidora.contatos.some((contato: any) =>
                contato.nome?.toLowerCase().includes(query)
            )) return true;
            return false;
        });
    }, [exibidorasComStats, searchTerm]);

    const handleRowClick = (exibidora: any) => {
        setSelectedExibidoraDetails(exibidora);
    };

    const handleEdit = (exibidora: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setExibidoraModalOpen(true);
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                <div className="w-full max-w-[1920px] mx-auto">
                    <ExhibitorsTable
                        exibidoras={filteredExibidoras}
                        isLoading={false}
                        onRowClick={handleRowClick}
                        onEdit={handleEdit}
                    />

                    {exibidoras.length === 0 && (
                        <div className="text-center py-24 animate-in fade-in zoom-in duration-500">
                            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200">
                                <Plus size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                Comece cadastrando suas exibidoras
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                Adicione as empresas parceiras para gerenciar seus pontos de mídia exterior.
                            </p>
                            <Button
                                onClick={() => setExibidoraModalOpen(true)}
                                size="lg"
                                className="bg-emidias-accent hover:bg-emidias-accent/90"
                                leftIcon={<Plus size={24} />}
                            >
                                Cadastrar Primeira Exibidora
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            <ExhibitorDetailsSidebar
                isOpen={!!selectedExibidoraDetails}
                exibidoras={selectedExibidoraDetails}
                onClose={() => setSelectedExibidoraDetails(null)}
            />
        </div>
    );
}
