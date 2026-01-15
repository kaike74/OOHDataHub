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
    const [isPublicView, setIsPublicView] = useState(false);
    const [accessDenied, setAccessDenied] = useState(false);

    // Check if user is authenticated
    const isAuthenticated = useStore(state => state.isAuthenticated);

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
                // If not authenticated, try to fetch as public proposal
                if (!isAuthenticated) {
                    try {
                        // Try to get proposal - if it's public, API will return it
                        const proposta = await api.getProposta(id);

                        // Check if proposal has public access
                        if (proposta.public_access_level === 'view') {
                            setIsPublicView(true);

                            // Load minimal data for public view
                            const [pontosData, exibidorasData] = await Promise.all([
                                api.getPontos(),
                                api.getExibidoras()
                            ]);

                            setPontos(pontosData);
                            setExibidoras(exibidorasData);
                            setSelectedProposta(proposta);
                            setProposal(proposta);
                        } else {
                            // Proposal exists but is not public
                            setAccessDenied(true);
                        }
                    } catch (err: any) {
                        // Proposal doesn't exist or user doesn't have access
                        setAccessDenied(true);
                    }
                } else {
                    // Authenticated user - normal flow
                    const [proposta, pontosData, exibidorasData, clientsData] = await Promise.all([
                        api.getProposta(id),
                        api.getPontos(),
                        api.getExibidoras(),
                        api.getClientes()
                    ]);

                    // Update Legacy Store
                    setPontos(pontosData);
                    setExibidoras(exibidorasData);
                    setSelectedProposta(proposta);

                    // Update New Store (Enrich with Client)
                    const enrichedProposal = {
                        ...proposta,
                        cliente: clientsData.find((c: any) => c.id === proposta.id_cliente)
                    };
                    setProposal(enrichedProposal);
                }
            } catch (err) {
                console.error("Error loading proposal context:", err);
                if (isAuthenticated) {
                    router.push('/propostas');
                } else {
                    setAccessDenied(true);
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadContext();
    }, [id, isAuthenticated, setPontos, setExibidoras, setSelectedProposta, setProposal, router]);

    // Breadcrumbs
    const breadcrumbs = [
        { label: 'Propostas', href: '/propostas' },
        ...(selectedProposal?.cliente ? [{
            label: `${selectedProposal.cliente?.nome || 'Cliente'} ${selectedProposal.comissao ? `(${selectedProposal.comissao})` : ''}`,
            href: '#' // Non-clickable or route to client?
        }] : []),
        { label: selectedProposal?.nome || globalSelectedProposta?.nome || `Proposta #${id}`, active: true }
    ];

    const [isTableOpen, setIsTableOpen] = useState(true);

    const actions = (
        <div className="flex items-center gap-3">
            <div className="relative z-50 w-64 md:w-80">
                <AddressSearch onLocationSelect={setSearchLocation} />
            </div>
            <Button
                onClick={() => setIsFiltersOpen(true)}
                variant="outline"
                size="sm"
                className={`h-[40px] px-3 border-gray-200 hover:border-emidias-accent hover:text-emidias-accent ${activeFiltersCount > 0 ? 'border-emidias-accent text-emidias-accent bg-emidias-accent/5' : ''}`}
                leftIcon={<Filter size={16} />}
            >
                Filtros
                {activeFiltersCount > 0 && (
                    <span className="ml-2 bg-emidias-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {activeFiltersCount}
                    </span>
                )}
            </Button>
        </div>
    );

    if (isLoading) {
        return <MapSkeleton />;
    }

    // Access Denied Screen for unauthenticated users
    if (accessDenied) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
                    <p className="text-gray-600 mb-6">
                        Esta proposta não está disponível publicamente. Faça login para visualizar.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push(`/auth/login?redirect=/propostas?id=${id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        >
                            Fazer Login
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/signup')}
                            variant="outline"
                            className="w-full"
                        >
                            Criar Conta
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <MainLayout
            breadcrumbs={breadcrumbs}
            fullScreen
            actions={actions}
        >
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

            </div>
        </MainLayout>
    );
}
