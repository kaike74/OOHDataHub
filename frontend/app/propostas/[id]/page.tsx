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
import { useParams, useRouter } from 'next/navigation';

export default function ProposalMapPage() {
    const params = useParams();
    const router = useRouter();
    const {
        user,
        setPontos,
        setExibidoras,
        setSelectedProposta,
        selectedProposta
    } = useStore();
    const [isLoading, setIsLoading] = useState(true);

    const proposalId = Number(params.id);

    useEffect(() => {
        const loadContext = async () => {
            if (!proposalId) return;

            try {
                // If we don't have the proposal loaded or it's different, fetch it
                if (!selectedProposta || selectedProposta.id !== proposalId) {
                    const proposta = await api.getProposta(proposalId);
                    setSelectedProposta(proposta);
                }

                // Load critical map data
                // For a specific proposal, we might only need points related to it?
                // Or if we are editing, we need all points to add?
                // Assuming "Edit Mode" needs all points.
                // Assuming "View Mode" (External) might be restricted.

                const [pontosData, exibidorasData] = await Promise.all([
                    api.getPontos(),
                    api.getExibidoras(),
                ]);

                setPontos(pontosData);
                setExibidoras(exibidorasData);
            } catch (err) {
                console.error("Error loading proposal context:", err);
                // If error (e.g. 404 or prohibited), redirect
                router.push('/propostas');
            } finally {
                setIsLoading(false);
            }
        };

        loadContext();
    }, [proposalId, setPontos, setExibidoras, setSelectedProposta, router]);

    // Breadcrumbs
    const breadcrumbs = [
        { label: 'Propostas', href: '/propostas' },
        { label: selectedProposta?.nome || `Proposta #${proposalId}`, active: true }
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
