'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Shield, Briefcase, Share2, FileText, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UnifiedDetailModal } from '@/components/ui/UnifiedDetailModal';

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

    // User avatar/logo
    const logo = (
        <div className={`w-full h-full rounded-full flex items-center justify-center text-white font-bold text-3xl ${isInternal ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-plura-primary to-plura-primary-light'}`}>
            {(account.name || account.email).charAt(0).toUpperCase()}
        </div>
    );

    // Subtitle with email and type badge
    const subtitle = (
        <div className="flex flex-col items-center gap-2">
            <div className="text-sm text-gray-500 flex items-center gap-1">
                <Mail size={12} /> {account.email}
            </div>
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
    );

    return (
        <UnifiedDetailModal
            isOpen={isOpen}
            onClose={onClose}
            title={account.name}
            subtitle={subtitle}
            logo={logo}
            sections={[
                // Shared Proposals
                {
                    title: "Propostas Compartilhadas",
                    icon: <Share2 size={16} />,
                    content: (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {shares.length} {shares.length === 1 ? 'compartilhamento' : 'compartilhamentos'}
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
                    )
                },
                // Created Proposals
                {
                    title: "Propostas Criadas",
                    icon: <FileText size={16} />,
                    content: (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                    {createdProposals.length} {createdProposals.length === 1 ? 'proposta' : 'propostas'}
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
                    )
                }
            ]}
        />
    );
}
