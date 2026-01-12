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
import { useRouter, useSearchParams } from 'next/navigation';

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
                    <GoogleMap />
                </div>

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
