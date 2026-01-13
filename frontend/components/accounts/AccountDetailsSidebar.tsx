'use client';

import { useEffect, useState } from 'react';
import { X, User, Mail, Shield, Briefcase, Share2, Calendar, FileText, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

interface UserAccount {
    id: number;
    name: string;
    email: string;
    type: 'internal' | 'external';
    role: string;
    created_at: string;
    shared_count: number;
}

interface UserShare {
    share_id: number;
    proposal_id: number;
    proposal_name: string;
    created_at: string;
    status: string;
}

interface CreatedProposal {
    id: number;
    nome: string;
    status: string;
    total_valor: number;
    created_at: string;
}

interface AccountDetailsSidebarProps {
    account: UserAccount | null;
    onClose: () => void;
    isOpen: boolean;
}

export default function AccountDetailsSidebar({ account, onClose, isOpen }: AccountDetailsSidebarProps) {
    const [shares, setShares] = useState<UserShare[]>([]);
    const [createdProposals, setCreatedProposals] = useState<CreatedProposal[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && account) {
            loadData(account.id);
        } else {
            setShares([]);
            setCreatedProposals([]);
        }
    }, [isOpen, account]);

    const loadData = async (userId: number) => {
        setIsLoadingData(true);
        try {
            // Load shares
            const sharesData = await api.getAccountShares(userId);
            setShares(sharesData || []);

            // Load created proposals
            // Assumption: we fetch all admins proposals and filter by created_by = userId.
            // Or if backend supports it. For now, filter client side if feasible.
            // Note: `getAdminProposals` likely returns all. 
            const allProposals = await api.getAdminProposals();
            const created = allProposals.filter((p: any) => p.created_by === userId);
            setCreatedProposals(created);

        } catch (error) {
            console.error('Error loading account data:', error);
        } finally {
            setIsLoadingData(false);
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

    const handleUnshare = async (shareId: number) => {
        if (!confirm('Remover acesso a esta proposta?')) return;
        try {
            await api.deleteShare(shareId);
            setShares(prev => prev.filter(s => s.share_id !== shareId));
        } catch (e) {
            alert('Erro ao remover compartilhamento');
        }
    };

    if (!account) return null;

    const isInternal = account.type === 'internal';

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
                    onClick={onClose}
                />
            )}

            <div className={`fixed inset-y-0 right-0 w-full md:w-[480px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-lg font-semibold text-gray-900">Detalhes da Conta</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-lg">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Header */}
                    <div className="flex flex-col items-center">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-3xl shadow mb-3 ${isInternal ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-emidias-primary to-emidias-primary-light'}`}>
                            {(account.name || account.email).charAt(0).toUpperCase()}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">{account.name}</h3>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                            <Mail size={12} /> {account.email}
                        </div>
                        <div className="mt-3">
                            {isInternal ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                                    <Shield size={12} className="mr-1.5" /> Interno ({account.role})
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    <Briefcase size={12} className="mr-1.5" /> Externo
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Shared Proposals */}
                    <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <Share2 size={18} className="text-emidias-accent" />
                            Propostas Compartilhadas
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{shares.length}</span>
                        </h4>

                        {isLoadingData ? (
                            <div className="space-y-2 animate-pulse">
                                <div className="h-12 bg-gray-50 rounded-lg"></div>
                                <div className="h-12 bg-gray-50 rounded-lg"></div>
                            </div>
                        ) : shares.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400">Nenhum compartilhamento ativo.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {shares.map(share => (
                                    <div key={share.share_id} className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between group hover:shadow-sm transition-all">
                                        <div>
                                            <p
                                                className="font-medium text-sm text-gray-900 cursor-pointer hover:text-emidias-accent hover:underline"
                                                onClick={() => router.push(`/propostas/visualizar?id=${share.proposal_id}`)}
                                            >
                                                {share.proposal_name}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <StatusBadge status={share.status} />
                                                <span className="text-[10px] text-gray-400">Em {formatDate(share.created_at)}</span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 px-2 text-xs"
                                            onClick={() => handleUnshare(share.share_id)}
                                        >
                                            Remover
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Created Proposals */}
                    <div>
                        <h4 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-emidias-primary" />
                            Propostas Criadas
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-500">{createdProposals.length}</span>
                        </h4>

                        {isLoadingData ? (
                            <div className="space-y-2 animate-pulse">
                                <div className="h-12 bg-gray-50 rounded-lg"></div>
                                <div className="h-12 bg-gray-50 rounded-lg"></div>
                            </div>
                        ) : createdProposals.length === 0 ? (
                            <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-sm text-gray-400">Nenhuma proposta criada.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {createdProposals.map(prop => (
                                    <div
                                        key={prop.id}
                                        className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:border-emidias-primary/30 hover:shadow-sm"
                                        onClick={() => router.push(`/propostas/visualizar?id=${prop.id}`)}
                                    >
                                        <div>
                                            <p className="font-medium text-sm text-gray-900">{prop.nome}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <StatusBadge status={prop.status} />
                                                <span className="text-[10px] text-gray-400">{formatDate(prop.created_at)}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-gray-900">
                                                {formatCurrency(prop.total_valor || 0)}
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
