'use client';

import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { X, Map, Building2, Settings, LogOut, User, ChevronRight, Shield } from 'lucide-react';

export default function NavigationMenu() {
    const router = useRouter();
    const isMenuOpen = useStore((state) => state.isMenuOpen);
    const setMenuOpen = useStore((state) => state.setMenuOpen);
    const currentView = useStore((state) => state.currentView);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const user = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);

    if (!isMenuOpen) return null;

    const menuItems = [
        {
            id: 'map' as const,
            icon: Map,
            label: 'Mapa de Pontos',
            description: 'Visualizar pontos OOH no mapa',
            type: 'view' as const
        },
        {
            id: 'exibidoras' as const,
            icon: Building2,
            label: 'Exibidoras',
            description: 'Gerenciar empresas exibidoras',
            type: 'view' as const
        },
    ];

    const handleLogout = () => {
        const confirmLogout = confirm('Tem certeza que deseja sair?');
        if (confirmLogout) {
            logout();
            setMenuOpen(false);
            router.push('/login');
        }
    };

    const handleSettings = () => {
        setMenuOpen(false);
        router.push('/config');
    };

    const handleViewChange = (viewId: 'map' | 'exibidoras') => {
        setCurrentView(viewId);
        setMenuOpen(false);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'master':
                return { bg: 'bg-emidias-accent/10', text: 'text-emidias-accent', label: 'Master' };
            case 'editor':
                return { bg: 'bg-emidias-primary/10', text: 'text-emidias-primary', label: 'Editor' };
            default:
                return { bg: 'bg-emidias-gray-100', text: 'text-emidias-gray-600', label: 'Visualizador' };
        }
    };

    const roleBadge = user ? getRoleBadge(user.role) : null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
                onClick={() => setMenuOpen(false)}
            />

            {/* Menu Panel */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-full sm:w-96 bg-white shadow-emidias-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col animate-slide-in-right">
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-emidias-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-emidias-gray-900">Menu</h2>
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="w-10 h-10 flex items-center justify-center text-emidias-gray-400 hover:text-emidias-gray-600 hover:bg-emidias-gray-100 rounded-xl transition-all"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    {/* User Info Card */}
                    {user && (
                        <div className="p-4 bg-gradient-to-r from-emidias-gray-50 to-transparent rounded-xl border border-emidias-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-emidias-gray-900 truncate text-sm">
                                        {user.email}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <Shield size={12} className={roleBadge?.text} />
                                        <span className={`text-xs font-medium ${roleBadge?.text}`}>
                                            {roleBadge?.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-4">
                    <p className="text-xs font-semibold text-emidias-gray-400 uppercase tracking-wider mb-3 px-2">
                        Navegação
                    </p>
                    <div className="space-y-2">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleViewChange(item.id)}
                                    className={`settings-nav-item w-full group ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={22} className={isActive ? 'text-white' : 'text-emidias-accent'} />
                                    <div className="flex-1 text-left">
                                        <p className={`font-semibold ${isActive ? 'text-white' : 'text-emidias-gray-900'}`}>
                                            {item.label}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-emidias-gray-500'}`}>
                                            {item.description}
                                        </p>
                                    </div>
                                    <ChevronRight
                                        size={18}
                                        className={`${isActive ? 'text-white' : 'text-emidias-gray-400 group-hover:text-emidias-accent'} transition-all ${isActive ? 'translate-x-1' : 'group-hover:translate-x-1'}`}
                                    />
                                </button>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="my-6 border-t border-emidias-gray-100" />

                    {/* System Actions */}
                    <p className="text-xs font-semibold text-emidias-gray-400 uppercase tracking-wider mb-3 px-2">
                        Sistema
                    </p>
                    <div className="space-y-2">
                        {/* Settings */}
                        <button
                            onClick={handleSettings}
                            className="settings-nav-item w-full group"
                        >
                            <Settings size={22} className="text-emidias-accent" />
                            <div className="flex-1 text-left">
                                <p className="font-semibold text-emidias-gray-900">
                                    Configurações
                                </p>
                                <p className="text-xs mt-0.5 text-emidias-gray-500">
                                    Conta, segurança e preferências
                                </p>
                            </div>
                            <ChevronRight size={18} className="text-emidias-gray-400 group-hover:text-emidias-accent group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-4 rounded-xl bg-emidias-danger/5 hover:bg-emidias-danger/10 text-emidias-danger transition-all group"
                        >
                            <LogOut size={22} />
                            <div className="flex-1 text-left">
                                <p className="font-semibold">
                                    Sair
                                </p>
                                <p className="text-xs mt-0.5 opacity-70">
                                    Encerrar sessão
                                </p>
                            </div>
                            <ChevronRight size={18} className="opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </nav>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-emidias-gray-100 bg-emidias-gray-50">
                    <p className="text-center text-xs text-emidias-gray-400">
                        OOH Data Hub &copy; {new Date().getFullYear()}
                    </p>
                    <p className="text-center text-[10px] text-emidias-gray-300 mt-1">
                        E-MÍDIAS
                    </p>
                </div>
            </div>
        </>
    );
}
