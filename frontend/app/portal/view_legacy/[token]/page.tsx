'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api'; // Or use direct fetch if public route
import { Loader2 } from 'lucide-react';
import GoogleMap from '@/components/map/GoogleMap'; // Need to make this responsive/read-only or create ClientMap
import { formatCurrency } from '@/lib/utils'; // Assuming this exists or create it

export default function PublicProposalPage() {
    const params = useParams();
    const token = params.token as string;
    const [proposal, setProposal] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProposal = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/proposals/${token}`);
                if (!res.ok) throw new Error('Proposta não encontrada ou expirada');
                const data = await res.json();
                setProposal(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) fetchProposal();
    }, [token]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-gray-800">Oops!</h1>
                <p className="text-gray-600">{error || 'Algo deu errado.'}</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {proposal.cliente_logo && (
                        <img src={proposal.cliente_logo} alt="Logo Cliente" className="h-10 w-auto" />
                    )}
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">{proposal.nome}</h1>
                        <p className="text-sm text-gray-500">Proposta para {proposal.cliente_nome}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Investimento Total</p>
                        <p className="text-lg font-bold text-green-600">
                            {/* Simple sum logic for display */}
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                proposal.itens.reduce((acc: number, item: any) => acc + (item.valor_total || 0), 0)
                            )}
                        </p>
                    </div>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition">
                        Aprovar Proposta
                    </button>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Map View (simplified) */}
                <div className="flex-1 relative border-r border-gray-200">
                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                        <p>Mapa Interativo (Implementação futura de visualização restrita)</p>
                        {/* 
                            Note: Integrating GoogleMap here requires refactoring it to accept 'initialPoints' 
                            instead of relying solely on 'useStore().pontos'. 
                            For now, we place a placeholder or use a ClientMap component.
                        */}
                    </div>
                </div>

                {/* Items List */}
                <div className="w-[400px] bg-white flex flex-col shadow-xl z-20 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-600 flex justify-between items-center">
                        <span>{proposal.itens.length} Pontos Selecionados</span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {proposal.itens.map((item: any) => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                        {item.codigo_ooh}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">{item.tipo}</span>
                                </div>
                                <h3 className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">{item.endereco}</h3>
                                <p className="text-xs text-gray-500 mb-3">{item.cidade}/{item.uf}</p>

                                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                                    <div className="text-sm font-bold text-gray-700">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.valor_total || 0)}
                                    </div>
                                    <div className="flex gap-2">
                                        {/* Status actions */}
                                        <button className="text-xs text-red-500 hover:bg-red-50 px-2 py-1 rounded transition">Rejeitar</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
