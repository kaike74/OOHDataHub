'use client';

import { useEffect, useState } from 'react';
import { X, ExternalLink, Map as MapIcon, Maximize2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import GoogleMap from '@/components/map/GoogleMap';

interface ExhibitorProposalStats {
    id: number;
    nome: string;
    points: number; // Corrected field name based on API result
    pontos_count: number; // API returns this
    status: string;
}

interface ExhibitorDetailsSidebarProps {
    exibidoras: any | null; // Using any for flexibility or use strict Exibidora type
    onClose: () => void;
    isOpen: boolean;
}

export default function ExhibitorDetailsSidebar({ exibidoras, onClose, isOpen }: ExhibitorDetailsSidebarProps) {
    const [proposals, setProposals] = useState<ExhibitorProposalStats[]>([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && exibidoras?.id) {
            loadProposals(exibidoras.id);
        } else {
            setProposals([]);
        }
    }, [isOpen, exibidoras]);

    const loadProposals = async (id: number) => {
        setIsLoadingProposals(true);
        try {
            const data = await api.getExhibitorProposals(id);
            // data items might have pontos_count or points. API route I wrote uses `pontos_count`.
            setProposals(data);
        } catch (error) {
            console.error('Failed to load proposals', error);
            setProposals([]);
        } finally {
            setIsLoadingProposals(false);
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            'rascunho': 'bg-gray-100 text-gray-700',
            'em_negociacao': 'bg-blue-50 text-blue-700',
            'aprovada': 'bg-green-50 text-green-700',
            'rejeitada': 'bg-red-50 text-red-700',
            'finalizada': 'bg-gray-800 text-white',
        };
        const colorClass = colors[status?.toLowerCase()] || colors['rascunho'];
        return (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colorClass}`}>
                {status?.replace('_', ' ') || 'Rascunho'}
            </span>
        );
    };

    const handleExpandMap = () => setIsMapExpanded(true);
    const handleCloseExpandedMap = () => setIsMapExpanded(false);

    if (!exibidoras) return null;

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">Detalhes da Exibidora</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Exibidora Info */}
                    <div className="flex flex-col items-center mb-6">
                        <div className="w-24 h-24 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mb-4 p-2 relative overflow-hidden">
                            {exibidoras.logo_url ? (
                                <img src={exibidoras.logo_url} alt={exibidoras.nome} className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-3xl font-bold text-gray-300">{exibidoras.nome.charAt(0)}</span>
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center">{exibidoras.nome}</h3>
                        <div className="flex gap-2 text-sm text-gray-500 mt-2">
                            <div className="px-3 py-1 bg-gray-100 rounded-full">{exibidoras.totalPontos || 0} Pontos</div>
                            <div className="px-3 py-1 bg-gray-100 rounded-full">{exibidoras.cidades?.length || 0} Cidades</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">CNPJ</span>
                            <p className="font-mono text-sm text-gray-800 mt-1">{exibidoras.cnpj || '-'}</p>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Regiões</span>
                            <p className="text-sm text-gray-800 mt-1 line-clamp-1" title={exibidoras.ufs?.join(', ')}>{exibidoras.ufs?.join(', ') || '-'}</p>
                        </div>
                    </div>

                    {exibidoras.endereco && (
                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <span className="text-xs text-gray-500 uppercase font-bold tracking-wider">Endereço</span>
                            <p className="text-sm text-gray-800 mt-1">{exibidoras.endereco}</p>
                        </div>
                    )}

                    {/* Map Section */}
                    <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <MapIcon size={18} className="text-emidias-primary" />
                            Locais de Atuação
                        </h4>

                        <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 group">
                            {/* Mini Map Preview - non-interactive to save resources/complex events */}
                            <GoogleMap
                                readOnly={true}
                                showProposalActions={false}
                                forcedFilterExibidora={[exibidoras.id]}
                            />

                            <div className="absolute inset-0 bg-black/10 transition-colors flex items-center justify-center pointer-events-none group-hover:bg-black/20">
                                <Button
                                    className="pointer-events-auto bg-white/90 hover:bg-white text-gray-900 shadow-xl backdrop-blur-sm transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                                    onClick={handleExpandMap}
                                    leftIcon={<Maximize2 size={16} />}
                                >
                                    Expandir Mapa
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Proposal History */}
                    <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <ExternalLink size={18} className="text-emidias-accent" />
                            Histórico em Propostas
                        </h4>

                        {isLoadingProposals ? (
                            <div className="space-y-3">
                                <div className="h-10 bg-gray-50 rounded animate-pulse"></div>
                                <div className="h-10 bg-gray-50 rounded animate-pulse"></div>
                                <div className="h-10 bg-gray-50 rounded animate-pulse"></div>
                            </div>
                        ) : proposals.length > 0 ? (
                            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                                {proposals.map((prop, idx) => (
                                    <div
                                        key={prop.id}
                                        className={`p-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors ${idx !== proposals.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        onClick={() => router.push(`/propostas/visualizar?id=${prop.id}`)}
                                    >
                                        <div className="flex flex-col gap-1">
                                            <span className="text-sm font-medium text-gray-900">{prop.nome}</span>
                                            <StatusBadge status={prop.status} />
                                        </div>
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded text-xs font-semibold text-gray-600">
                                            {prop.pontos_count || prop.points || 0} pts
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-400 text-sm">Nenhuma proposta encontrada.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Map Modal */}
            {isMapExpanded && (
                <div className="fixed inset-0 z-[100] flex flex-col bg-white animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white shadow-sm z-10">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <MapIcon size={20} className="text-emidias-primary" />
                                Mapa de Pontos: {exibidoras.nome}
                            </h3>
                            <p className="text-xs text-gray-500">Visualizando apenas pontos desta exibidora</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleCloseExpandedMap}
                            leftIcon={<X size={18} />}
                        >
                            Fechar
                        </Button>
                    </div>
                    <div className="flex-1 relative bg-gray-100">
                        <GoogleMap
                            readOnly={true}
                            showProposalActions={false}
                            forcedFilterExibidora={[exibidoras.id]}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
