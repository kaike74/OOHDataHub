'use client';

import MainLayout from '@/components/layout/MainLayout';
import GoogleMap from '@/components/map/GoogleMap';
import CartTable from '@/components/CartTable';
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

    if (isLoading) return <MainLayout breadcrumbs={breadcrumbs}><MapSkeleton /></MainLayout>;

    return (
        <MainLayout breadcrumbs={breadcrumbs} fullScreen>
            <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
                {/* Map Section - Top Half (approx 60% height) */}
                <div className="h-[60%] relative bg-gray-100 w-full shrink-0">
                    <GoogleMap />
                </div>

                {/* Table Section - Bottom Half (Remaining space) */}
                <div className="flex-1 overflow-hidden relative border-t border-gray-200">
                    <CartTable
                        isOpen={true}
                        onToggle={() => { }}
                        embedded={true}
                    />
                </div>

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
