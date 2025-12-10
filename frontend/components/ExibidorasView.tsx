'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Building2, MapPin } from 'lucide-react';
import { useMemo } from 'react';

export default function ExibidorasView() {
    const exibidoras = useStore((state) => state.exibidoras);
    const pontos = useStore((state) => state.pontos);
    const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);

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
            };
        });
    }, [exibidoras, pontos]);

    const handleExibidoraClick = (exibidora: typeof exibidorasComStats[0]) => {
        // Filtrar mapa por essa exibidora
        setFilterExibidora(exibidora.id);

        // Selecionar exibidora para abrir gaveta
        setSelectedExibidora(exibidora);

        // Voltar para view de mapa
        setCurrentView('map');
    };

    return (
        <div className="h-full w-full overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-emidias-primary mb-2">
                        Exibidoras
                    </h1>
                    <p className="text-gray-600">
                        {exibidoras.length} exibidora{exibidoras.length !== 1 ? 's' : ''} cadastrada{exibidoras.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Grid de Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exibidorasComStats.map((exibidora) => (
                        <div
                            key={exibidora.id}
                            onClick={() => handleExibidoraClick(exibidora)}
                            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer hover-lift overflow-hidden group"
                        >
                            {/* Logo */}
                            <div className="h-40 bg-gradient-to-br from-emidias-primary to-emidias-accent flex items-center justify-center relative overflow-hidden">
                                {exibidora.logo_r2_key ? (
                                    <img
                                        src={api.getImageUrl(exibidora.logo_r2_key)}
                                        alt={exibidora.nome}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <Building2 size={64} className="text-white/80" />
                                )}

                                {/* Badge de total de pontos */}
                                {exibidora.totalPontos > 0 && (
                                    <div className="absolute top-3 right-3 bg-white text-emidias-primary px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                                        {exibidora.totalPontos} ponto{exibidora.totalPontos !== 1 ? 's' : ''}
                                    </div>
                                )}
                            </div>

                            {/* Conteúdo */}
                            <div className="p-5">
                                {/* Nome */}
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emidias-accent transition">
                                    {exibidora.nome}
                                </h3>

                                {/* CNPJ */}
                                {exibidora.cnpj && (
                                    <p className="text-sm text-gray-500 mb-4">
                                        CNPJ: {exibidora.cnpj}
                                    </p>
                                )}

                                {/* Regiões */}
                                {exibidora.cidades.length > 0 && (
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-emidias-accent">
                                            <MapPin size={16} />
                                            <span className="text-sm font-semibold">Regiões de Atuação</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {exibidora.cidades.slice(0, 3).map((cidade, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium"
                                                >
                                                    {cidade}
                                                </span>
                                            ))}
                                            {exibidora.cidades.length > 3 && (
                                                <span className="px-3 py-1 bg-emidias-accent/10 text-emidias-accent rounded-full text-xs font-medium">
                                                    +{exibidora.cidades.length - 3} cidades
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Call to action */}
                                <button className="mt-4 w-full py-2 bg-emidias-primary hover:bg-emidias-accent text-white rounded-lg font-medium transition text-sm">
                                    Ver Pontos no Mapa
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty state */}
                {exibidoras.length === 0 && (
                    <div className="text-center py-20">
                        <Building2 size={64} className="mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                            Nenhuma exibidora cadastrada
                        </h3>
                        <p className="text-gray-500">
                            Adicione exibidoras para começar a gerenciar seus pontos OOH
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
