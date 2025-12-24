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
    const [userRole, setUserRole] = useState<string | null>(null);
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    const setPontos = useStore((state) => state.setPontos);
    const setExibidoras = useStore((state) => state.setExibidoras);
    const setModalOpen = useStore((state) => state.setModalOpen);
    const setMenuOpen = useStore((state) => state.setMenuOpen);
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

        // Redirect client users to their dashboard UNLESS they are creating a new proposal
        // Only check role if authenticated
        const userRole = JSON.parse(localStorage.getItem('ooh-auth-storage') || '{}')?.state?.user?.role;
        setUserRole(userRole);

        if (isAuthenticated && userRole === 'client' && action !== 'new' && !effectProposalId) {
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
                    const [showAccessRequest, setShowAccessRequest] = useState(false);

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

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-emidias-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-emidias-primary to-[#0A0970] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 fixed top-0 left-0 right-0 h-[70px] border-b-4 border-emidias-accent shadow-xl text-white">
                {/* Logo OOH Data Hub - Left */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
                        <MapPin size={22} className="text-emidias-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            OOH Data Hub
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                            {pontos.length} pontos cadastrados
                        </p>
                    </div>
                </div>

                {/* Logo E-MÍDIAS - Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="text-xl font-bold tracking-tight text-white/90">
                        OOH DATA HUB
                    </div>
                </div>

                {/* Actions - Right */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {currentView === 'map' && (
                        <>
                            <div className="relative">
                                <Button
                                    onClick={() => setIsFiltersOpen(true)}
                                    variant="ghost"
                                    className="text-white/80 hover:text-white hover:bg-white/10"
                                    leftIcon={<Filter size={20} />}
                                >
                                    <span className="hidden sm:inline">Filtros</span>
                                </Button>
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emidias-accent text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-gentle pointer-events-none">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </div>

                            {/* Show Novo Ponto ONLY if logged in AND not viewing a selected proposal */}
                            {!isGuest && !selectedProposta && userRole !== 'client' && (
                                <Button
                                    onClick={() => setModalOpen(true)}
                                    variant="accent"
                                    className="shadow-accent"
                                    leftIcon={<Plus size={20} strokeWidth={2.5} />}
                                >
                                    <span className="hidden sm:inline">Novo Ponto</span>
                                </Button>
                            )}
                        </>
                    )}

                    {/* Menu Button or Login Button */}
                    {isGuest ? (
                        <Link href="/login">
                            <Button
                                variant="accent"
                                leftIcon={<LogIn size={18} />}
                                className="shadow-accent animate-pulse-subtle"
                            >
                                Entrar
                            </Button>
                        </Link>
                    ) : (
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                            title="Menu"
                        >
                            <Menu size={24} />
                        </button>
                    )}

                </div>
            </header>

            {/* Search Bar - Map View Only */}
            {currentView === 'map' && !isLoading && (
                <div className="fixed top-[86px] left-0 right-0 z-30 flex justify-center px-4 animate-fade-in-down">
                    <div className="w-full max-w-xl">
                        <AddressSearch
                            onLocationSelect={(location) => setSearchLocation(location)}
                        />
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 relative mt-[70px]">
                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 z-20 bg-emidias-gray-50 p-6 flex gap-6 animate-pulse">
                        {/* Simulate Map/Content Area */}
                        <div className="flex-1 bg-gray-200 rounded-2xl h-full shadow-inner opacity-70"></div>
                        {/* Simulate Sidebar (Desktop only) */}
                        <div className="hidden lg:block w-80 bg-gray-200 rounded-2xl h-full shadow-inner opacity-70"></div>

                        {/* Loading Indicator Overlay */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full border-4 border-gray-300 border-t-emidias-accent animate-spin mb-4"></div>
                                <MapPin size={24} className="text-emidias-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+16px)]" />
                            </div>
                            <p className="text-emidias-primary font-bold text-lg">Carregando OOH Data Hub...</p>
                        </div>
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
                        {/* Map Container with subtle shadow */}
                        <div className="absolute inset-0">
                            <GoogleMap searchLocation={searchLocation} />
                        </div>

                        {/* Stats Badge - Bottom Left */}
                        <div className="absolute bottom-6 left-6 z-10 hidden lg:flex items-center gap-3">
                            <div className="bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg border border-white/20 flex items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emidias-accent rounded-full animate-pulse" />
                                    <span className="text-sm font-semibold text-gray-900">{pontos.length}</span>
                                    <span className="text-sm text-gray-500">pontos</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300" />
                                <div className="flex items-center gap-2">
                                    <Building2 size={14} className="text-emidias-primary" />
                                    <span className="text-sm font-semibold text-gray-900">{exibidoras.length}</span>
                                    <span className="text-sm text-gray-500">exibidoras</span>
                                </div>
                            </div>
                        </div>

                        {/* Sidebars - Hide if isGuest or minimal view needed? */}
                        {/* Assuming sidebar is only for admin/authenticated features unless public users need to see point details. */}
                        {/* Usually public link is just map + proposal cart table. Sidebar for selecting points might confusing if they can't add to proposal. */}
                        {/* But if they select a pin on map, Sidebar might show details. Let's keep it but ensure 'add to proposal' logic is guarded. */}
                        <Sidebar />
                        <ExibidoraSidebar />

                        {/* Cart Table Overlay */}
                        {selectedProposta && (
                            <CartTable
                                proposta={selectedProposta}
                                isOpen={isCartOpen}
                                onToggle={() => setIsCartOpen(!isCartOpen)}
                                readOnly={isGuest}
                            />
                        )}
                    </div>
                )}

                {currentView === 'exibidoras' && !isLoading && !error && <ExibidorasView />}
                {currentView === 'clientes' && !isLoading && !error && <ClientesView />}
                {currentView === 'propostas' && !isLoading && !error && <PropostasView />}
                {currentView === 'lixeira' && !isLoading && !error && <TrashView />}

                {/* Global Components */}
                <CreatePointModal />
                <ExibidoraModal />
                <MapFilters isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />
                {/* Removed duplicate MapFilters */}
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

                {/* Share Modal - Only for authenticated users usually, but guests might view? No, guests can't share. */}
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
            </main>
        </div>
    );
}
