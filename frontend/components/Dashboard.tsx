'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GoogleMap from '@/components/map/GoogleMap';
import Sidebar from '@/components/Sidebar';
import ExibidoraSidebar from '@/components/ExibidoraSidebar';
import CreatePointModal from '@/components/CreatePointModal';
import ExibidoraModal from '@/components/ExibidoraModal';
import MapFilters from '@/components/MapFilters';
import AddressSearch from '@/components/AddressSearch';
import NavigationMenu from '@/components/NavigationMenu';
import ExibidorasView from '@/components/ExibidorasView';
import ClientesView from '@/components/ClientesView';
import PropostasView from '@/components/PropostasView';
import CartTable from '@/components/CartTable';
import TrashView from '@/components/TrashView';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Plus, Filter, Menu, MapPin, Building2, Share2, LogIn, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import ShareModal from '@/components/ShareModal';
import Link from 'next/link';
import MainLayout from '@/components/layout/MainLayout';
import AccountsView from '@/components/AccountsView';
import { MapSkeleton } from '@/components/skeletons/MapSkeleton';
import { SkeletonTable } from '@/components/skeletons/SkeletonTable';

interface DashboardProps {
    initialProposalId?: string;
}

export default function Dashboard({ initialProposalId }: DashboardProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(true);
    const [showAccessRequest, setShowAccessRequest] = useState(false);
    const [requestSent, setRequestSent] = useState(false);
    const [userRole, setUserRole] = useState<string | null>(null);
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    const setPontos = useStore((state) => state.setPontos);
    const setExibidoras = useStore((state) => state.setExibidoras);
    const setModalOpen = useStore((state) => state.setModalOpen);
    const setMenuOpen = useStore((state) => state.setMenuOpen);
    const user = useStore((state) => state.user);
    const currentView = useStore((state) => state.currentView);
    const pontos = useStore((state) => state.pontos);
    const exibidoras = useStore((state) => state.exibidoras);
    const selectedProposta = useStore((state) => state.selectedProposta);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);
    const filterExibidora = useStore((state) => state.filterExibidora);
    const filterCidade = useStore((state) => state.filterCidade);
    const filterTipos = useStore((state) => state.filterTipos);
    const refreshProposta = useStore((state) => state.refreshProposta);

    // Share Modal State
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

    // View Modals State (Hoisted from children)
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);
    const [isPropostaModalOpen, setIsPropostaModalOpen] = useState(false);

    // Count active filters
    const activeFiltersCount = [
        filterExibidora.length > 0,
        filterCidade.length > 0,
        filterTipos.length > 0,
    ].filter(Boolean).length;

    const router = useRouter();
    const searchParams = useSearchParams();

    // Carregar dados iniciais e proposta se initialProposalId existir
    useEffect(() => {
        // Read both prop and query param
        const queryProposalId = searchParams?.get('id');
        const effectProposalId = initialProposalId || queryProposalId;

        // Check for "New Proposal" action
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');

        // Redirect EXTERNAL users (type='external') to their dashboard UNLESS they are creating a new proposal
        // Only check if authenticated
        const userState = JSON.parse(localStorage.getItem('ooh-auth-storage') || '{}')?.state?.user;
        const userType = userState?.type;
        setUserRole(userState?.role); // Keep setting role for other hook uses if needed, but logic depends on type

        if (isAuthenticated && userType === 'external' && action !== 'new' && !effectProposalId) {
            router.replace('/admin/proposals');
            return;
        }

        const loadData = async () => {
            try {
                setIsLoading(true);
                const [pontosData, exibidorasData] = await Promise.all([
                    api.getPontos(),
                    api.getExibidoras(),
                ]);

                setPontos(pontosData);
                setExibidoras(exibidorasData);

                // If initialProposalId is provided (Public/Shared View)
                if (effectProposalId) {


                    // ... (keep existing)

                    // Inside useEffect loadData
                    try {
                        const proposalId = parseInt(effectProposalId, 10);
                        if (isNaN(proposalId)) {
                            throw new Error('ID da proposta inválido');
                        }
                        const proposta = await api.getProposta(proposalId);
                        setSelectedProposta(proposta);
                        useStore.setState({ currentView: 'map' });
                    } catch (e: any) {
                        console.error('Erro ao carregar proposta inicial:', e);

                        if (e.message === 'Authentication required') {
                            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
                            const emailParam = searchParams?.get('email') ? `&email=${encodeURIComponent(searchParams.get('email')!)}` : '';
                            router.push(`/login?redirect=${returnUrl}${emailParam}`);
                            return;
                        }

                        // Check for Access Denied / Request Access
                        // If backend returns 403 'Access Denied'
                        if (e.message === 'Access Denied') {
                            setShowAccessRequest(true);
                            setIsLoading(false);
                            return;
                        }

                        setError(`Proposta não encontrada ou acesso negado. (${e.message || 'Erro desconhecido'})`);
                        return;
                    }
                }

                setError(null);
            } catch (err: any) {
                console.error('Erro ao carregar dados:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [setPontos, setExibidoras, initialProposalId, setSelectedProposta, isAuthenticated, router]);

    // Determine if it's a guest view
    const isGuest = !isAuthenticated;

    const handleRequestAccess = async () => {
        const proposalId = searchParams?.get('id');
        if (!proposalId) return;
        try {
            await api.requestProposalAccess(parseInt(proposalId));
            setRequestSent(true);
        } catch (e) {
            alert('Erro ao solicitar acesso');
        }
    };

    // Actions for TopBar based on current view
    const renderMapActions = () => (
        <>
            <Button
                onClick={() => setIsFiltersOpen(true)}
                variant="outline"
                className="shadow-sm border-gray-200 bg-white"
                leftIcon={<Filter size={18} />}
            >
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                    <span className="ml-1.5 bg-emidias-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {activeFiltersCount}
                    </span>
                )}
            </Button>

            {!isGuest && userRole !== 'client' && (
                <Button
                    onClick={() => setModalOpen(true)}
                    variant="accent"
                    className="shadow-accent shadow-emidias-accent/20"
                    leftIcon={<Plus size={18} strokeWidth={2.5} />}
                >
                    <span className="hidden sm:inline">Novo Ponto</span>
                </Button>
            )}
        </>
    );

    const renderClientesActions = () => (
        <Button
            onClick={() => setIsClientModalOpen(true)}
            variant="accent"
            className="shadow-accent shadow-emidias-accent/20"
            leftIcon={<Plus size={18} strokeWidth={2.5} />}
        >
            <span className="hidden sm:inline">Novo Cliente</span>
        </Button>
    );

    const renderPropostasActions = () => (
        <Button
            onClick={() => setIsPropostaModalOpen(true)}
            variant="accent"
            className="shadow-accent shadow-emidias-accent/20"
            leftIcon={<Plus size={18} strokeWidth={2.5} />}
        >
            <span className="hidden sm:inline">Nova Proposta</span>
        </Button>
    );

    const getActions = () => {
        switch (currentView) {
            case 'map': return renderMapActions();
            case 'clientes': return renderClientesActions();
            case 'propostas': return renderPropostasActions();
            default: return undefined;
        }
    };

    return (
        <MainLayout
            user={user}
            counts={{
                map: pontos.length,
                exibidoras: exibidoras.length
            }}
            actions={getActions()}
        >
            {/* Search Bar - Map View Only - Now integrated in TopBar or keep as floating? 
                User requested: "Depois: [Logo] [Breadcrumb] ... [Search] [Actions]" in TopBar. 
                For now, keeping the floating AddressSearch if needed, or rely on TopBar search. 
                But AddressSearch provides specialized Google Places autocomplete. 
                Let's keep it floating for Map View for now until we integrate fully into TopBar.
            */}
            {currentView === 'map' && !isLoading && (
                <div className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4 animate-fade-in-down pointer-events-none">
                    <div className="w-full max-w-xl pointer-events-auto">
                        <AddressSearch
                            onLocationSelect={(location) => setSearchLocation(location)}
                        />
                    </div>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="absolute inset-0 z-20 bg-emidias-gray-50">
                    {currentView === 'map' ? (
                        <MapSkeleton />
                    ) : (
                        // Generic skeleton for other views if not specific
                        <div className="p-8 flex items-center justify-center h-full">
                            <SkeletonTable rows={8} />
                        </div>
                    )}
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md mx-4 text-center animate-shake border border-gray-200">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin size={32} className="text-red-500" />
                        </div>
                        <h3 className="text-gray-900 font-bold text-xl mb-2">Erro ao carregar</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Button
                            onClick={() => window.location.reload()}
                            variant="primary"
                        >
                            Tentar novamente
                        </Button>
                    </div>
                </div>
            )}

            {/* Views */}
            {currentView === 'map' && !isLoading && !error && (
                <div className="h-full relative">
                    {/* Map Container */}
                    <div className="absolute inset-0">
                        <GoogleMap searchLocation={searchLocation} />
                    </div>

                    {/* Sidebars */}
                    {!isGuest && (
                        <>
                            <Sidebar />
                            <ExibidoraSidebar />
                        </>
                    )}

                    {/* Cart Table Overlay */}
                    {selectedProposta && (
                        <CartTable
                            proposta={selectedProposta}
                            isOpen={isCartOpen}
                            onToggle={() => setIsCartOpen(!isCartOpen)}
                            readOnly={isGuest || selectedProposta.currentUserRole === 'viewer' || selectedProposta.currentUserRole === 'none'}
                        />
                    )}
                </div>
            )}

            {currentView === 'exibidoras' && !isLoading && !error && <ExibidorasView />}
            {currentView === 'clientes' && !isLoading && !error && (
                <ClientesView
                    isModalOpen={isClientModalOpen}
                    onCloseModal={() => setIsClientModalOpen(false)}
                />
            )}
            {currentView === 'propostas' && !isLoading && !error && (
                <PropostasView
                    isModalOpen={isPropostaModalOpen}
                    onCloseModal={() => setIsPropostaModalOpen(false)}
                />
            )}
            {currentView === 'contas' && !isLoading && !error && <AccountsView />}
            {currentView === 'lixeira' && !isLoading && !error && <TrashView />}

            {/* Global Components */}
            <CreatePointModal />
            <ExibidoraModal />
            <MapFilters isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />
            <NavigationMenu />

            {/* Access Request UI */}
            {showAccessRequest && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-md mx-4 text-center animate-in fade-in zoom-in duration-300 border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock size={32} className="text-gray-500" />
                        </div>
                        <h3 className="text-gray-900 font-bold text-xl mb-2">Acesso Restrito</h3>
                        <p className="text-gray-600 mb-6">
                            {requestSent
                                ? 'Sua solicitação foi enviada ao proprietário. Você receberá um e-mail quando for aprovado.'
                                : 'Você não tem permissão para visualizar esta proposta. Solicite acesso para continuar.'}
                        </p>

                        {!requestSent ? (
                            <div className="flex flex-col gap-3">
                                <Button
                                    onClick={handleRequestAccess}
                                    variant="primary"
                                    className="w-full justify-center"
                                >
                                    Solicitar Acesso
                                </Button>
                                <Button
                                    onClick={() => router.push('/admin/proposals')}
                                    variant="ghost"
                                    className="w-full justify-center"
                                >
                                    Voltar
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={() => window.location.reload()}
                                variant="ghost"
                                className="w-full justify-center"
                            >
                                Verificar novamente
                            </Button>
                        )}
                    </div>
                </div>
            )}

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                proposta={selectedProposta}
                onUpdate={async () => {
                    if (selectedProposta && !isGuest) {
                        try {
                            const updated = await api.getProposta(selectedProposta.id);
                            refreshProposta(updated);
                        } catch (e) {
                            console.error('Failed to refresh proposal', e);
                        }
                    }
                }}
            />
        </MainLayout>
    );
}
