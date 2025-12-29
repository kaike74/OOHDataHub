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

export default function MapaPage() {
    const { user, setPontos, setExibidoras } = useStore();
    const [isLoading, setIsLoading] = useState(true);

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

    return (
        <MainLayout>
            <div className="h-full w-full relative">
                {isLoading ? <MapSkeleton /> : (
                    <>
                        <div className="absolute inset-0">
                            <GoogleMap />
                        </div>
                        <Sidebar />
                        <ExibidoraSidebar />
                        <MapFilters isOpen={false} onClose={() => { }} />
                    </>
                )}
            </div>
        </MainLayout>
    );
}
