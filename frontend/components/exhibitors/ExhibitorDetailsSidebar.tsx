'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, Building2, FileText, ArrowRight } from 'lucide-react';
import { Exibidora } from '@/lib/types';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface ExhibitorProposalStats {
    proposal_id: number;
    proposal_name: string;
    point_count: number;
    status: string;
    total_value?: number;
}

interface ExhibitorDetailsSidebarProps {
    exibidoras: (Exibidora & { totalPontos?: number; cidades?: string[]; ufs?: string[] }) | null;
    onClose: () => void;
    isOpen: boolean;
}

export default function ExhibitorDetailsSidebar({ exibidoras: exibidora, onClose, isOpen }: ExhibitorDetailsSidebarProps) {
    const [proposals, setProposals] = useState<ExhibitorProposalStats[]>([]);
    const [isLoadingProposals, setIsLoadingProposals] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && exibidora) {
            loadProposals(exibidora.id);
        } else {
            setProposals([]);
        }
    }, [isOpen, exibidora]);

    const loadProposals = async (id: number) => {
        setIsLoadingProposals(true);
        try {
            // Using the new API endpoint we defined
            const data = await api.getExhibitorProposals(id);
            // Expected format: [{ proposal_id, proposal_name, point_count, status }]
            setProposals(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading exhibitor proposals:', error);
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

    if (!exibidora) return null;

    return (
        <>
            {/* Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Panel */}
            <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">Detalhes da Exibidora</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Header Info */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-24 h-24 rounded-2xl bg-white border border-gray-100 p-2 shadow-sm mb-4 flex items-center justify-center overflow-hidden">
                            {exibidora.logo_r2_key ? (
                                <SafeImage
                                    src={api.getImageUrl(exibidora.logo_r2_key)}
                                    alt={exibidora.nome}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Building2 size={40} className="text-gray-300" />
                            )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 text-center">{exibidora.nome}</h3>
                        <div className="flex gap-2 mt-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100">
                                {exibidora.totalPontos || 0} Pontos
                            </span>
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium block mb-1">CNPJ</span>
                            <span className="text-sm font-mono text-gray-900">{exibidora.cnpj || 'Não informado'}</span>
                        </div>
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium block mb-1">Endereço</span>
                            <div className="flex items-center gap-1.5 text-sm text-gray-900 truncate">
                                <span className="truncate">{exibidora.endereco || 'Não informado'}</span>
                            </div>
                        </div>
                        <div className="col-span-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-xs text-gray-500 font-medium block mb-2">Regiões de Atuação</span>
                            <div className="flex flex-wrap gap-2">
                                {exibidora.cidades && exibidora.cidades.length > 0 ? exibidora.cidades.slice(0, 10).map((city, idx) => (
                                    <span key={idx} className="px-2 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600">
                                        {city}
                                    </span>
                                )) : <span className="text-sm text-gray-400 italic">Nenhuma cidade informada</span>}
                                {exibidora.cidades && exibidora.cidades.length > 10 && (
                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-500">+{exibidora.cidades.length - 10}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Proposals List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FileText size={18} className="text-emidias-accent" />
                                Histórico em Propostas
                            </h4>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {proposals.length}
                            </span>
                        </div>

                        {isLoadingProposals ? (
                            <div className="space-y-3">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : proposals.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-500">Nenhuma proposta com esta exibidora.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {proposals.map((prop, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => router.push(`/propostas/visualizar?id=${prop.proposal_id}`)}
                                        className="group bg-white border border-gray-200 rounded-xl p-3 hover:border-emidias-accent/30 hover:shadow-md transition-all cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h5 className="font-medium text-gray-900 text-sm group-hover:text-emidias-accent transition-colors">
                                                    {prop.proposal_name}
                                                </h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <StatusBadge status={prop.status} />
                                                    <span className="text-xs text-gray-500">
                                                        {prop.point_count} ponto{prop.point_count !== 1 ? 's' : ''}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-emidias-accent group-hover:text-white transition-colors">
                                                <ArrowRight size={12} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
