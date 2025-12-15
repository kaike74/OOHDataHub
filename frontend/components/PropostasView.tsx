'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, FileText, Clock, CheckCircle, XCircle, Edit2, Trash2, ShoppingCart } from 'lucide-react';
import PropostaModal from './PropostaModal';

interface Proposta {
    id: number;
    nome: string;
    comissao: 'V2' | 'V3' | 'V4';
    status: string;
    created_at: string;
    cliente_nome: string;
    conta_nome?: string;
}

export default function PropostasView() {
    const router = useRouter();
    const params = useParams();
    const clienteId = params?.clienteId as string;

    const [propostas, setPropostas] = useState<Proposta[]>([]);
    const [cliente, setCliente] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (clienteId) {
            loadData();
        }
    }, [clienteId]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Carregar cliente
            const clienteResponse = await fetch(
                `https://ooh-api.kaike-458.workers.dev/api/clientes/${clienteId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const clienteData = await clienteResponse.json();
            setCliente(clienteData);

            // Carregar propostas
            const propostasResponse = await fetch(
                `https://ooh-api.kaike-458.workers.dev/api/clientes/${clienteId}/propostas`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );
            const propostasData = await propostasResponse.json();
            setPropostas(propostasData);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProposta = async (data: { nome: string; comissao: string }) => {
        try {
            const response = await fetch('https://ooh-api.kaike-458.workers.dev/api/propostas', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id_cliente: Number(clienteId),
                    nome: data.nome,
                    comissao: data.comissao,
                }),
            });

            if (!response.ok) {
                throw new Error('Erro ao criar proposta');
            }

            const novaProposta = await response.json();

            // Redirecionar para o mapa com carrinho
            router.push(`/propostas/${novaProposta.id}/carrinho`);
        } catch (error) {
            console.error('Erro ao criar proposta:', error);
            throw error;
        }
    };

    const handleDeleteProposta = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;

        try {
            await fetch(`https://ooh-api.kaike-458.workers.dev/api/propostas/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });
            await loadData();
        } catch (error) {
            console.error('Erro ao deletar proposta:', error);
            alert('Erro ao deletar proposta');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            rascunho: { bg: 'bg-gray-500/10', text: 'text-gray-400', icon: Edit2, label: 'Rascunho' },
            enviada: { bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Clock, label: 'Enviada' },
            aprovada: { bg: 'bg-green-500/10', text: 'text-green-400', icon: CheckCircle, label: 'Aprovada' },
            rejeitada: { bg: 'bg-red-500/10', text: 'text-red-400', icon: XCircle, label: 'Rejeitada' },
            editada_cliente: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: Edit2, label: 'Editada' },
        };
        return badges[status as keyof typeof badges] || badges.rascunho;
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#06055B] via-[#0A0A5C] to-[#060530]">
                <div className="w-12 h-12 border-4 border-[#FC1E75] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-gradient-to-br from-[#06055B] via-[#0A0A5C] to-[#060530]">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <div>
                        <button
                            onClick={() => router.back()}
                            className="text-white/60 hover:text-white mb-2 text-sm flex items-center space-x-1"
                        >
                            <span>←</span>
                            <span>Voltar para Clientes</span>
                        </button>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Propostas - {cliente?.nome}
                        </h1>
                        <p className="text-white/60">Gerencie as propostas deste cliente</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#FC1E75] to-[#FF6B9D] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FC1E75]/30 transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nova Proposta</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {propostas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <ShoppingCart className="w-16 h-16 text-white/20 mb-4" />
                        <h3 className="text-xl font-semibold text-white/60 mb-2">
                            Nenhuma proposta criada
                        </h3>
                        <p className="text-white/40 mb-6">
                            Comece criando sua primeira proposta para este cliente
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="px-6 py-3 bg-gradient-to-r from-[#FC1E75] to-[#FF6B9D] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FC1E75]/30 transition-all"
                        >
                            Criar Proposta
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {propostas.map((proposta) => {
                            const statusBadge = getStatusBadge(proposta.status);
                            const StatusIcon = statusBadge.icon;

                            return (
                                <div
                                    key={proposta.id}
                                    className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-[#FC1E75]/50 hover:shadow-xl hover:shadow-[#FC1E75]/20 transition-all cursor-pointer"
                                    onClick={() => router.push(`/propostas/${proposta.id}/carrinho`)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <FileText className="w-5 h-5 text-[#FC1E75]" />
                                                <h3 className="text-lg font-semibold text-white group-hover:text-[#FC1E75] transition-colors">
                                                    {proposta.nome}
                                                </h3>
                                            </div>

                                            <div className="flex items-center space-x-4 text-sm text-white/60">
                                                <div className="flex items-center space-x-2">
                                                    <StatusIcon className={`w-4 h-4 ${statusBadge.text}`} />
                                                    <span className={statusBadge.text}>{statusBadge.label}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-white/40">•</span>
                                                    <span className="bg-[#FC1E75]/20 text-[#FC1E75] px-2 py-0.5 rounded-full text-xs font-medium">
                                                        {proposta.comissao}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-white/40">•</span>
                                                    <span>{new Date(proposta.created_at).toLocaleDateString('pt-BR')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProposta(proposta.id);
                                                }}
                                                className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                                title="Excluir"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal */}
            <PropostaModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleCreateProposta}
                clienteId={Number(clienteId)}
            />
        </div>
    );
}
