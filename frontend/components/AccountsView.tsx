import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
    Search, User, Trash2, RotateCcw,
    Mail, ChevronDown, Share2, Loader2,
    Shield, Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

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

export default function AccountsView() {
    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Expandable rows state
    const [expandedUsers, setExpandedUsers] = useState<Record<number, boolean>>({});
    const [userShares, setUserShares] = useState<Record<number, UserShare[]>>({});
    const [loadingShares, setLoadingShares] = useState<Record<number, boolean>>({});

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
        <div className="max-w-7xl mx-auto p-4 sm:p-6 pb-20">
            {/* Header Area */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Contas e Permissões</h2>
                    <p className="text-gray-500 text-sm">Gerencie usuários internos e externos.</p>
                </div>

                <div className="relative w-full sm:w-72">
                    <Input
                        placeholder="Buscar usuário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        icon={<Search size={18} />}
                        className="bg-white"
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
                <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
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
                        const isInternal = user.type === 'internal';

                        return (
                            <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-md hover:border-emidias-accent/30">
                                <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">

                                    {/* Avatar & Basic Info */}
                                    <div className="flex items-center gap-4 flex-1 cursor-pointer group" onClick={() => toggleUser(user.id)}>
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform ${isInternal ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-emidias-primary to-emidias-primary-light'
                                            }`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 group-hover:text-emidias-accent transition-colors">
                                                {user.name}
                                                {isInternal ? (
                                                    <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1 border border-purple-200">
                                                        <Shield size={10} /> Interno ({user.role})
                                                    </span>
                                                ) : (
                                                    <span className="bg-blue-50 text-blue-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1 border border-blue-100">
                                                        <Briefcase size={10} /> Externo
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
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* Reset Password (Only for External or if you are Master) */}
                                            <Button
                                                onClick={() => handleResetPassword(user.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-400 hover:text-emidias-accent hover:bg-emidias-accent/5"
                                                title="Resetar Senha"
                                            >
                                                <RotateCcw size={18} />
                                            </Button>

                                            {/* Delete */}
                                            <Button
                                                onClick={() => handleDeleteAccount(user.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                title="Excluir Conta"
                                            >
                                                <Trash2 size={18} />
                                            </Button>

                                            {/* Expand */}
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
                                        Propostas Compartilhadas ({user.shared_count})
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
    );
}
