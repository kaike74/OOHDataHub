'use client';

import MainLayout from '@/components/layout/MainLayout';
import GoogleMap from '@/components/map/GoogleMap';
import Sidebar from '@/components/Sidebar';
import ExibidoraSidebar from '@/components/ExibidoraSidebar';
import MapFilters from '@/components/MapFilters';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { MapSkeleton } from '@/components/skeletons/MapSkeleton';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProposalDetailClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');
    const id = idParam ? Number(idParam) : null;

    const {
        setPontos,
        setExibidoras,
        setSelectedProposta,
        selectedProposta
    } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadContext = async () => {
            if (!id) return;

            try {
                // If we don't have the proposal loaded or it's different, fetch it
                if (!selectedProposta || selectedProposta.id !== id) {
                    const proposta = await api.getProposta(id);
                    setSelectedProposta(proposta);
                }

                const [pontosData, exibidorasData] = await Promise.all([
                    api.getPontos(),
                    api.getExibidoras(),
                ]);

                setPontos(pontosData);
                setExibidoras(exibidorasData);
            } catch (err) {
                console.error("Error loading proposal context:", err);
                router.push('/propostas');
            } finally {
                setIsLoading(false);
            }
        };

        loadContext();
    }, [id, setPontos, setExibidoras, setSelectedProposta, router]);

    // Breadcrumbs
    const breadcrumbs = [
        { label: 'Propostas', href: '/propostas' },
        { label: selectedProposta?.nome || `Proposta #${id}`, active: true }
    ];

    return (
        <MainLayout breadcrumbs={breadcrumbs}>
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
