'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatDate } from '@/lib/utils';
import {
    Search, Plus, User, Building2, Trash2, RotateCcw,
    Shield, Mail, ChevronDown, ChevronRight, Share2, Loader2,
    CheckCircle, XCircle
} from 'lucide-react';
import NavigationMenu from '@/components/NavigationMenu';
import { useRouter } from 'next/navigation';

interface UserAccount {
    id: number;
    name: string;
    email: string;
    created_at: string;
    last_login: string | null;
    client_name: string;
    client_id: number;
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
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-emidias-gray-50 pb-10">
            {/* Header */}
            <header className="gradient-primary px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 fixed top-0 left-0 right-0 h-[70px] border-b-4 border-emidias-accent shadow-emidias-xl">
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
                        <User size={22} className="text-emidias-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Admin Contas
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                            Gestão de Usuários Clientes
                        </p>
                    </div>
                </div>

                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <img
                        src="https://raw.githubusercontent.com/kaike74/distribuicaoemidias/main/logo%20E-MIDIAS%20png%20fundo%20escuro%20HORIZONTAL%20(1).png"
                        alt="E-MÍDIAS Logo"
                        className="h-10 lg:h-12 object-contain drop-shadow-lg"
                    />
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={() => setMenuOpen(true)} className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                        <CheckCircle size={24} className="hidden" />
                        {/* Using CheckCircle hidden just to import it?? No, removed useless imports if any */}
                        {/* Re-using Menu icon from lucide-react which is not imported? Need to check imports */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-menu"><line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" /></svg>
                    </button>
                </div>
            </header>

            <NavigationMenu />

            <div className="max-w-7xl mx-auto p-6 mt-[80px]">
                {/* Search */}
                <div className="bg-white p-4 rounded-xl shadow-emidias-sm border border-emidias-gray-200 mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-emidias-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, email ou empresa..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-emidias-gray-50 border border-emidias-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-accent/20 focus:border-emidias-accent transition-all text-emidias-gray-900"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-emidias-accent" size={32} />
                    </div>
                ) : filteredAccounts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-emidias-gray-200">
                        <User className="mx-auto text-emidias-gray-300 mb-3" size={48} />
                        <p className="text-emidias-gray-500 font-medium">Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredAccounts.map(user => {
                            const isExpanded = expandedUsers[user.id];

                            return (
                                <div key={user.id} className="bg-white rounded-xl shadow-emidias-sm border border-emidias-gray-200 overflow-hidden transition-all duration-300 hover:shadow-emidias-md">
                                    <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">

                                        {/* Avatar & Basic Info */}
                                        <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleUser(user.id)}>
                                            <div className="w-12 h-12 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-emidias-gray-900 text-lg flex items-center gap-2">
                                                    {user.name}
                                                    {user.shared_count > 0 && (
                                                        <span className="bg-emidias-accent/10 text-emidias-accent text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
                                                            {user.shared_count} Propostas
                                                        </span>
                                                    )}
                                                </h3>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-emidias-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Mail size={12} /> {user.email}
                                                    </span>
                                                    <span className="flex items-center gap-1 font-medium text-emidias-accent">
                                                        <Building2 size={12} /> {user.client_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 self-end md:self-center border-t md:border-t-0 md:border-l border-emidias-gray-100 pt-3 md:pt-0 md:pl-4 mt-2 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                            <div className="text-xs text-emidias-gray-400 mr-2 text-right hidden lg:block">
                                                <p>Criado em: {formatDate(user.created_at)}</p>
                                                <p>Último login: {user.last_login ? formatDate(user.last_login) : 'Nunca'}</p>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleResetPassword(user.id)}
                                                    className="p-2 text-emidias-gray-400 hover:text-emidias-accent hover:bg-emidias-accent/5 rounded-lg transition-colors"
                                                    title="Resetar Senha e Reenviar Email"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAccount(user.id)}
                                                    className="p-2 text-emidias-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir Conta"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => toggleUser(user.id)}
                                                    className={`p-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} text-emidias-gray-400`}
                                                >
                                                    <ChevronDown size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Details (Shared Proposals) */}
                                    <div className={`bg-emidias-gray-50 border-t border-emidias-gray-100 transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100 p-4' : 'max-h-0 opacity-0 p-0 overflow-hidden'}`}>
                                        <h4 className="text-xs font-bold text-emidias-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                            <Share2 size={14} />
                                            Propostas Compartilhadas
                                        </h4>

                                        {loadingShares[user.id] ? (
                                            <div className="flex justify-center py-4">
                                                <Loader2 className="animate-spin text-emidias-accent" size={20} />
                                            </div>
                                        ) : !userShares[user.id] || userShares[user.id].length === 0 ? (
                                            <p className="text-sm text-emidias-gray-500 italic">Nenhuma proposta compartilhada com este usuário.</p>
                                        ) : (
                                            <div className="grid gap-2">
                                                {userShares[user.id].map(share => (
                                                    <div key={share.share_id} className="bg-white p-3 rounded-lg border border-emidias-gray-200 flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-2 h-2 rounded-full ${share.status === 'aprovada' ? 'bg-green-500' : 'bg-gray-300'}`} />
                                                            <span className="font-medium text-emidias-gray-900">{share.proposal_name}</span>
                                                            <span className="text-xs text-emidias-gray-400">| Compartilhado em {formatDate(share.created_at)}</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleUnshare(share.share_id, user.id)}
                                                            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                                        >
                                                            Remover Acesso
                                                        </button>
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
