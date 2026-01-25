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
import { UnifiedStandardModal } from '@/components/ui/UnifiedStandardModal';

// Componente para exibir contatos da exibidora
function ContatosExibidora({ idExibidora }: { idExibidora: number | null | undefined }) {
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!idExibidora) return;
        const fetchContatos = async () => {
            setLoading(true);
            try { setContatos(await api.getContatos(idExibidora)); }
            catch (error) { console.error('Erro ao buscar contatos:', error); }
            finally { setLoading(false); }
        };
        fetchContatos();
    }, [idExibidora]);

    if (loading) return <div className="p-4"><div className="h-6 bg-gray-50 rounded animate-pulse" /></div>;
    if (contatos.length === 0) return <p className="text-xs text-gray-400 p-4 font-normal italic">Nenhum contato cadastrado</p>;

    return (
        <div className="space-y-2">
            {contatos.map((contato) => (
                <div key={contato.id} className="p-3 bg-white rounded-lg border border-gray-100 flex flex-col gap-1 hover:border-gray-300 transition-colors">
                    {contato.nome && <p className="font-bold text-gray-900 text-xs">{contato.nome}</p>}
                    <div className="flex flex-col gap-1">
                        {contato.telefone && <a href={`tel:${contato.telefone}`} className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-600"><Phone size={10} />{contato.telefone}</a>}
                        {contato.email && <a href={`mailto:${contato.email}`} className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-600"><Mail size={10} />{contato.email}</a>}
                    </div>
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

    const stats = useMemo(() => {
        if (!selectedExibidora) return null;
        const pontosExibidora = pontos.filter((p) => p.id_exibidora === selectedExibidora.id);
        const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))];
        return { totalPontos: pontosExibidora.length, cidades: cidades as string[] };
    }, [selectedExibidora, pontos]);

    const handleClose = useCallback(() => { setSidebarOpen(false); setFilterExibidora([]); setCurrentView('exibidoras'); }, [setSidebarOpen, setFilterExibidora, setCurrentView]);
    const handleEdit = useCallback(() => { if (!selectedExibidora) return; setEditingExibidora(selectedExibidora); setExibidoraModalOpen(true); }, [selectedExibidora, setEditingExibidora, setExibidoraModalOpen]);

    const startImport = useBulkImportStore((state) => state.startImport);
    const handleBulkImport = useCallback(() => { if (!selectedExibidora) return; startImport(selectedExibidora.id, selectedExibidora.nome); }, [selectedExibidora, startImport]);

    const isOpen = !!selectedExibidora && isSidebarOpen && !selectedPonto;
    if (!selectedExibidora) return null;

    // 1. Hero
    const HeroContent = (
        <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-white border border-gray-100 p-2 flex items-center justify-center shadow-sm">
                {selectedExibidora.logo_r2_key ? (
                    <SafeImage src={api.getImageUrl(selectedExibidora.logo_r2_key)} alt={selectedExibidora.nome} className="w-full h-full object-contain" />
                ) : (
                    <Building2 size={32} className="text-gray-300" />
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedExibidora.nome}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {selectedExibidora.created_at ? formatDate(selectedExibidora.created_at) : 'N/A'}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{stats?.totalPontos || 0} Pontos</span>
                </div>
            </div>
        </div>
    );

    // 2. Info Cards
    const InfoContent = (
        <div className="flex flex-col gap-4 h-full">
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex-1">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg"><Building2 size={16} /></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dados da Empresa</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Razão Social</span>
                        <p className="text-sm font-medium text-gray-900">{selectedExibidora.razao_social || '-'}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">CNPJ</span>
                        <p className="text-sm font-mono text-gray-900 bg-gray-50 inline-block px-1.5 rounded">{selectedExibidora.cnpj || '-'}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Endereço</span>
                        <p className="text-sm text-gray-600">{selectedExibidora.endereco || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // 3. List / Visual (Merged here for efficiency)
    const RightGrid = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Cities */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Tag size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Cidades Atendidas</span>
                </div>
                <div className="p-4 flex flex-wrap gap-2 overflow-y-auto max-h-[300px] custom-scrollbar">
                    {stats?.cidades.map((c, i) => <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded text-xs">{c}</span>)}
                </div>
            </div>

            {/* Contacts */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Contatos</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[300px] custom-scrollbar p-2">
                    <ContatosExibidora idExibidora={selectedExibidora.id} />
                </div>
            </div>
        </div>
    );

    return (
        <>
            <UnifiedStandardModal
                isOpen={isOpen}
                onClose={handleClose}
                title="Detalhes da Exibidora"
                hero={HeroContent}
                infoContent={InfoContent}
                listContent={RightGrid}
                actions={[
                    {
                        icon: Upload,
                        label: "Cadastro em Massa",
                        onClick: handleBulkImport,
                        variant: 'default'
                    },
                    {
                        icon: Pencil,
                        label: "Editar",
                        onClick: handleEdit,
                        variant: 'primary'
                    }
                ]}
            />
            <BulkImportModal />
        </>
    );
}
