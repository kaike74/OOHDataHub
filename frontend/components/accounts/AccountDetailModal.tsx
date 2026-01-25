'use client';

import { useEffect, useState } from 'react';
import { Mail, Shield, Briefcase, Share2, FileText, Trash2, Edit, AlertCircle, Clock, CreditCard, Activity } from 'lucide-react';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { UnifiedStandardModal } from '@/components/ui/UnifiedStandardModal';
import { StatusBadge } from '@/components/ui/StatusBadge';

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
        } catch {
            alert('Erro ao remover compartilhamento');
        }
    };

    if (!account) return null;

    const isInternal = account.type === 'internal';

    // 1. HERO
    const HeroContent = (
        <div className="flex items-center gap-6">
            <div className={`h-20 w-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md ${isInternal ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-plura-primary to-plura-primary-light'}`}>
                {(account.name || account.email).charAt(0).toUpperCase()}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{account.name}</h1>
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <Mail size={14} /> {account.email}
                    </span>
                    {isInternal ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200">
                            <Shield size={10} className="mr-1" /> {account.role}
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                            <Briefcase size={10} className="mr-1" /> Externo
                        </span>
                    )}
                </div>
            </div>
        </div>
    );

    // 2. Info Cards (Stats)
    const InfoContent = (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg"><AlertCircle size={16} /></div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Visão Geral</h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {/* Activity */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><Clock size={12} /> Último Acesso</span>
                    <span className="text-sm font-bold text-gray-900">Hoje, 14:30</span>
                </div>
                {/* Plan */}
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><CreditCard size={12} /> Plano Atual</span>
                    <span className="text-sm font-bold text-gray-900">{isInternal ? 'Enterprise' : 'Pro'}</span>
                </div>
            </div>

            {/* Recent Activity Summary */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <Activity size={14} className="text-gray-400" />
                    <span className="text-[10px] uppercase font-bold text-gray-400">Atividade Recente</span>
                </div>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <p className="text-xs text-gray-600">Criou a proposta <span className="font-bold text-gray-800">Campanha Verão</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <p className="text-xs text-gray-600">Compartilhou <span className="font-bold text-gray-800">Q1 2026</span> com 3 usuários</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                        <p className="text-xs text-gray-600">Login realizado via Desktop</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // 3. Lists (Shared & Created)
    const ListContent = (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            {/* Shared List */}
            <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <Share2 size={14} /> Propostas Colaborativas
                    </span>
                    <span className="bg-white text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">{shares.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                    {shares.map(share => (
                        <div key={share.share_id} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center justify-between hover:border-blue-200 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p onClick={() => router.push(`/propostas?id=${share.proposal_id}`)} className="text-sm font-medium text-gray-900 truncate hover:text-blue-600 cursor-pointer">{share.proposal_name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(share.created_at)}</p>
                            </div>
                            <button onClick={() => handleUnshare(share.share_id)} className="text-gray-300 hover:text-red-500 p-1.5"><Trash2 size={14} /></button>
                        </div>
                    ))}
                    {shares.length === 0 && <p className="text-center text-xs text-gray-400 py-10">Nenhuma proposta compartilhada</p>}
                </div>
            </div>

            {/* Created List */}
            <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px]">
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                        <FileText size={14} /> Minhas Propostas
                    </span>
                    <span className="bg-white text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200">{createdProposals.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                    {createdProposals.map(prop => (
                        <div key={prop.id} onClick={() => router.push(`/propostas?id=${prop.id}`)} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center justify-between hover:border-purple-200 transition-colors cursor-pointer">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{prop.nome}</p>
                                <div className="flex gap-2 mt-1"><StatusBadge status={prop.status} /> <span className="text-[10px] text-gray-400">{formatDate(prop.created_at)}</span></div>
                            </div>
                            <span className="text-xs font-bold text-gray-900">{formatCurrency(prop.total_valor || 0)}</span>
                        </div>
                    ))}
                    {createdProposals.length === 0 && <p className="text-center text-xs text-gray-400 py-10">Nenhuma proposta criada</p>}
                </div>
            </div>
        </div>
    );

    return (
        <UnifiedStandardModal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalhes da Conta"
            hero={HeroContent}
            // For Account, Info is small (stats), Lists is big (2 lists side by side)
            infoContent={InfoContent}
            listContent={ListContent}
            actions={[
                {
                    icon: Edit,
                    label: "Editar",
                    onClick: () => alert('Em breve'),
                    variant: 'primary'
                }
            ]}
        />
    );
}
