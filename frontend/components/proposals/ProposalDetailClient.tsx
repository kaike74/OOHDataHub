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
import { Filter, Search, User, LogIn, CheckCircle, Lock } from 'lucide-react';
import ProposalMapFilters from './ProposalMapFilters';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import ShareModal from '@/components/ShareModal';
import { toast } from 'sonner';

export default function ProposalDetailClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const idParam = searchParams.get('id');
    const tokenParam = searchParams.get('token');

    // Determine mode
    // If we have a TOKEN, it is strictly Public Access (via token)
    // If we have an ID, it is Internal Access (or public via ID if supported, but usually ID=Internal)
    const token = tokenParam;
    const numericId = idParam ? Number(idParam) : null;

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
    const [permission, setPermission] = useState<'viewer' | 'editor' | 'admin'>('viewer');

    // Check if user is authenticated
    const { isAuthenticated, user } = useStore();

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
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
            if (!token && !numericId) return;

            try {
                let proposta: any;
                let isPublic = false;

                // 1. Try to fetch proposal
                if (token) {
                    // Public Access via Token (Bypasses Auth)
                    proposta = await api.getPublicProposal(token);
                    isPublic = true;
                } else if (numericId) {
                    // Fetch by ID
                    try {
                        proposta = await api.getProposta(numericId);
                        // If we are here, we either have auth or it's public readable
                        // Check explicit public access if unauthenticated
                        if (!isAuthenticated && proposta.public_access_level !== 'view') {
                            throw new Error('Access denied');
                        }
                        if (!isAuthenticated) isPublic = true;
                    } catch (e) {
                        // If failed, and we are unauthenticated, maybe try public endpoint just in case logic differs?
                        // But usually getProposta handles it.
                        throw e;
                    }
                }

                if (!proposta) throw new Error('Proposal not found');

                // 2. Determine Permissions
                // Logic: 
                // - Owner/Master -> Admin
                // - Shared with Email (Editor) -> Editor
                // - Public Access Only -> Viewer

                let userRole = 'viewer';
                if (isAuthenticated && user) {
                    if (proposta.id_usuario === user.id || user.role === 'master') {
                        userRole = 'admin';
                    } else if (proposta.sharedUsers?.find((u: any) => u.email === user.email)?.role) {
                        userRole = proposta.sharedUsers.find((u: any) => u.email === user.email).role;
                    }
                } else {
                    // Unauthenticated - check if token grants edit? (Usually not, tokens are view-only unless specific invite token)
                    // For now assume public view is read-only
                    userRole = 'viewer';
                }

                setPermission(userRole as any);
                setIsPublicView(isPublic);

                // 3. Load Dependencies (Points, etc)
                // If public, we only load RELEVANT points (optimization & security)
                // Actually, to show the MAP, do we want to show OTHER points? 
                // User said: "apenas com os pontos selecionados" (only selected points).

                // 3. Load Dependencies (Points, etc)
                // If public, we only load RELEVANT points (optimization & security)
                // Actually, to show the MAP, do we want to show OTHER points? 
                // User said: "apenas com os pontos selecionados" (only selected points).

                let pontosData: any[] = [];
                let exibidorasData: any[] = [];
                let clientsData: any[] = [];

                if (!isPublic) {
                    // Internal View: Fetch all data for full map exploration
                    [pontosData, exibidorasData, clientsData] = await Promise.all([
                        api.getPontos(),
                        api.getExibidoras(),
                        api.getClientes()
                    ]);
                } else {
                    // Public View: WE DO NOT FETCH ALL POINTS.
                    // We must rely on the proposal's items to build the 'pontos' list.
                    // Assuming proposal.itens contains the point data or we need to fetch them specifically if not hydrated.
                    // Usually `getPublicProposal` should return expanded items.
                    // If items have `ponto` object nested:
                    if (proposta.itens) {
                        pontosData = proposta.itens.map((item: any) => item.ponto).filter(Boolean);
                    }

                    // Same for client, if nested or we use the one in proposal
                    if (proposta.cliente) {
                        clientsData = [proposta.cliente];
                    }
                }

                // Filter points if public view
                // Filter points if public view
                // In public view, pointsData is ALREADY filtered to just the proposal items above.
                const relevantPoints = isPublic
                    ? pontosData
                    : pontosData; // For internal view, we might keep all or filter later. Keeping logic simple.

                setPontos(relevantPoints);
                setExibidoras(exibidorasData);
                setSelectedProposta(proposta);

                // Enrich Proposal
                const enrichedProposal = {
                    ...proposta,
                    // If public, client might already be attached or found in the single-item clientsData array
                    cliente: isPublic ? proposta.cliente : clientsData.find((c: any) => c.id === proposta.id_cliente)
                };
                setProposal(enrichedProposal);

            } catch (err) {
                console.error("Error loading proposal context:", err);
                setAccessDenied(true);
            } finally {
                setIsLoading(false);
            }
        };

        loadContext();
    }, [token, numericId, isAuthenticated, user, setPontos, setExibidoras, setSelectedProposta, setProposal]);

    // Breadcrumbs
    const breadcrumbs = [
        { label: 'Propostas', href: '/propostas' },
        ...(selectedProposal?.cliente ? [{
            label: `${selectedProposal.cliente?.nome || 'Cliente'} ${selectedProposal.comissao ? `(${selectedProposal.comissao})` : ''}`,
            href: '#'
        }] : []),
        { label: selectedProposal?.nome || globalSelectedProposta?.nome || `Proposta #${idParam}`, active: true }
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
            {/* Share Button for Internal/Admin users */}
            {(permission === 'admin' || permission === 'editor') && ( // Editor usually can't share? Assuming Admin only for sharing initially, or check logic
                <Button
                    onClick={() => setIsShareModalOpen(true)}
                    variant="accent"
                    size="sm"
                >
                    Compartilhar
                </Button>
            )}
        </div>
    );

    if (isLoading) {
        return <MapSkeleton />;
    }

    if (accessDenied) {
        // ... (Keep existing access denied screen)
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-yellow-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h1>
                    <p className="text-gray-600 mb-6">
                        Esta proposta não está disponível. Verifique o link ou faça login.
                    </p>
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => router.push(`/auth/login?redirect=/propostas?id=${numericId || ''}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        >
                            Fazer Login
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Public Header Component
    const PublicHeader = () => (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 z-50 relative shadow-sm">
            <div className="flex items-center gap-4">
                {/* Client Logo or Default */}
                {selectedProposal?.cliente?.logo_url ? (
                    <img src={selectedProposal.cliente.logo_url} alt="Logo" className="h-10 w-auto object-contain" />
                ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-400">LOGO</span>
                    </div>
                )}

                <div className="h-8 w-px bg-gray-200 mx-2" />

                <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">
                        {selectedProposal?.nome || 'Proposta Sem Título'}
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>Criado por {selectedProposal?.usuario?.nome || 'Usuário'}</span>
                        <span>•</span>
                        <span>{new Date(selectedProposal?.created_at || Date.now()).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {!isAuthenticated ? (
                    <>
                        <Button
                            onClick={() => router.push('/auth/signup')}
                            variant="outline"
                            size="sm"
                        >
                            Criar Conta
                        </Button>
                        <Button
                            onClick={() => router.push(`/auth/login?redirect=/propostas?id=${idParam}`)}
                            variant="accent"
                            size="sm"
                            leftIcon={<LogIn size={16} />}
                        >
                            Login
                        </Button>
                    </>
                ) : (
                    // Authenticated Actions in Public View (e.g. if viewing as guest/client)
                    permission === 'admin' ? (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Admin View</span>
                        </div>
                    ) : (
                        <Button variant="outline" size="sm">Solicitar Edição</Button>
                    )
                )}

                {permission === 'admin' && ( // "Solicitar validação e aprovar" logic
                    <Button variant="accent" size="sm" leftIcon={<CheckCircle size={16} />}>
                        Aprovar
                    </Button>
                )}
            </div>
        </div>
    );

    // If Public View, we bypass MainLayout's header/nav
    // Or we use MainLayout but minimal? 
    // MainLayout forces Sidebar and BottomNav. We want Sidebar.
    // If we use MainLayout, we get the standard TopBar.
    // We can conditionally render MainLayout or a CustomLayout.

    const content = (
        <div className="relative h-full w-full overflow-hidden flex flex-col">
            {/* Map Section */}
            <div className="relative flex-1 w-full h-full z-0">
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

            {/* Sidebar */}
            <Sidebar />

            {/* Floating Cart Table */}
            <CartTable
                isOpen={isTableOpen}
                onToggle={() => setIsTableOpen(!isTableOpen)}
                embedded={false}
                readOnly={permission === 'viewer'} // Implement readOnly prop in CartTable if not exists
            />

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                proposta={selectedProposal}
            />
        </div>
    );

    if (isPublicView) {
        return (
            <div className="flex flex-col h-screen bg-gray-50">
                <PublicHeader />
                <div className="flex-1 relative overflow-hidden">
                    {content}
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
            {content}
        </MainLayout>
    );
}
