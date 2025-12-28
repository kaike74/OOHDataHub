'use client';

import { useMemo } from 'react';
import { useStore } from '@/lib/store';
import { MapPin, Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QuickFilters() {
    const pontos = useStore((state) => state.pontos);
    const filterCidade = useStore((state) => state.filterCidade);
    const filterTipos = useStore((state) => state.filterTipos);
    const setFilterCidade = useStore((state) => state.setFilterCidade);
    const setFilterTipos = useStore((state) => state.setFilterTipos);

    // Calculate Top Cities and Types
    const stats = useMemo(() => {
        const cityCounts: Record<string, number> = {};
        const typeCounts: Record<string, number> = {};

        pontos.forEach(p => {
            if (p.cidade) {
                cityCounts[p.cidade] = (cityCounts[p.cidade] || 0) + 1;
            }
            if (p.tipo) {
                const types = p.tipo.split(',').map(t => t.trim());
                types.forEach(t => {
                    if (t) typeCounts[t] = (typeCounts[t] || 0) + 1;
                });
            }
        });

        const topCities = Object.entries(cityCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5) // Top 5 Cities
            .map(([name]) => name);

        const topTypes = Object.entries(typeCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4) // Top 4 Types
            .map(([name]) => name);

        return { topCities, topTypes };
    }, [pontos]);

    const toggleCidade = (cidade: string) => {
        setFilterCidade(
            filterCidade.includes(cidade)
                ? filterCidade.filter(c => c !== cidade)
                : [...filterCidade, cidade]
        );
    };

    const toggleTipo = (tipo: string) => {
        setFilterTipos(
            filterTipos.includes(tipo)
                ? filterTipos.filter(t => t !== tipo)
                : [...filterTipos, tipo]
        );
    };

    if (pontos.length === 0) return null;

    return (
        <div className="fixed top-24 left-0 right-0 z-30 flex justify-center pointer-events-none animate-fade-in-up">
            <div className="flex gap-2 p-2 overflow-x-auto max-w-full px-4 pointer-events-auto hide-scrollbar">

                {/* City Pills */}
                {stats.topCities.map(city => {
                    const isActive = filterCidade.includes(city);
                    return (
                        <button
                            key={city}
                            onClick={() => toggleCidade(city)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-sm border",
                                isActive
                                    ? "bg-blue-500 text-white border-blue-600 shadow-blue-500/30"
                                    : "bg-white/80 text-gray-600 border-white/40 hover:bg-white hover:scale-105"
                            )}
                        >
                            <MapPin size={10} className={isActive ? "text-white" : "text-blue-500"} />
                            {city}
                            {isActive && <X size={10} className="ml-1 opacity-70" />}
                        </button>
                    );
                })}

                <div className="w-px h-6 bg-gray-300/50 mx-1" />

                {/* Type Pills */}
                {stats.topTypes.map(type => {
                    const isActive = filterTipos.includes(type);
                    return (
                        <button
                            key={type}
                            onClick={() => toggleTipo(type)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md transition-all shadow-sm border",
                                isActive
                                    ? "bg-purple-500 text-white border-purple-600 shadow-purple-500/30"
                                    : "bg-white/80 text-gray-600 border-white/40 hover:bg-white hover:scale-105"
                            )}
                        >
                            <Tag size={10} className={isActive ? "text-white" : "text-purple-500"} />
                            {type}
                            {isActive && <X size={10} className="ml-1 opacity-70" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
