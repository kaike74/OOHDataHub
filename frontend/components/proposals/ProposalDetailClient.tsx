'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, FileText, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Proposta } from '@/lib/types';
import { Skeleton } from '@/components/ui/Skeleton';

export default function ProposalDetailClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get('id');
    const [proposal, setProposal] = useState<Proposta | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) {
            setError('ID da proposta não fornecido.');
            setIsLoading(false);
            return;
        }

        const fetchProposal = async () => {
            try {
                const data = await api.getProposta(Number(id));
                setProposal(data);
            } catch (err) {
                console.error(err);
                setError('Erro ao carregar proposta.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProposal();
    }, [id]);

    if (isLoading) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-48 w-full rounded-xl" />
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="p-8 max-w-4xl mx-auto text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg inline-block mb-4">
                    {error || 'Proposta não encontrada.'}
                </div>
                <div>
                    <Button variant="outline" onClick={() => router.back()}>
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <Button
                variant="ghost"
                className="mb-6 hover:bg-gray-100 -ml-2 text-gray-600"
                onClick={() => router.back()}
            >
                <ArrowLeft size={16} className="mr-2" />
                Voltar para lista
            </Button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 
                                    ${proposal.status === 'aprovada' ? 'bg-green-100 text-green-700' :
                                        proposal.status === 'em_negociacao' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {proposal.status?.replace('_', ' ') || 'Rascunho'}
                                </span>
                                <span className="text-gray-400 text-sm flex items-center gap-1">
                                    <Calendar size={14} />
                                    {formatDate(proposal.created_at)}
                                </span>
                            </div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-1">{proposal.nome}</h1>
                            {proposal.id_cliente && <p className="text-gray-500">Cliente ID: {proposal.id_cliente}</p>}
                        </div>

                        <div className="text-right bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <div className="text-sm text-gray-500 mb-1 flex items-center justify-end gap-1">
                                Valor Total <DollarSign size={14} />
                            </div>
                            <div className="text-2xl font-bold text-emidias-accent">
                                {formatCurrency(proposal.itens?.reduce((acc, item) => acc + (item.valor_subtotal || item.valor_locacao || 0), 0) || 0)}
                                {/* Note: Total calculation might depend on backend, using manual sum or provided total */}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <div className="flex items-center gap-2 text-gray-500 mb-2">
                                <FileText size={18} />
                                <span className="font-semibold text-sm uppercase">Total de Itens</span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{proposal.itens?.length || 0}</p>
                        </div>
                        {/* Add more stats if needed */}
                    </div>

                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin size={20} className="text-emidias-accent" />
                        Locais Selecionados
                    </h2>

                    {proposal.itens && proposal.itens.length > 0 ? (
                        <div className="border border-gray-100 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                                    <tr>
                                        <th className="px-4 py-3">Código</th>
                                        <th className="px-4 py-3">Endereço</th>
                                        <th className="px-4 py-3">Cidade</th>
                                        <th className="px-4 py-3 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {proposal.itens.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50/50">
                                            <td className="px-4 py-3 font-medium text-gray-900">{item.codigo_ooh || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.endereco || '-'}</td>
                                            <td className="px-4 py-3 text-gray-600">{item.cidade || '-'}</td>
                                            <td className="px-4 py-3 text-right font-medium">
                                                {formatCurrency(item.valor_locacao || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            Nenhum item nesta proposta.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
