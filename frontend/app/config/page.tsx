'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import {
    User,
    Trash2,
    UserPlus,
    ArrowLeft,
    Key,
    LogOut,
    Shield,
    Users,
    Lock,
    Bell,
    Palette,
    Settings,
    ChevronRight,
    Mail,
    Calendar,
    Loader2,
    Eye,
    EyeOff,
    CheckCircle2
} from 'lucide-react';

interface UserData {
    id: number;
    email: string;
    name: string | null;
    role: 'master' | 'editor' | 'viewer';
    created_at: string;
}

type SettingsSection = 'profile' | 'security' | 'users';

export default function ConfigPage() {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

    // Formulário de convite
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState<'master' | 'editor' | 'viewer'>('viewer');
    const [inviteLoading, setInviteLoading] = useState(false);

    // Formulário de senha
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user.role === 'master') {
            fetchUsers();
        } else {
            setLoading(false);
        }
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
            alert('Usuário convidado com sucesso! Um email foi enviado com as credenciais de acesso.');
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
            setPasswordSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(false), 3000);
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

    if (!user) {
        return null;
    }

    const navigationItems = [
        { id: 'profile' as const, icon: User, label: 'Perfil', description: 'Informações da conta' },
        { id: 'security' as const, icon: Lock, label: 'Segurança', description: 'Senha e autenticação' },
        ...(user.role === 'master' ? [{ id: 'users' as const, icon: Users, label: 'Usuários', description: 'Gerenciar acessos' }] : []),
    ];

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'master':
                return 'badge badge-accent';
            case 'editor':
                return 'badge badge-primary';
            default:
                return 'badge bg-emidias-gray-100 text-emidias-gray-600';
        }
    };

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'master':
                return 'Master';
            case 'editor':
                return 'Editor';
            default:
                return 'Visualizador';
        }
    };

    return (
        <div className="min-h-screen bg-emidias-gray-50">
            {/* Header */}
            <header className="gradient-primary text-white sticky top-0 z-50 shadow-emidias-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.push('/')}
                                className="p-2 hover:bg-white/10 rounded-lg transition-all hover:-translate-x-0.5"
                            >
                                <ArrowLeft size={22} />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold">Configurações</h1>
                                <p className="text-xs text-white/60">Gerencie sua conta e preferências</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-sm font-medium"
                        >
                            <LogOut size={18} />
                            <span className="hidden sm:inline">Sair</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="card-base p-4 lg:sticky lg:top-24">
                            <nav className="space-y-1">
                                {navigationItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSection === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveSection(item.id)}
                                            className={`settings-nav-item w-full ${isActive ? 'active' : ''}`}
                                        >
                                            <Icon size={20} className={isActive ? 'text-white' : 'text-emidias-accent'} />
                                            <div className="flex-1 text-left">
                                                <p className={`font-medium text-sm ${isActive ? 'text-white' : 'text-emidias-gray-900'}`}>
                                                    {item.label}
                                                </p>
                                                <p className={`text-xs ${isActive ? 'text-white/70' : 'text-emidias-gray-500'}`}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className={`${isActive ? 'text-white' : 'text-emidias-gray-400'} transition-transform ${isActive ? 'rotate-90' : ''}`} />
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>
                    </aside>

                    {/* Content Area */}
                    <main className="flex-1 min-w-0">
                        {/* Profile Section */}
                        {activeSection === 'profile' && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="card-base p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-emidias-lg">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-emidias-gray-900">
                                                Minha Conta
                                            </h2>
                                            <p className="text-sm text-emidias-gray-500">
                                                Informações do seu perfil
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="sidebar-info-item">
                                            <Mail className="sidebar-info-icon" />
                                            <div>
                                                <p className="text-xs font-medium text-emidias-gray-500 uppercase tracking-wider">Email</p>
                                                <p className="text-emidias-gray-900 font-medium">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="sidebar-info-item">
                                            <Shield className="sidebar-info-icon" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-emidias-gray-500 uppercase tracking-wider">Nível de Acesso</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={getRoleBadge(user.role)}>
                                                        {getRoleLabel(user.role)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Role Permissions Info */}
                                <div className="card-base p-6">
                                    <h3 className="text-lg font-semibold text-emidias-gray-900 mb-4">
                                        Suas Permissões
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-3 p-3 bg-emidias-success/5 rounded-lg border border-emidias-success/10">
                                            <CheckCircle2 size={18} className="text-emidias-success" />
                                            <span className="text-sm text-emidias-gray-700">Visualizar pontos</span>
                                        </div>
                                        {(user.role === 'editor' || user.role === 'master') && (
                                            <>
                                                <div className="flex items-center gap-3 p-3 bg-emidias-success/5 rounded-lg border border-emidias-success/10">
                                                    <CheckCircle2 size={18} className="text-emidias-success" />
                                                    <span className="text-sm text-emidias-gray-700">Criar e editar pontos</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-emidias-success/5 rounded-lg border border-emidias-success/10">
                                                    <CheckCircle2 size={18} className="text-emidias-success" />
                                                    <span className="text-sm text-emidias-gray-700">Gerenciar exibidoras</span>
                                                </div>
                                            </>
                                        )}
                                        {user.role === 'master' && (
                                            <>
                                                <div className="flex items-center gap-3 p-3 bg-emidias-success/5 rounded-lg border border-emidias-success/10">
                                                    <CheckCircle2 size={18} className="text-emidias-success" />
                                                    <span className="text-sm text-emidias-gray-700">Deletar pontos</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-emidias-success/5 rounded-lg border border-emidias-success/10">
                                                    <CheckCircle2 size={18} className="text-emidias-success" />
                                                    <span className="text-sm text-emidias-gray-700">Gerenciar usuários</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <div className="space-y-6 animate-fade-in-up">
                                <div className="card-base p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-emidias-accent/10 rounded-xl flex items-center justify-center">
                                            <Key size={24} className="text-emidias-accent" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-emidias-gray-900">
                                                Alterar Senha
                                            </h2>
                                            <p className="text-sm text-emidias-gray-500">
                                                Mantenha sua conta segura
                                            </p>
                                        </div>
                                    </div>

                                    {passwordSuccess && (
                                        <div className="mb-6 p-4 bg-emidias-success/10 border border-emidias-success/20 rounded-lg flex items-center gap-3 animate-fade-in-up">
                                            <CheckCircle2 size={20} className="text-emidias-success" />
                                            <p className="text-emidias-success font-medium">Senha alterada com sucesso!</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleChangePassword} className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-emidias-gray-700">
                                                Senha Atual
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showCurrentPassword ? 'text' : 'password'}
                                                    value={currentPassword}
                                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                                    required
                                                    className="input-base pr-12"
                                                    placeholder="Digite sua senha atual"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emidias-gray-400 hover:text-emidias-gray-600 transition-colors"
                                                >
                                                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-emidias-gray-700">
                                                Nova Senha
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? 'text' : 'password'}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    required
                                                    minLength={6}
                                                    className="input-base pr-12"
                                                    placeholder="Mínimo 6 caracteres"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emidias-gray-400 hover:text-emidias-gray-600 transition-colors"
                                                >
                                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-sm font-medium text-emidias-gray-700">
                                                Confirmar Nova Senha
                                            </label>
                                            <input
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                minLength={6}
                                                className="input-base"
                                                placeholder="Repita a nova senha"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={passwordLoading}
                                            className="btn-base btn-accent w-full py-3 disabled:opacity-70"
                                        >
                                            {passwordLoading ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Key size={18} />
                                                    Alterar Senha
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Users Section */}
                        {activeSection === 'users' && user.role === 'master' && (
                            <div className="space-y-6 animate-fade-in-up">
                                {/* Users Header */}
                                <div className="card-base p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-emidias-accent/10 rounded-xl flex items-center justify-center">
                                                <Users size={24} className="text-emidias-accent" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-emidias-gray-900">
                                                    Gerenciar Usuários
                                                </h2>
                                                <p className="text-sm text-emidias-gray-500">
                                                    {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowInviteForm(!showInviteForm)}
                                            className={`btn-base ${showInviteForm ? 'btn-secondary' : 'btn-accent'} py-2.5 px-4`}
                                        >
                                            <UserPlus size={18} />
                                            <span className="hidden sm:inline">
                                                {showInviteForm ? 'Cancelar' : 'Convidar'}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Invite Form */}
                                    {showInviteForm && (
                                        <form onSubmit={handleInvite} className="p-5 bg-emidias-gray-50 rounded-xl space-y-4 mb-6 animate-fade-in-up">
                                            <h3 className="font-semibold text-emidias-gray-900">Convidar Novo Usuário</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-emidias-gray-700">
                                                        Email (@hubradios.com)
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={inviteEmail}
                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                        placeholder="usuario@hubradios.com"
                                                        required
                                                        className="input-base"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="block text-sm font-medium text-emidias-gray-700">
                                                        Nível de Acesso
                                                    </label>
                                                    <select
                                                        value={inviteRole}
                                                        onChange={(e) => setInviteRole(e.target.value as 'master' | 'editor' | 'viewer')}
                                                        className="input-base"
                                                    >
                                                        <option value="viewer">Visualizador</option>
                                                        <option value="editor">Editor</option>
                                                        <option value="master">Master</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={inviteLoading}
                                                className="btn-base btn-primary w-full py-3 disabled:opacity-70"
                                            >
                                                {inviteLoading ? (
                                                    <Loader2 size={20} className="animate-spin" />
                                                ) : (
                                                    <>
                                                        <Mail size={18} />
                                                        Enviar Convite
                                                    </>
                                                )}
                                            </button>
                                        </form>
                                    )}

                                    {/* Users List */}
                                    {loading ? (
                                        <div className="py-12 text-center">
                                            <Loader2 size={40} className="animate-spin mx-auto text-emidias-accent mb-4" />
                                            <p className="text-emidias-gray-500">Carregando usuários...</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {users.map((u, index) => (
                                                <div
                                                    key={u.id}
                                                    className="card-interactive p-4"
                                                    style={{ animationDelay: `${index * 0.05}s` }}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                            {u.email[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-emidias-gray-900 truncate">
                                                                {u.email}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Calendar size={12} className="text-emidias-gray-400" />
                                                                <span className="text-xs text-emidias-gray-500">
                                                                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className={getRoleBadge(u.role)}>
                                                                {getRoleLabel(u.role)}
                                                            </span>
                                                            {u.id !== user.id && (
                                                                <button
                                                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                                                    className="p-2 text-emidias-danger hover:bg-emidias-danger/10 rounded-lg transition-all hover:scale-105"
                                                                    title="Remover usuário"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
