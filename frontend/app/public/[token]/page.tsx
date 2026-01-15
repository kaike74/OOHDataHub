'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Proposta } from '@/lib/types';
import { ExternalLink, Mail, Phone, MapPin, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// This page uses dynamic routing, so we need to tell Next.js to render it dynamically
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export default function PublicProposalPage() {
    const params = useParams();
    const router = useRouter();
    const token = params?.token as string;

    const [proposta, setProposta] = useState<Proposta | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;

        const loadProposal = async () => {
            try {
                setLoading(true);
                const data = await api.getPublicProposal(token);
                setProposta(data);
            } catch (err: any) {
                console.error('Error loading public proposal:', err);
                setError(err.message || 'Proposta não encontrada');
            } finally {
                setLoading(false);
            }
        };

        loadProposal();
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emidias-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando proposta...</p>
                </div>
            </div>
        );
    }

    if (error || !proposta) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ExternalLink className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Proposta não encontrada</h1>
                    <p className="text-gray-600 mb-6">
                        O link que você acessou pode estar inválido ou a proposta não está mais disponível publicamente.
                    </p>
                    <Button
                        onClick={() => router.push('/')}
                        className="bg-emidias-primary hover:bg-emidias-primary/90"
                    >
                        Ir para Home
                    </Button>
                </div>
            </div>
        );
    }

    const totalImpactos = proposta.itens?.reduce((sum, item) => sum + (item.impactos || 0), 0) || 0;
    const totalInvestimento = proposta.itens?.reduce((sum, item) => sum + (item.total_investimento || 0), 0) || 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {proposta.cliente?.logo_url && (
                                <img
                                    src={api.getImageUrl(proposta.cliente.logo_url)}
                                    alt={proposta.cliente.nome}
                                    className="h-12 w-auto object-contain"
                                />
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{proposta.nome}</h1>
                                <p className="text-sm text-gray-500">
                                    Cliente: {proposta.cliente?.nome || 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                onClick={() => router.push('/auth/signup')}
                                variant="outline"
                                className="hidden sm:flex"
                            >
                                Criar Conta
                            </Button>
                            <Button
                                onClick={() => router.push('/auth/login')}
                                className="bg-emidias-primary hover:bg-emidias-primary/90"
                            >
                                Fazer Login
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Total de Pontos</p>
                                <p className="text-3xl font-bold text-gray-900">{proposta.itens?.length || 0}</p>
                            </div>
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <MapPin className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Impactos Totais</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {totalImpactos.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                <ExternalLink className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Investimento Total</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    {totalInvestimento.toLocaleString('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    })}
                                </p>
                            </div>
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">Pontos da Proposta</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Endereço
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Cidade/UF
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Exibidora
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {proposta.itens?.map((item, index) => (
                                    <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {item.codigo_ooh || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {item.endereco || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item.cidade || 'N/A'}/{item.uf || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item.tipo || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {item.exibidora_nome || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-8 bg-gradient-to-r from-emidias-primary to-blue-600 rounded-2xl shadow-xl p-8 text-center text-white">
                    <h2 className="text-3xl font-bold mb-4">Gostou da proposta?</h2>
                    <p className="text-lg mb-6 opacity-90">
                        Crie uma conta gratuita para editar, salvar e gerenciar suas próprias propostas!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => router.push('/auth/signup')}
                            className="bg-white text-emidias-primary hover:bg-gray-100 font-semibold px-8 py-3 text-lg"
                        >
                            Criar Conta Grátis
                        </Button>
                        <Button
                            onClick={() => router.push('/auth/login')}
                            variant="outline"
                            className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-3 text-lg"
                        >
                            Já tenho conta
                        </Button>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-500 text-sm">
                    <p>© 2026 E-Mídias. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}
