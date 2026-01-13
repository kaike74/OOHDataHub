'use client';

import MainLayout from '@/components/layout/MainLayout';
import GoogleMap from '@/components/map/GoogleMap';
import CartTable from '@/components/CartTable';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { useProposalStore } from '@/stores/useProposalStore';
import { useProposalSync } from '@/hooks/useProposalSync';
import { MapSkeleton } from '@/components/skeletons/MapSkeleton';
import AddressSearch from '@/components/AddressSearch';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Filter, Search } from 'lucide-react';
import ProposalMapFilters from './ProposalMapFilters';

export default function ProposalDetailClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');
    const id = idParam ? Number(idParam) : null;

    // Legacy Store
    const {
        setPontos,
        setExibidoras,
        setSelectedProposta,
        selectedProposta: globalSelectedProposta
    } = useStore();

    // New Store
    const {
        setProposal,
        selectedProposal,
        ui,
        toggleCart
    } = useProposalStore();

    // Sync Hook
    const { isSaving } = useProposalSync();
    const [isLoading, setIsLoading] = useState(true);

    // Isolated Filter State for Proposal View
    const [filterPais, setFilterPais] = useState<string[]>([]);
    const [filterUF, setFilterUF] = useState<string[]>([]);
    const [filterCidade, setFilterCidade] = useState<string[]>([]);
    const [filterExibidora, setFilterExibidora] = useState<number[]>([]);
    const [filterTipos, setFilterTipos] = useState<string[]>([]);
    const [filterValorMin, setFilterValorMin] = useState<string>('');
    const [filterValorMax, setFilterValorMax] = useState<string>('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

    // Active filters count
    const activeFiltersCount = [
        filterPais.length > 0,
        filterUF.length > 0,
        filterCidade.length > 0,
        filterExibidora.length > 0,
        filterTipos.length > 0,
        filterValorMin !== '' || filterValorMax !== ''
    ].filter(Boolean).length;

    useEffect(() => {
        const loadContext = async () => {
            if (!id) return;

            try {
                // Fetch data
                const [proposta, pontosData, exibidorasData] = await Promise.all([
                    api.getProposta(id),
                    api.getPontos(),
                    api.getExibidoras(),
                ]);

                // Update Legacy Store
                setPontos(pontosData);
                setExibidoras(exibidorasData);
                setSelectedProposta(proposta);

                // Update New Store
                setProposal(proposta);

            } catch (err) {
                console.error("Error loading proposal context:", err);
                router.push('/propostas');
            } finally {
                setIsLoading(false);
            }
        };

        loadContext();
    }, [id, setPontos, setExibidoras, setSelectedProposta, setProposal, router]);

    // Breadcrumbs
    const breadcrumbs = [
        { label: 'Propostas', href: '/propostas' },
        { label: selectedProposal?.nome || globalSelectedProposta?.nome || `Proposta #${id}`, active: true }
    ];

    const [isTableOpen, setIsTableOpen] = useState(true);

    if (isLoading) return <MainLayout breadcrumbs={breadcrumbs}><MapSkeleton /></MainLayout>;

    return (
        <MainLayout breadcrumbs={breadcrumbs} fullScreen>
            <div className="relative h-[calc(100vh-64px)] overflow-hidden">
                {/* Map Section - Full Height */}
                <div className="absolute inset-0 w-full h-full z-0">
                    <GoogleMap
                        searchLocation={searchLocation}
                        forcedFilterPais={filterPais}
                        forcedFilterUF={filterUF}
                        forcedFilterCidade={filterCidade}
                        forcedFilterExibidora={filterExibidora}
                        forcedFilterTipos={filterTipos}
                        forcedFilterValorMin={filterValorMin ? parseFloat(filterValorMin) : null}
                        forcedFilterValorMax={filterValorMax ? parseFloat(filterValorMax) : null}
                    />
                </div>

                {/* Map Header Overlay (Search & Filters) */}
                <div className="absolute top-4 left-4 right-4 z-[40] pointer-events-none flex justify-center">
                    <div className="w-full max-w-4xl flex items-center gap-3 pointer-events-auto">
                        <div className="flex-1 shadow-emidias-lg rounded-xl overflow-hidden">
                            <AddressSearch onLocationSelect={setSearchLocation} />
                        </div>
                        <Button
                            onClick={() => setIsFiltersOpen(true)}
                            className={`h-[52px] w-[52px] rounded-xl shadow-emidias-lg transition-all ${activeFiltersCount > 0
                                ? 'bg-emidias-accent text-white hover:bg-emidias-accent-dark'
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <div className="relative">
                                <Filter size={20} />
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-emidias-accent text-[10px] font-bold rounded-full flex items-center justify-center border border-emidias-accent">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </div>
                        </Button>
                    </div>
                </div>

                <ProposalMapFilters
                    isOpen={isFiltersOpen}
                    onClose={() => setIsFiltersOpen(false)}
                    selectedPaises={filterPais}
                    setSelectedPaises={setFilterPais}
                    selectedUFs={filterUF}
                    setSelectedUFs={setFilterUF}
                    selectedCidades={filterCidade}
                    setSelectedCidades={setFilterCidade}
                    selectedExibidoras={filterExibidora}
                    setSelectedExibidoras={setFilterExibidora}
                    selectedTipos={filterTipos}
                    setSelectedTipos={setFilterTipos}
                    valorMin={filterValorMin}
                    setValorMin={setFilterValorMin}
                    valorMax={filterValorMax}
                    setValorMax={setFilterValorMax}
                />

                {/* Sidebar - Z-Index handled internally (z-[60]) */}
                <Sidebar />

                {/* Floating Cart Table */}
                <CartTable
                    isOpen={isTableOpen}
                    onToggle={() => setIsTableOpen(!isTableOpen)}
                    embedded={false}
                />

                {/* Auto-save Indicator */}
                {isSaving && (
                    <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        Salvando...
                    </div>
                )}
            </div>
        </MainLayout>
    );
}
