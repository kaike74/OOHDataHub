'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';
import AccountsTable from '@/components/accounts/AccountsTable';
import AccountDetailsSidebar from '@/components/accounts/AccountDetailsSidebar';
import CreateUserModal from '@/components/accounts/CreateUserModal';
import { Button } from '@/components/ui/Button';
import { Plus, AlertCircle } from 'lucide-react';

interface UserAccount {
    id: number;
    name: string;
    email: string;
    type: 'internal' | 'external';
    role: string;
    created_at: string;
    shared_count: number;
}

type UserTypeFilter = 'internal' | 'external';

interface AccountsViewProps {
    searchTerm?: string;
}

export default function AccountsView({ searchTerm = '' }: AccountsViewProps) {
    const user = useStore((state) => state.user);
    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);
    const [userTypeFilter, setUserTypeFilter] = useState<UserTypeFilter>('internal');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // Access Control: Only internal admins can access this page
    const canAccess = user?.type === 'internal' && (user?.role === 'admin' || user?.role === 'master');

    useEffect(() => {
        if (canAccess) {
            loadAccounts();
        } else {
            setLoading(false);
        }
    }, [canAccess]);

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

    const handleDeleteAccount = async (userId: number) => {
        if (!confirm('Tem certeza que deseja excluir esta conta? Todas as propostas compartilhadas serão removidas deste usuário.')) return;
        try {
            await api.deleteAccount(userId);
            setAccounts(prev => prev.filter(u => u.id !== userId));
            if (selectedAccount?.id === userId) setSelectedAccount(null);
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

    // Filter by user type
    const typeFilteredAccounts = accounts.filter(user => user.type === userTypeFilter);

    // Filter by search term
    const filteredAccounts = typeFilteredAccounts.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Show access denied message if user doesn't have permission
    if (!canAccess) {
        return (
            <div className="h-full bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Restrito</h2>
                    <p className="text-gray-600 mb-4">
                        Apenas administradores internos podem acessar a gestão de usuários.
                    </p>
                    <p className="text-sm text-gray-500">
                        Se você acredita que deveria ter acesso, entre em contato com um administrador.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                <div className="w-full max-w-[1920px] mx-auto">
                    {/* Filter Buttons + Create Button */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setUserTypeFilter('internal')}
                                variant={userTypeFilter === 'internal' ? 'primary' : 'outline'}
                                size="sm"
                                className={userTypeFilter === 'internal' ? 'bg-purple-600 hover:bg-purple-700' : 'hover:bg-gray-100'}
                            >
                                Interno
                            </Button>
                            <Button
                                onClick={() => setUserTypeFilter('external')}
                                variant={userTypeFilter === 'external' ? 'primary' : 'outline'}
                                size="sm"
                                className={userTypeFilter === 'external' ? 'bg-emidias-primary hover:bg-emidias-primary/90' : 'hover:bg-gray-100'}
                            >
                                Externo
                            </Button>
                        </div>

                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            size="sm"
                            className="bg-emidias-primary hover:bg-emidias-primary/90 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Criar Usuário
                        </Button>
                    </div>

                    <AccountsTable
                        accounts={filteredAccounts}
                        isLoading={loading}
                        onRowClick={setSelectedAccount}
                        onDelete={handleDeleteAccount}
                        onResetPassword={handleResetPassword}
                    />
                </div>
            </div>

            <AccountDetailsSidebar
                isOpen={!!selectedAccount}
                account={selectedAccount}
                onClose={() => setSelectedAccount(null)}
            />

            <CreateUserModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                userType={userTypeFilter}
                onSuccess={loadAccounts}
            />
        </div>
    );
}
