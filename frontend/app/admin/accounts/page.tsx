'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import {
    Search, User, Trash2, RotateCcw,
    Mail, ChevronDown, Share2, Loader2,
    CheckCircle, X
} from 'lucide-react';
import NavigationMenu from '@/components/NavigationMenu';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

interface UserAccount {
    id: number;
    name: string;
    email: string;
    created_at: string;
    last_login: string | null;
    shared_count: number;
}

interface UserShare {
    share_id: number;
    proposal_id: number;
    proposal_name: string;
    created_at: string;
    status: string;
}

export default function AdminAccountsPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Expandable rows state
    const [expandedUsers, setExpandedUsers] = useState<Record<number, boolean>>({});
    const [userShares, setUserShares] = useState<Record<number, UserShare[]>>({});
    const [loadingShares, setLoadingShares] = useState<Record<number, boolean>>({});

    const setMenuOpen = useStore((state) => state.setMenuOpen);

    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const data = await api.getAdminAccounts();
            setAccounts(data);
        } catch (error) {
            console.error('Error loading accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUser = async (userId: number) => {
        const isExpanded = expandedUsers[userId];

        setExpandedUsers(prev => ({
            ...prev,
            [userId]: !isExpanded
        }));

        if (!isExpanded && !userShares[userId]) {
            // Load shares if opening and not loaded
            try {
                setLoadingShares(prev => ({ ...prev, [userId]: true }));
                const shares = await api.getAccountShares(userId);
                setUserShares(prev => ({ ...prev, [userId]: shares }));
            } catch (error) {
                console.error('Error loading shares:', error);
            } finally {
                setLoadingShares(prev => ({ ...prev, [userId]: false }));
            }
        }
    };

    const handleDeleteAccount = async (userId: number) => {
        if (!confirm('Tem certeza que deseja excluir esta conta? Todas as propostas compartilhadas serão removidas deste usuário.')) return;

        try {
            await api.deleteAccount(userId);
            setAccounts(prev => prev.filter(u => u.id !== userId));
            alert('Conta excluída com sucesso.');
        } catch (error) {
            console.error(error);
            alert('Erro ao excluir conta.');
        }
    };

    const handleResetPassword = async (userId: number) => {
        if (!confirm('Deseja resetar a senha deste usuário e enviar por e-mail?')) return;

        try {
            await api.resetAccountPassword(userId);
            alert('Senha resetada e enviada por e-mail com sucesso!');
        } catch (error) {
            console.error(error);
            alert('Erro ao resetar senha.');
        }
    };

    const handleUnshare = async (shareId: number, userId: number) => {
        if (!confirm('Remover acesso a esta proposta?')) return;

        try {
            await api.deleteShare(shareId);
            setUserShares(prev => ({
                ...prev,
                [userId]: prev[userId].filter(s => s.share_id !== shareId)
            }));
            // Update main count
            setAccounts(prev => prev.map(u =>
                u.id === userId ? { ...u, shared_count: Math.max(0, u.shared_count - 1) } : u
            ));
        } catch (error) {
            console.error(error);
            alert('Erro ao remover compartilhamento.');
        }
    };

    // Filter
    const filteredAccounts = accounts.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            {/* Header */}
            <header className="px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 fixed top-0 left-0 right-0 h-[70px] bg-gradient-to-r from-emidias-primary to-[#0A0970] border-b-4 border-emidias-accent shadow-xl text-white">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
                        <User size={22} className="text-emidias-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                            Admin Contas
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                            Gestão de Usuários Clientes
                        </p>
                    </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <div className="text-xl font-bold tracking-tight text-white/90">
                        OOH DATA HUB
                    </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={() => setMenuOpen(true)} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </div>
            </header>

            <NavigationMenu />

            <div className="max-w-7xl mx-auto p-6 mt-[80px]">
                {/* Search */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Input
                            placeholder="Buscar por nome, email ou empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon={<Search size={20} />}
                            className="bg-gray-50 border-gray-200 focus:bg-white"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                                <div className="flex items-center gap-4">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <div className="flex-1">
                                        <Skeleton className="h-6 w-48 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200 animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="text-gray-300" size={32} />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">Nenhum usuário encontrado</h3>
                        <p className="text-gray-500 text-sm">Tente ajustar seus termos de busca.</p>
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in-up duration-500">
                        {filteredAccounts.map(user => {
                            const isExpanded = expandedUsers[user.id];

                            return (
                                <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-emidias-accent/30">
                                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">

                                        {/* Avatar & Basic Info */}
                                        <div className="flex items-center gap-4 flex-1 cursor-pointer group" onClick={() => toggleUser(user.id)}>
                                            <div className="w-12 h-12 bg-gradient-to-br from-emidias-primary to-emidias-primary-light rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 group-hover:text-emidias-accent transition-colors">
                                                    {user.name}
                                                    {user.shared_count > 0 && (
                                                        <span className="bg-emidias-accent/10 text-emidias-accent text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                            {user.shared_count} Propostas
                                                        </span>
                                                    )}
                                                </h3>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={12} /> {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-xs text-gray-400 mr-2 text-right hidden lg:block">
                                                <p>Criado em: {formatDate(user.created_at)}</p>
                                                <p>Último login: {user.last_login ? formatDate(user.last_login) : 'Nunca'}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={() => handleResetPassword(user.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-emidias-accent hover:bg-emidias-accent/5"
                                                    title="Resetar Senha e Reenviar Email"
                                                >
                                                    <RotateCcw size={18} />
                                                </Button>
                                                <Button
                                                    onClick={() => handleDeleteAccount(user.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                    title="Excluir Conta"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                                <Button
                                                    onClick={() => toggleUser(user.id)}
                                                    variant="ghost"
                                                    size="icon"
                                                    className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-gray-400`}
                                                >
                                                    <ChevronDown size={20} />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details (Shared Proposals) */}
                                    <div className={`bg-gray-50 border-t border-gray-100 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 p-4' : 'max-h-0 opacity-0 p-0 overflow-hidden'}`}>
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Share2 size={14} />
                                            Propostas Compartilhadas
                                        </h4>

                                        {loadingShares[user.id] ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="animate-spin text-emidias-accent" size={20} />
                                            </div>
                                        ) : !userShares[user.id] || userShares[user.id].length === 0 ? (
                                            <p className="text-sm text-gray-500 italic">Nenhuma proposta compartilhada com este usuário.</p>
                                        ) : (
                                            <div className="grid gap-2">
                                                {userShares[user.id].map(share => (
                                                    <div key={share.share_id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${share.status === 'aprovada' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                            <span className="font-medium text-gray-900">{share.proposal_name}</span>
                                                            <span className="text-xs text-gray-400">| Compartilhado em {formatDate(share.created_at)}</span>
                                                        </div>
                                                        <Button
                                                            onClick={() => handleUnshare(share.share_id, user.id)}
                                                            variant="danger"
                                                            size="sm"
                                                            className="h-7 px-2 text-xs"
                                                        >
                                                            Remover Acesso
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
