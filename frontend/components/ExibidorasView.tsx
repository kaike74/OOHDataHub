'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Building2, MapPin, Search, X, Plus } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SafeImage } from '@/components/ui/SafeImage';

export default function ExibidorasView() {
    const exibidoras = useStore((state) => state.exibidoras);
    const pontos = useStore((state) => state.pontos);
    const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);
    const setExibidoraModalOpen = useStore((state) => state.setExibidoraModalOpen);

    const [searchQuery, setSearchQuery] = useState('');
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
        if (!searchQuery.trim()) return exibidorasComStats;

        const query = searchQuery.toLowerCase();
        return exibidorasComStats.filter((exibidora) => {
            // Buscar no nome da exibidora
            if (exibidora.nome.toLowerCase().includes(query)) return true;

            // Buscar nas regiões de atuação (cidades)
            if (exibidora.cidades.some((cidade) => cidade.toLowerCase().includes(query))) return true;

            // Buscar nos nomes dos contatos
            if (exibidora.contatos.some((contato: any) =>
                contato.nome?.toLowerCase().includes(query)
            )) return true;

            return false;
        });
    }, [exibidorasComStats, searchQuery]);

    const handleExibidoraClick = (exibidora: typeof exibidorasComStats[0]) => {
        // Filtrar mapa por essa exibidora
        setFilterExibidora([exibidora.id]);

        // Selecionar exibidora para abrir gaveta
        setSelectedExibidora(exibidora);

        // Voltar para view de mapa
        setCurrentView('map');
    };

    const handleNewExibidora = () => {
        setExibidoraModalOpen(true);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-gray-50 p-4 custom-scrollbar">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-emidias-primary mb-2 tracking-tight">
                            Exibidoras
                        </h1>
                        <p className="text-gray-600">
                            Gerencie seus parceiros de mídia OOH. Total de {filteredExibidoras.length} cadastrada{filteredExibidoras.length !== 1 ? 's' : ''}.
                        </p>
                    </div>

                    {/* Search and Actions */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        {/* Search Field */}
                        <div className="relative w-full sm:w-80">
                            <Input
                                placeholder="Buscar exibidora, cidade ou contato..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white"
                                icon={<Search size={18} />}
                                rightElement={searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery('')}
                                        className="text-gray-400 hover:text-emidias-primary transition p-1"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            />
                        </div>

                        {/* Register Button */}
                        <Button
                            onClick={handleNewExibidora}
                            className="bg-emidias-accent hover:bg-emidias-accent/90 shadow-lg"
                            leftIcon={<Plus size={20} />}
                        >
                            Cadastrar
                        </Button>
                    </div>
                </div>

                {/* Grid de Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredExibidoras.map((exibidora) => (
                        <div
                            key={exibidora.id}
                            onClick={() => handleExibidoraClick(exibidora)}
                            className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-full"
                        >
                            {/* Logo */}
                            <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden p-6">
                                {exibidora.logo_r2_key ? (
                                    <SafeImage
                                        src={api.getImageUrl(exibidora.logo_r2_key)}
                                        alt={exibidora.nome}
                                        className="w-full h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105 duration-500"
                                    />
                                ) : (
                                    <Building2 size={48} className="text-gray-300" />
                                )}

                                {/* Badge de total de pontos */}
                                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-emidias-primary px-3 py-1 rounded-full text-xs font-bold shadow-sm border border-gray-100">
                                    {exibidora.totalPontos} ponto{exibidora.totalPontos !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Conteúdo */}
                            <div className="p-5 flex-1 flex flex-col">
                                {/* Nome */}
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emidias-accent transition-colors line-clamp-1">
                                    {exibidora.nome}
                                </h3>

                                {/* CNPJ */}
                                {exibidora.cnpj && (
                                    <p className="text-xs text-gray-500 mb-4 font-mono bg-gray-50 inline-block px-1.5 py-0.5 rounded border border-gray-100 w-fit">
                                        {exibidora.cnpj}
                                    </p>
                                )}

                                <div className="mt-auto space-y-3">
                                    {/* Regiões */}
                                    {exibidora.cidades.length > 0 ? (
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-gray-500">
                                                <MapPin size={14} />
                                                <span className="text-xs font-semibold uppercase tracking-wider">Atuação</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1.5">
                                                {exibidora.cidades.slice(0, 3).map((cidade, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
                                                    >
                                                        {cidade}
                                                    </span>
                                                ))}
                                                {exibidora.cidades.length > 3 && (
                                                    <span className="px-2 py-0.5 bg-emidias-accent/5 text-emidias-accent rounded-md text-xs font-bold border border-emidias-accent/10">
                                                        +{exibidora.cidades.length - 3}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 italic">Sem pontos cadastrados</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {filteredExibidoras.length === 0 && exibidoras.length > 0 && (
                    <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                        <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-gray-100">
                            <Search size={32} className="text-gray-300" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            Nenhuma exibidora encontrada
                        </h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Não encontramos resultados para "{searchQuery}". Tente buscar por outro termo ou limpe os filtros.
                        </p>
                        <Button
                            variant="outline"
                            onClick={() => setSearchQuery('')}
                            className="mt-6"
                        >
                            Limpar Busca
                        </Button>
                    </div>
                )}

                {exibidoras.length === 0 && (
                    <div className="text-center py-24 animate-in fade-in zoom-in duration-500">
                        <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-dashed border-gray-200">
                            <Building2 size={40} className="text-gray-300" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                            Comece cadastrando suas exibidoras
                        </h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                            Adicione as empresas parceiras para gerenciar seus pontos de mídia exterior de forma organizada.
                        </p>
                        <Button
                            onClick={handleNewExibidora}
                            size="lg"
                            className="bg-emidias-accent hover:bg-emidias-accent/90 shadow-xl shadow-emidias-accent/20"
                            leftIcon={<Plus size={24} />}
                        >
                            Cadastrar Primeira Exibidora
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
