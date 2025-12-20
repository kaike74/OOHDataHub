'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import GoogleMap from '@/components/map/GoogleMap';
import CartTable from '@/components/CartTable';
import { Loader2, LogOut, MapPin, ArrowLeft, User } from 'lucide-react';
import { Proposta, PropostaItem, Ponto } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';

// Helper to map flat item to Ponto
const mapItemToPonto = (item: any): Ponto => ({
    id: item.id_ooh || item.id, // Fallback
    codigo_ooh: item.codigo_ooh,
    endereco: item.endereco,
    bairro: item.bairro,
    cidade: item.cidade,
    uf: item.uf,
    cep: '', // Not returned by minimal query usually
    latitude: item.latitude,
    longitude: item.longitude,
    medidas: item.medidas,
    tipo: item.tipo,
    id_exibidora: item.id_exibidora,
    // Defaults for missing checks
    pais: 'Brasil',
    fluxo: 'N/A',
    tipos: [],
    observacoes: '',
    status: item.status || 'disponivel', // Default for safety
    created_at: '',
    updated_at: '',
    created_by: 0,
    updated_by: 0
} as unknown as Ponto);

const PortalViewContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeProposta, setActiveProposta] = useState<Proposta | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(true);

    const setPontos = useStore((state) => state.setPontos);
    const setExibidoras = useStore((state) => state.setExibidoras); // Maybe empty?

    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check auth on mount to avoid hydration mismatch
        const auth = localStorage.getItem('ooh-client-auth-storage');
        setIsAuthenticated(!!auth);
    }, []);

    useEffect(() => {
        const loadProposal = async () => {
            const token = searchParams.get('token');
            const id = searchParams.get('id');

            if (!token && !id) {
                setError('Proposta não especificada');
                setIsLoading(false);
                return;
            }

            try {
                let data: Proposta;

                if (token) {
                    data = await api.getPublicProposal(token);
                } else {
                    // Authenticated - api client handles token automatically
                    data = await api.getPortalProposal(Number(id));
                }

                if (data && data.itens) {
                    // Map items to fix prices and types
                    const processedItems = data.itens.map((item: any) => ({
                        ...item,
                        // Map total value to locacao for the table display if needed
                        valor_locacao: item.valor_total || item.valor_locacao || 0,
                        valor_papel: 0,
                        valor_lona: 0,
                    }));

                    data.itens = processedItems;
                    setActiveProposta(data);

                    // Fetch ALL available points ONLY if authenticated (not public token)
                    // Public view restricts to only showing the proposal points
                    if (!token) {
                        try {
                            const allPoints = await api.getPortalPoints();

                            // Map all points
                            const mappedPoints = allPoints.map((p: any) => ({
                                ...p,
                                // Ensure basic Ponto structure
                                tipos: [],
                                observacoes: '',
                                status: 'disponivel', // Default
                                pais: 'Brasil',
                                fluxos: 'N/A',
                                created_at: '',
                                updated_at: '',
                                created_by: 0,
                                updated_by: 0
                            }));

                            setPontos(mappedPoints);

                        } catch (e) {
                            console.error("Failed to fetch all points for portal map", e);
                            // Fallback: just use proposal items
                            const points = data.itens.map((item: any) => mapItemToPonto(item))
                                .filter((p, index, self) =>
                                    index === self.findIndex((t) => t.id === p.id)
                                );
                            setPontos(points);
                        }
                    } else {
                        // Public mode: only show proposal points
                        const points = data.itens.map((item: any) => mapItemToPonto(item))
                            .filter((p, index, self) =>
                                index === self.findIndex((t) => t.id === p.id)
                            );
                        setPontos(points);
                    }
                }

            } catch (err: any) {
                console.error(err);
                if (err.message === 'Unauthorized' || err.status === 401) {
                    router.push('/login');
                } else {
                    setError(err.message || 'Erro ao carregar proposta');
                }
            } finally {
                setIsLoading(false);
            }
        };

        loadProposal();
    }, [searchParams, setPontos, router]);

    if (isLoading) {
        return (
            <div className="h-screen w-screen flex flex-col relative bg-gray-50 overflow-hidden">
                <div className="absolute top-0 left-0 right-0 z-50 p-4">
                    <Skeleton className="h-20 w-full max-w-screen-xl mx-auto rounded-2xl" />
                </div>
                <div className="flex-1 bg-gray-200 animate-pulse" />
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-white z-40 p-4">
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LogOut size={32} className="text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Erro</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button
                        onClick={() => router.push('/login')}
                        variant="primary"
                    >
                        Voltar para Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 relative">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-4 flex items-center justify-between pointer-events-auto max-w-screen-xl mx-auto animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-4">
                        <Button
                            onClick={() => router.back()}
                            variant="ghost"
                            size="icon"
                            className="rounded-full h-10 w-10"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg leading-tight">{activeProposta?.nome}</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{activeProposta?.itens?.length || 0} pontos</span>
                                <span>•</span>
                                <span>{new Date(activeProposta?.created_at || '').toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Investimento Total</div>
                            <div className="text-sm font-bold text-emidias-primary">
                                {formatCurrency(
                                    activeProposta?.itens?.reduce((acc, item) => acc + (item.valor_locacao || 0) * (item.qtd_bi_mes || 1), 0) || 0
                                )}
                            </div>
                        </div>

                        {/* Login/Dashboard Button */}
                        <div className="border-l border-gray-200 pl-4">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => router.push('/admin/proposals')}
                                    className="w-10 h-10 rounded-full bg-emidias-accent text-white flex items-center justify-center font-bold shadow-sm hover:scale-105 transition-all"
                                    title="Ir para Dashboard"
                                >
                                    {/* Get Initial from stored user (simplification: assume 'Client' if name missing or 'C') */}
                                    {(() => {
                                        try {
                                            const storage = localStorage.getItem('ooh-client-auth-storage') || '{}';
                                            const userData = JSON.parse(storage)?.state?.user;
                                            return userData?.name ? userData.name[0].toUpperCase() : 'C';
                                        } catch {
                                            return 'U';
                                        }
                                    })()}
                                </button>
                            ) : (
                                <Button
                                    onClick={() => router.push('/login')}
                                    variant="primary"
                                    className="bg-gradient-to-r from-emidias-primary to-blue-700 shadow-md hover:shadow-lg"
                                    leftIcon={<User size={16} />}
                                >
                                    <span className="hidden sm:inline">Faça login para editar</span>
                                    <span className="sm:hidden">Login</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="absolute inset-0 z-0">
                <GoogleMap />
            </div>

            {/* Cart Table (Restricted) */}
            {activeProposta && (
                <CartTable
                    isOpen={isCartOpen}
                    onToggle={() => setIsCartOpen(!isCartOpen)}
                    proposta={activeProposta}
                    isClientView={true}
                />
            )}
        </div>
    );
}

export default function PortalViewPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="animate-spin text-emidias-primary" size={48} />
            </div>
        }>
            <PortalViewContent />
        </Suspense>
    );
}
