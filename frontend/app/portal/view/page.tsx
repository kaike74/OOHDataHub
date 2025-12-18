'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import GoogleMap from '@/components/map/GoogleMap';
import CartTable from '@/components/CartTable';
import { Loader2, LogOut, MapPin, ArrowLeft } from 'lucide-react';
import { Proposta, PropostaItem, Ponto } from '@/lib/types';

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

                    // Extract points for the map
                    const points = data.itens.map((item: any) => mapItemToPonto(item))
                        .filter((p, index, self) =>
                            index === self.findIndex((t) => t.id === p.id)
                        ); // Unique points

                    setPontos(points);

                    // Center map logic might be handled by GoogleMap if points change?
                    // GoogleMap uses points to cluster.
                }

            } catch (err: any) {
                console.error(err);
                if (err.message === 'Unauthorized' || err.status === 401) {
                    router.push('/portal/login');
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
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-600" size={48} />
                    <p className="text-gray-500 font-medium">Carregando proposta...</p>
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
                    <button
                        onClick={() => router.push('/portal/login')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50 relative">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 z-40 p-4 pointer-events-none">
                <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-lg rounded-2xl p-4 flex items-center justify-between pointer-events-auto max-w-screen-xl mx-auto">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-gray-900 text-lg leading-tight">{activeProposta?.nome}</h1>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{activeProposta?.itens?.length || 0} pontos</span>
                                <span>•</span>
                                <span>{new Date(activeProposta?.created_at || '').toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="hidden sm:block text-right mr-2">
                            <div className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Investimento Total</div>
                            <div className="text-sm font-bold text-blue-600">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    activeProposta?.itens?.reduce((acc, item) => acc + (item.valor_locacao || 0) * (item.qtd_bi_mes || 1), 0) || 0
                                )}
                            </div>
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
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        }>
            <PortalViewContent />
        </Suspense>
    );
}
