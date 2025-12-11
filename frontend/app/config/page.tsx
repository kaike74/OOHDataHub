'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { User, Trash2, UserPlus, ArrowLeft, Key, LogOut, Shield } from 'lucide-react';

interface UserData {
    id: number;
    email: string;
    name: string | null;
    role: 'master' | 'editor' | 'viewer';
    created_at: string;
}

export default function ConfigPage() {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    // Formulário de convite
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'master' | 'editor' | 'viewer'>('viewer');
    const [inviteLoading, setInviteLoading] = useState(false);

    // Formulário de senha
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);

    useEffect(() => {
        // Apenas master pode acessar configurações
        if (user?.role !== 'master') {
            router.push('/');
            return;
        }

        fetchUsers();
    }, [user, router]);

    const fetchUsers = async () => {
        try {
            const data = await api.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);

        try {
            await api.inviteUser(inviteEmail, '', inviteRole);
            alert('Usuário convidado com sucesso! Senha padrão: HubRadios123!');
            setInviteEmail('');
            setInviteRole('viewer');
            setShowInviteForm(false);
            fetchUsers();
        } catch (error: any) {
            alert('Erro ao convidar usuário: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setInviteLoading(false);
        }
    };

    const handleDeleteUser = async (userId: number, userEmail: string) => {
        if (userId === user?.id) {
            alert('Você não pode deletar sua própria conta!');
            return;
        }

        const confirmDelete = confirm(
            `Tem certeza que deseja remover o usuário ${userEmail}?\n\nEsta ação não pode ser desfeita.`
        );

        if (!confirmDelete) return;

        try {
            await api.deleteUser(userId);
            alert('Usuário removido com sucesso!');
            fetchUsers();
        } catch (error: any) {
            alert('Erro ao remover usuário: ' + (error.message || 'Erro desconhecido'));
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }

        if (newPassword.length < 6) {
            alert('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }

        setPasswordLoading(true);

        try {
            await api.changePassword(currentPassword, newPassword);
            alert('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setShowPasswordForm(false);
        } catch (error: any) {
            alert('Erro ao alterar senha: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleLogout = () => {
        const confirmLogout = confirm('Tem certeza que deseja sair?');
        if (confirmLogout) {
            logout();
            router.push('/login');
        }
    };

    if (!user || user.role !== 'master') {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-blue-600 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 hover:bg-white/20 rounded-lg transition"
                            >
                                <ArrowLeft size={24} />
                            </button>
                            <h1 className="text-3xl font-bold">Configurações</h1>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition"
                        >
                            <LogOut size={18} />
                            Sair
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* User Info Card */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <User size={24} className="text-blue-600" />
                        Minha Conta
                    </h2>
                    <div className="space-y-2">
                        <p className="text-gray-700">
                            <span className="font-medium">Email:</span> {user.email}
                        </p>
                        <p className="text-gray-700 flex items-center gap-2">
                            <span className="font-medium">Nível:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${user.role === 'master' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                }`}>
                                <Shield size={14} />
                                {user.role === 'master' ? 'Master' : user.role === 'editor' ? 'Editor' : 'Visualizador'}
                            </span>
                        </p>
                    </div>

                    <button
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                        <Key size={18} />
                        {showPasswordForm ? 'Cancelar' : 'Alterar Senha'}
                    </button>

                    {showPasswordForm && (
                        <form onSubmit={handleChangePassword} className="mt-4 space-y-4 bg-gray-50 p-4 rounded-lg">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Senha Atual
                                </label>
                                <input
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nova Senha
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={passwordLoading}
                                className="w-full bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
                            >
                                {passwordLoading ? 'Alterando...' : 'Alterar Senha'}
                            </button>
                        </form>
                    )}
                </div>

                {/* Users Management */}
                <div className="bg-white rounded-xl shadow-md p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <User size={24} className="text-blue-600" />
                            Gerenciar Usuários
                        </h2>
                        <button
                            onClick={() => setShowInviteForm(!showInviteForm)}
                            className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            <UserPlus size={18} />
                            {showInviteForm ? 'Cancelar' : 'Convidar Usuário'}
                        </button>
                    </div>

                    {showInviteForm && (
                        <form onSubmit={handleInvite} className="mb-6 bg-gray-50 p-4 rounded-lg space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email (@hubradios.com)
                                </label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="usuario@hubradios.com"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nível de Acesso
                                </label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value as 'master' | 'editor' | 'viewer')}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                                >
                                    <option value="viewer">Visualizador (apenas visualiza)</option>
                                    <option value="editor">Editor (pode criar e editar, mas não deletar)</option>
                                    <option value="master">Master (acesso total)</option>
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={inviteLoading}
                                className="w-full bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white py-2 rounded-lg font-medium transition disabled:opacity-50"
                            >
                                {inviteLoading ? 'Convidando...' : 'Enviar Convite'}
                            </button>
                        </form>
                    )}

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4">Carregando usuários...</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {users.map((u) => (
                                <div
                                    key={u.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                                                {u.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{u.email}</p>
                                                <p className="text-sm text-gray-600">Criado em {new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`px-3 py-1 rounded-full text-sm font-semibold ${u.role === 'master'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : u.role === 'editor'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-200 text-gray-800'
                                                }`}
                                        >
                                            {u.role === 'master' ? 'Master' : u.role === 'editor' ? 'Editor' : 'Visualizador'}
                                        </span>
                                        {u.id !== user.id && (
                                            <button
                                                onClick={() => handleDeleteUser(u.id, u.email)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                                title="Remover usuário"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
