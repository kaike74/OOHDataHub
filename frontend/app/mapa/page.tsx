'use client';

import { useStore } from '@/lib/store';
import MainLayout from '@/components/layout/MainLayout';
import GoogleMap from '@/components/map/GoogleMap';
import PointDetailsModal from '@/components/PointDetailsModal'; // REPLACED Sidebar
import ExhibitorDetailModal from '@/components/exhibitors/ExhibitorDetailModal';
import MapFilters from '@/components/MapFilters';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { MapSkeleton } from '@/components/skeletons/MapSkeleton';
import { Button } from '@/components/ui/Button';
import { Filter as FilterIcon } from 'lucide-react';
import AddressSearch from '@/components/AddressSearch';
import CreatePointModal from '@/components/CreatePointModal';
import { ActionButton } from '@/components/ui/PageComponents';

export default function MapaPage() {
    const {
        user,
        setPontos,
        setExibidoras,
        setModalOpen,
        setSelectedProposta,
        setCustomLayers,
        setSelectedPonto,
        setSelectedExibidora,
        setEditingPonto
    } = useStore();
    const [isLoading, setIsLoading] = useState(true);
    const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Initial Cleanup
    useEffect(() => {
        setSelectedProposta(null);
        setCustomLayers([]);
        setSelectedPonto(null);
        setSelectedExibidora(null);
        setEditingPonto(null);
    }, [setSelectedProposta, setCustomLayers, setSelectedPonto, setSelectedExibidora, setEditingPonto]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [pontosData, exibidorasData] = await Promise.all([
                    api.getPontos(),
                    api.getExibidoras(),
                ]);
                setPontos(pontosData);
                setExibidoras(exibidorasData);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [setPontos, setExibidoras]);

    if (user?.type === 'external') {
        return (
            <MainLayout>
                <div className="p-8 text-center text-gray-500">
                    Acesso restrito a usuários internos.
                </div>
            </MainLayout>
        );
    }

    const actions = (
        <div className="flex items-center gap-3">
            <div className="relative z-50">
                <AddressSearch
                    onLocationSelect={setSearchLocation}
                    onSelectExhibitor={(id) => {
                        const exibidora = useStore.getState().exibidoras.find(e => e.id === id);
                        if (exibidora) {
                            useStore.getState().setFilterExibidora([id]);
                            useStore.getState().setSelectedExibidora(exibidora);
                            useStore.getState().setCurrentView('map');
                            // Optional: Clear other filters?
                        }
                    }}
                />
            </div>

            <Button
                onClick={() => setIsFilterOpen(true)}
                variant="outline"
                size="sm" // Use generic size or "icon" if preferred
                className="h-[40px] px-3 border-gray-200 hover:border-plura-primary hover:text-plura-primary"
                leftIcon={<FilterIcon size={16} />}
            >
                Filtros
            </Button>

            <ActionButton
                onClick={() => setModalOpen(true)}
                label="Novo Ponto"
            />
        </div>
    );

    return (
        <MainLayout
            actions={actions}
            breadcrumbs={[{ label: 'Mapa', href: '/mapa', active: true }]}
        >
            <div className="h-full w-full relative">
                {isLoading ? <MapSkeleton /> : (
                    <>
                        <div className="absolute inset-0">
                            <GoogleMap searchLocation={searchLocation} showProposalActions={false} />
                        </div>
                        {/* New Modal instead of Sidebar */}
                        <PointDetailsModal />
                        <ExhibitorDetailModal />
                        <MapFilters isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
                        <CreatePointModal />
                    </>
                )}
            </div>
        </MainLayout>
    );
}
