'use client';

import MainLayout from '@/components/layout/MainLayout';
import GoogleMap from '@/components/map/GoogleMap';
import PointsListSidebar from '@/components/proposals/PointsListSidebar';
import FixedProposalHeader from '@/components/proposals/FixedProposalHeader';
import CompactCartSummary from '@/components/proposals/CompactCartSummary';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { useProposalStore } from '@/stores/useProposalStore';
import { useProposalSync } from '@/hooks/useProposalSync';
import { MapSkeleton } from '@/components/skeletons/MapSkeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Map as MapIcon, List } from 'lucide-react';

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
        selectedProposal
    } = useProposalStore();

    // Sync Hook
    const { isSaving } = useProposalSync();

    const [isLoading, setIsLoading] = useState(true);
    const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

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
                {/* Fixed Header */}
                <FixedProposalHeader />

                {/* Main Content Area */}
                <div className="flex flex-1 pt-16 overflow-hidden relative">

                    {/* Mobile Tabs (Visible only on small screens) */}
                    <div className="md:hidden absolute top-16 left-0 right-0 z-30 bg-white border-b border-gray-200 flex">
                        <button
                            onClick={() => setMobileView('map')}
                            className={cn(
                                "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors",
                                mobileView === 'map' ? "border-black text-black" : "border-transparent text-gray-500"
                            )}
                        >
                            <MapIcon size={16} /> Mapa
                        </button>
                        <button
                            onClick={() => setMobileView('list')}
                            className={cn(
                                "flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors",
                                mobileView === 'list' ? "border-black text-black" : "border-transparent text-gray-500"
                            )}
                        >
                            <List size={16} /> Lista & Detalhes
                        </button>
                    </div>

                    {/* Left: Map Section */}
                    {/* On user mobile: Hide if view is list. On desktop: Always show. */}
                    <div className={cn(
                        "flex-1 relative h-full transition-opacity bg-gray-100",
                        mobileView === 'list' ? "hidden md:block" : "block"
                    )}>
                        <GoogleMap />
                    </div>

                    {/* Right: Sidebar Section */}
                    {/* On mobile: Hide if view is map. On desktop: Always show (fixed width). */}
                    <div className={cn(
                        "h-full bg-white z-20 shadow-lg relative border-l border-gray-200",
                        "w-full md:w-[400px] flex-shrink-0",
                        mobileView === 'map' ? "hidden md:block" : "block mt-12 md:mt-0" // Add margin for mobile tabs
                    )}>
                        <PointsListSidebar />
                    </div>
                </div>

                {/* Bottom: Cart Summary */}
                <CompactCartSummary />

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
