'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Building2, MapPin, Search, X, Plus } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';

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

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const handleNewExibidora = () => {
        setExibidoraModalOpen(true);
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-gray-50 p-4">
            <div className="max-w-[1600px] mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-emidias-primary mb-2">
                            Exibidoras
                        </h1>
                        <p className="text-gray-600">
                            {filteredExibidoras.length} de {exibidoras.length} exibidora{exibidoras.length !== 1 ? 's' : ''}
                        </p>
                    </div>

                    {/* Search and Actions */}
                    <div className="flex items-center gap-3">
                        {/* Search Field */}
                        <div className="relative">
                            <div className="flex items-center gap-2 bg-white rounded-lg shadow-md border border-gray-200 transition-all focus-within:border-emidias-primary focus-within:shadow-lg">
                                <div className="pl-3 text-gray-400">
                                    <Search size={18} />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar exibidora..."
                                    className="py-2 pr-2 outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-64"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="pr-3 text-gray-400 hover:text-emidias-primary transition"
                                    >
                                        <X size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Register Button */}
                        <button
                            onClick={handleNewExibidora}
                            className="px-4 py-2 bg-emidias-accent text-white rounded-lg hover:bg-[#E01A6A] flex items-center gap-2 transition font-medium hover-lift shadow-lg"
                        >
                            <Plus size={20} />
                            <span>Cadastrar Exibidora</span>
                        </button>
                    </div>
                </div>

                {/* Grid de Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredExibidoras.map((exibidora) => (
                        <div
                            key={exibidora.id}
                            onClick={() => handleExibidoraClick(exibidora)}
                            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer hover-lift overflow-hidden group"
                        >
                            {/* Logo */}
                            <div className="h-32 bg-gradient-to-br from-emidias-primary to-emidias-accent flex items-center justify-center relative overflow-hidden">
                                {exibidora.logo_r2_key ? (
                                    <img
                                        src={api.getImageUrl(exibidora.logo_r2_key)}
                                        alt={exibidora.nome}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Building2 size={48} className="text-white/80" />
                                )}

                                {/* Badge de total de pontos */}
                                {exibidora.totalPontos > 0 && (
                                    <div className="absolute top-2 right-2 bg-white text-emidias-primary px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                                        {exibidora.totalPontos} ponto{exibidora.totalPontos !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            {/* Conteúdo */}
                            <div className="p-4">
                                {/* Nome */}
                                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emidias-accent transition line-clamp-1">
                                    {exibidora.nome}
                                </h3>

                                {/* CNPJ */}
                                {exibidora.cnpj && (
                                    <p className="text-xs text-gray-500 mb-3">
                                        CNPJ: {exibidora.cnpj}
                                    </p>
                                )}

                                {/* Regiões */}
                                {exibidora.cidades.length > 0 && (
                                    <div className="space-y-1.5">
                                        <div className="flex items-center gap-1.5 text-emidias-accent">
                                            <MapPin size={14} />
                                            <span className="text-xs font-semibold">Regiões de Atuação</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {exibidora.cidades.slice(0, 2).map((cidade, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                                                >
                                                    {cidade}
                                                </span>
                                            ))}
                                            {exibidora.cidades.length > 2 && (
                                                <span className="px-2 py-0.5 bg-emidias-accent/10 text-emidias-accent rounded-full text-xs font-medium">
                                                    +{exibidora.cidades.length - 2}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Call to action */}
                                <button className="mt-3 w-full py-1.5 bg-emidias-primary hover:bg-emidias-accent text-white rounded-lg font-medium transition text-xs">
                                    Ver Pontos no Mapa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {filteredExibidoras.length === 0 && exibidoras.length > 0 && (
                    <div className="text-center py-20">
                        <Search size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            Nenhuma exibidora encontrada
                        </h3>
                        <p className="text-gray-500">
                            Tente ajustar sua pesquisa
                        </p>
                    </div>
                )}

                {exibidoras.length === 0 && (
                    <div className="text-center py-20">
                        <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            Nenhuma exibidora cadastrada
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Adicione exibidoras para começar a gerenciar seus pontos OOH
                        </p>
                        <button
                            onClick={handleNewExibidora}
                            className="px-6 py-3 bg-emidias-accent text-white rounded-lg hover:bg-[#E01A6A] inline-flex items-center gap-2 transition font-medium hover-lift shadow-lg"
                        >
                            <Plus size={20} />
                            Cadastrar Primeira Exibidora
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
