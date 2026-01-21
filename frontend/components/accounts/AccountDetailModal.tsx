'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Shield, Briefcase, Share2, FileText, Trash2, Edit } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UnifiedSplitModal } from '@/components/ui/UnifiedSplitModal';

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

interface AccountDetailModalProps {
    account: UserAccount | null;
    onClose: () => void;
    isOpen: boolean;
}

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

export default function AccountDetailModal({ account, onClose, isOpen }: AccountDetailModalProps) {
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
            const sharesData = await api.getAccountShares(userId);
            setShares(sharesData || []);

            const allProposals = await api.getAdminProposals();
            const created = allProposals.filter((p: any) => p.created_by === userId);
            setCreatedProposals(created);
        } catch (error) {
            console.error('Error loading account data:', error);
        } finally {
            setIsLoadingData(false);
        }
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

    // LEFT CONTENT: Avatar
    const LeftContent = (
        <div className={`h-full w-full flex flex-col items-center justify-center ${isInternal ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-plura-primary to-plura-primary-light'} p-8`}>
            {/* Avatar Circle */}
            <div className="w-48 h-48 rounded-full bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center mb-6 shadow-2xl">
                <span className="text-8xl font-bold text-white">
                    {(account.name || account.email).charAt(0).toUpperCase()}
                </span>
            </div>

            {/* User Name */}
            <h2 className="text-2xl font-bold text-white text-center mb-2 drop-shadow-lg">
                {account.name}
            </h2>

            {/* Email */}
            <div className="flex items-center gap-2 text-white/90 mb-4">
                <Mail size={14} />
                <span className="text-sm">{account.email}</span>
            </div>

            {/* Type Badge */}
            {isInternal ? (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm">
                    <Shield size={14} className="mr-2" /> Interno ({account.role})
                </span>
            ) : (
                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-white/20 text-white border-2 border-white/30 backdrop-blur-sm">
                    <Briefcase size={14} className="mr-2" /> Externo
                </span>
            )}
        </div>
    );

    // RIGHT CONTENT: Data
    const RightContent = (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100">
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <User size={20} className="text-plura-accent" />
                    Detalhes da Conta
                </h1>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Shared Proposals */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Share2 size={18} className="text-plura-accent" />
                            Propostas Compartilhadas
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {shares.length}
                        </span>
                    </div>

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
                                    <div className="flex-1">
                                        <p
                                            className="font-medium text-sm text-gray-900 cursor-pointer hover:text-plura-accent hover:underline"
                                            onClick={() => router.push(`/propostas?id=${share.proposal_id}`)}
                                        >
                                            {share.proposal_name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <StatusBadge status={share.status} />
                                            <span className="text-[10px] text-gray-400">Em {formatDate(share.created_at)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleUnshare(share.share_id)}
                                        className="ml-2 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Remover compartilhamento"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Created Proposals */}
                <div className="border-t border-gray-100 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <FileText size={18} className="text-plura-primary" />
                            Propostas Criadas
                        </h3>
                        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {createdProposals.length}
                        </span>
                    </div>

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
                                    className="bg-white border border-gray-200 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:border-plura-primary/30 hover:shadow-sm"
                                    onClick={() => router.push(`/propostas?id=${prop.id}`)}
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
    );

    return (
        <UnifiedSplitModal
            isOpen={isOpen}
            onClose={onClose}
            leftContent={LeftContent}
            leftBackground="dark"
            rightContent={RightContent}
            actions={[
                {
                    icon: Edit,
                    label: "Editar",
                    onClick: () => {
                        // TODO: Implement edit account functionality
                        alert('Funcionalidade de edição em desenvolvimento');
                    },
                    variant: 'primary'
                }
            ]}
        />
    );
}
