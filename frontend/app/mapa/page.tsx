'use client';

import { useStore } from '@/lib/store';
import MainLayout from '@/components/layout/MainLayout';
import GoogleMap from '@/components/map/GoogleMap';
import Sidebar from '@/components/Sidebar';
import ExibidoraSidebar from '@/components/ExibidoraSidebar';
import MapFilters from '@/components/MapFilters';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { MapSkeleton } from '@/components/skeletons/MapSkeleton';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import AddressSearch from '@/components/AddressSearch';
import CreatePointModal from '@/components/CreatePointModal';

export default function MapaPage() {
    const { user, setPontos, setExibidoras, setModalOpen } = useStore();
    const [isLoading, setIsLoading] = useState(true);
    const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

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
            <div className="w-80 hidden md:block z-50">
                <AddressSearch onLocationSelect={setSearchLocation} />
            </div>
            <Button
                onClick={() => setModalOpen(true)}
                variant="accent"
                size="sm"
                leftIcon={<Plus size={16} />}
            >
                Novo Ponto
            </Button>
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
                            <GoogleMap searchLocation={searchLocation} />
                        </div>
                        <Sidebar />
                        <ExibidoraSidebar />
                        <MapFilters isOpen={false} onClose={() => { }} />
                        <CreatePointModal />
                    </>
                )}
            </div>
        </MainLayout>
    );
}
