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
    ChevronRight,
    Mail,
    Calendar,
    CheckCircle2,
    Eye,
    EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';

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
                return 'badge bg-gray-100 text-gray-600';
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
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-emidias-primary to-[#0A0970] text-white sticky top-0 z-50 shadow-md">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={() => router.push('/')}
                                variant="ghost"
                                size="icon"
                                className="text-white hover:bg-white/10"
                            >
                                <ArrowLeft size={22} />
                            </Button>
                            <div>
                                <h1 className="text-xl font-bold">Configurações</h1>
                                <p className="text-xs text-white/60">Gerencie sua conta e preferências</p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="ghost"
                            className="text-white hover:bg-white/10"
                            leftIcon={<LogOut size={18} />}
                        >
                            <span className="hidden sm:inline">Sair</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 lg:sticky lg:top-24">
                            <nav className="space-y-1">
                                {navigationItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeSection === item.id;

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveSection(item.id)}
                                            className={`w-full flex items-center p-3 rounded-xl transition-all ${isActive ? 'bg-emidias-primary text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            <Icon size={20} className={isActive ? 'text-white' : 'text-emidias-accent'} />
                                            <div className="flex-1 text-left ml-3">
                                                <p className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                                    {item.label}
                                                </p>
                                                <p className={`text-xs ${isActive ? 'text-white/70' : 'text-gray-500'}`}>
                                                    {item.description}
                                                </p>
                                            </div>
                                            <ChevronRight size={16} className={`${isActive ? 'text-white' : 'text-gray-400'} transition-transform ${isActive ? 'rotate-90' : ''}`} />
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
                            <div className="space-y-6 animate-in fade-in-up duration-500">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-emidias-primary to-emidias-primary-light rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md">
                                            {user.email[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Minha Conta
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                Informações do seu perfil
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                                            <Mail className="text-emidias-primary mt-0.5" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email</p>
                                                <p className="text-gray-900 font-medium">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4 p-4 rounded-lg bg-gray-50">
                                            <Shield className="text-emidias-primary mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Nível de Acesso</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'master' ? 'bg-purple-100 text-purple-800' :
                                                        user.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {getRoleLabel(user.role)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Role Permissions Info */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        Suas Permissões
                                    </h3>
                                    <div className="grid sm:grid-cols-2 gap-3">
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                            <CheckCircle2 size={18} className="text-green-600" />
                                            <span className="text-sm text-gray-700">Visualizar pontos</span>
                                        </div>
                                        {(user.role === 'editor' || user.role === 'master') && (
                                            <>
                                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                                    <CheckCircle2 size={18} className="text-green-600" />
                                                    <span className="text-sm text-gray-700">Criar e editar pontos</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                                    <CheckCircle2 size={18} className="text-green-600" />
                                                    <span className="text-sm text-gray-700">Gerenciar exibidoras</span>
                                                </div>
                                            </>
                                        )}
                                        {user.role === 'master' && (
                                            <>
                                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                                    <CheckCircle2 size={18} className="text-green-600" />
                                                    <span className="text-sm text-gray-700">Deletar pontos</span>
                                                </div>
                                                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                                                    <CheckCircle2 size={18} className="text-green-600" />
                                                    <span className="text-sm text-gray-700">Gerenciar usuários</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Section */}
                        {activeSection === 'security' && (
                            <div className="space-y-6 animate-in fade-in-up duration-500">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-12 h-12 bg-emidias-accent/10 rounded-xl flex items-center justify-center">
                                            <Key size={24} className="text-emidias-accent" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-900">
                                                Alterar Senha
                                            </h2>
                                            <p className="text-sm text-gray-500">
                                                Mantenha sua conta segura
                                            </p>
                                        </div>
                                    </div>

                                    {passwordSuccess && (
                                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                            <CheckCircle2 size={20} className="text-green-600" />
                                            <p className="text-green-700 font-medium">Senha alterada com sucesso!</p>
                                        </div>
                                    )}

                                    <form onSubmit={handleChangePassword} className="space-y-5">
                                        <Input
                                            label="Senha Atual"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            placeholder="Digite sua senha atual"
                                            rightElement={
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                                    className="text-gray-400 hover:text-gray-600 p-1"
                                                >
                                                    {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            }
                                        />

                                        <Input
                                            label="Nova Senha"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            placeholder="Mínimo 6 caracteres"
                                            rightElement={
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="text-gray-400 hover:text-gray-600 p-1"
                                                >
                                                    {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                                </button>
                                            }
                                        />

                                        <Input
                                            label="Confirmar Nova Senha"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            placeholder="Repita a nova senha"
                                        />

                                        <Button
                                            type="submit"
                                            isLoading={passwordLoading}
                                            className="w-full"
                                            leftIcon={<Key size={18} />}
                                            variant="accent"
                                        >
                                            Alterar Senha
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Users Section */}
                        {activeSection === 'users' && user.role === 'master' && (
                            <div className="space-y-6 animate-in fade-in-up duration-500">
                                {/* Users Header */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-emidias-accent/10 rounded-xl flex items-center justify-center">
                                                <Users size={24} className="text-emidias-accent" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900">
                                                    Gerenciar Usuários
                                                </h2>
                                                <p className="text-sm text-gray-500">
                                                    {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => setShowInviteForm(!showInviteForm)}
                                            variant={showInviteForm ? 'secondary' : 'accent'}
                                            leftIcon={<UserPlus size={18} />}
                                        >
                                            <span className="hidden sm:inline">
                                                {showInviteForm ? 'Cancelar' : 'Convidar'}
                                            </span>
                                        </Button>
                                    </div>

                                    {/* Invite Form */}
                                    {showInviteForm && (
                                        <form onSubmit={handleInvite} className="p-5 bg-gray-50 rounded-xl space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 border border-gray-200">
                                            <h3 className="font-semibold text-gray-900">Convidar Novo Usuário</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                <Input
                                                    label="Email (@hubradios.com)"
                                                    type="email"
                                                    value={inviteEmail}
                                                    onChange={(e) => setInviteEmail(e.target.value)}
                                                    placeholder="usuario@hubradios.com"
                                                    required
                                                />
                                                <Select
                                                    label="Nível de Acesso"
                                                    value={inviteRole}
                                                    onChange={(e) => setInviteRole(e.target.value as 'master' | 'editor' | 'viewer')}
                                                >
                                                    <option value="viewer">Visualizador</option>
                                                    <option value="editor">Editor</option>
                                                    <option value="master">Master</option>
                                                </Select>
                                            </div>
                                            <Button
                                                type="submit"
                                                isLoading={inviteLoading}
                                                className="w-full"
                                                variant="primary"
                                                leftIcon={<Mail size={18} />}
                                            >
                                                Enviar Convite
                                            </Button>
                                        </form>
                                    )}

                                    {/* Users List */}
                                    {loading ? (
                                        <div className="space-y-4">
                                            {[1, 2, 3].map(i => (
                                                <Skeleton key={i} className="h-20 w-full rounded-xl" />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {users.map((u, index) => (
                                                <div
                                                    key={u.id}
                                                    className="bg-white p-4 rounded-xl border border-gray-200 hover:border-emidias-accent hover:shadow-md transition-all duration-200"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-emidias-primary to-emidias-primary-light rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                            {u.email[0].toUpperCase()}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-gray-900 truncate">
                                                                {u.email}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Calendar size={12} className="text-gray-400" />
                                                                <span className="text-xs text-gray-500">
                                                                    {new Date(u.created_at).toLocaleDateString('pt-BR')}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            {u.id === user.id ? (
                                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${u.role === 'master' ? 'bg-purple-100 text-purple-800' :
                                                                    u.role === 'editor' ? 'bg-blue-100 text-blue-800' :
                                                                        'bg-gray-100 text-gray-800'
                                                                    }`}>
                                                                    {getRoleLabel(u.role)}
                                                                </span>
                                                            ) : (
                                                                <Select
                                                                    value={u.role}
                                                                    onChange={async (e) => {
                                                                        const newRole = e.target.value as 'master' | 'editor' | 'viewer';
                                                                        try {
                                                                            await api.updateUserRole(u.id, newRole);
                                                                            fetchUsers();
                                                                        } catch (error: any) {
                                                                            alert('Erro ao atualizar nível de acesso: ' + (error.message || 'Erro desconhecido'));
                                                                        }
                                                                    }}
                                                                    className="w-40 text-sm py-1.5 h-auto"
                                                                >
                                                                    <option value="viewer">Visualizador</option>
                                                                    <option value="editor">Editor</option>
                                                                    <option value="master">Master</option>
                                                                </Select>
                                                            )}
                                                            {u.id !== user.id && (
                                                                <Button
                                                                    onClick={() => handleDeleteUser(u.id, u.email)}
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-red-500 hover:bg-red-50 hover:text-red-600"
                                                                    title="Remover usuário"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </Button>
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
