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
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import CartTable from '@/components/CartTable';

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
    const [isCartOpen, setIsCartOpen] = useState(true);

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
                        <ExibidoraSidebar />
                        <MapFilters isOpen={false} onClose={() => { }} />

                        {/* Cart Overlay */}
                        <div className={`absolute bottom-0 left-0 right-0 z-10 transition-transform duration-300 ${isCartOpen ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'}`}>
                            {/* Toggle Handle (Only visible when closed, or part of header) */}
                            <div className="flex justify-center -mb-px relative z-20 pointer-events-none">
                                <button
                                    onClick={() => setIsCartOpen(!isCartOpen)}
                                    className="bg-white border text-emidias-primary border-gray-200 border-b-0 rounded-t-xl px-4 py-1.5 shadow-sm hover:bg-gray-50 flex items-center gap-2 pointer-events-auto transition-colors"
                                >
                                    <span className="text-xs font-bold uppercase tracking-wider">
                                        {isCartOpen ? 'Ocultar Itens' : 'Ver Itens da Proposta'}
                                    </span>
                                    {isCartOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                </button>
                            </div>

                            <div className="bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] h-[400px] flex flex-col pointer-events-auto">
                                <div className="flex-1 overflow-hidden relative">
                                    <CartTable
                                        isOpen={isCartOpen}
                                        onToggle={() => setIsCartOpen(!isCartOpen)}
                                        proposta={selectedProposta || undefined}
                                        readOnly={true}
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </MainLayout >
    );
}
