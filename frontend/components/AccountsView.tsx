'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';
import AccountsTable from '@/components/accounts/AccountsTable';
import AccountDetailsSidebar from '@/components/accounts/AccountDetailsSidebar';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';

interface UserAccount {
    id: number;
    name: string;
    email: string;
    type: 'internal' | 'external';
    role: string;
    created_at: string;
    shared_count: number;
}

export default function AccountsView() {
    const [accounts, setAccounts] = useState<UserAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);

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

    // Filter
    const filteredAccounts = accounts.filter(user =>
        (user.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full bg-gray-50 flex flex-col overflow-hidden relative">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                <div className="max-w-7xl mx-auto">
                    {/* Header Area */}
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Contas e Permissões</h2>
                            <p className="text-gray-500 text-sm">Gerencie usuários internos e externos.</p>
                        </div>

                        <div className="relative w-full sm:w-auto z-50">
                            <AnimatedSearchBar
                                value={searchTerm}
                                onChange={setSearchTerm}
                                placeholder="Buscar usuário..."
                                width="300px"
                            />
                        </div>
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
        </div>
    );
}
