'use client';

import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { X, Map, Building2, Settings, LogOut, ChevronRight, Shield, Users, Trash2, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NavigationMenu() {
    const router = useRouter();
    const isMenuOpen = useStore((state) => state.isMenuOpen);
    const setMenuOpen = useStore((state) => state.setMenuOpen);
    const currentView = useStore((state) => state.currentView);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const user = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);
    const selectedProposta = useStore((state) => state.selectedProposta);
    const setSelectedProposta = useStore((state) => state.setSelectedProposta);

    if (!isMenuOpen) return null;
    if (!user) return null; // Safety: Anonymous users should never see the menu

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
        {
            id: 'clientes' as const,
            icon: Users, // Or Briefcase/Building
            label: 'Clientes',
            description: 'Gerenciar carteira de clientes',
            type: 'view' as const
        },
        {
            id: 'propostas' as const,
            icon: FileText, // Changed from Users to FileText to allow Users for Clientes
            label: 'Propostas',
            description: 'Gerenciar propostas por cliente',
            type: 'view' as const
        },
        {
            id: 'contas' as const,
            icon: Shield,
            label: 'Contas',
            description: 'Gerenciar acesso de clientes',
            type: 'view' as const
        },
        {
            id: 'lixeira' as const,
            icon: Trash2,
            label: 'Lixeira',
            description: 'Itens arquivados e excluídos',
            type: 'view' as const
        },
    ];

    // Filter menu items for clients
    const filteredMenuItems = user?.role === 'client'
        ? menuItems.filter(item => item.id === 'propostas' || item.id === 'clientes')
        : menuItems;

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

    const handleViewChange = (viewId: 'map' | 'exibidoras' | 'clientes' | 'propostas' | 'contas' | 'lixeira') => {
        // If we're leaving proposal editing mode (map with cart), clear the proposta
        if (selectedProposta && viewId !== 'propostas') {
            setSelectedProposta(null);
        }

        if (viewId === 'propostas') {
            router.push('/admin/proposals');
        } else if (viewId === 'clientes') {
            router.push('/admin/clients');
        } else if (viewId === 'contas') {
            router.push('/admin/accounts');
        } else if (viewId === 'lixeira') {
            router.push('/admin/trash');
        } else if (viewId === 'map' || viewId === 'exibidoras') {
            router.push('/');
        }

        setCurrentView(viewId as any); // Cast because store might not have updated type definition yet
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
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 transition-opacity animate-in fade-in duration-300"
                onClick={() => setMenuOpen(false)}
            />

            {/* Menu Panel - Side 40 (Below Header which is 50) */}
            <div className="fixed right-0 top-16 h-[calc(100vh-64px)] w-full sm:w-80 bg-white/90 backdrop-blur-xl shadow-emidias-2xl z-40 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col border-l border-white/20 animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="flex-shrink-0 p-6 border-b border-gray-100/50">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Menu</h2>
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* User Info Card */}
                    {user && (
                        <div className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emidias-primary to-emidias-primary-dark flex items-center justify-center text-white font-bold text-sm shadow-md">
                                    {user.email[0].toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-gray-900 truncate text-sm">
                                        {user.email}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        {roleBadge && (
                                            <>
                                                <Shield size={10} className={roleBadge.text} />
                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${roleBadge.text}`}>
                                                    {roleBadge.label}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">
                        Navegação
                    </p>
                    <div className="space-y-1">
                        {filteredMenuItems.map((item) => {
                            const Icon = item.icon;
                            // If there's a selected proposal and we're on map view, consider "Propostas" as active
                            const isActive = selectedProposta && currentView === 'map'
                                ? item.id === 'propostas'
                                : currentView === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleViewChange(item.id)}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all group",
                                        isActive
                                            ? "bg-emidias-primary text-white shadow-lg shadow-emidias-primary/20"
                                            : "hover:bg-gray-50 text-gray-600"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-lg transition-colors",
                                        isActive ? "bg-white/10 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-emidias-accent group-hover:shadow-sm"
                                    )}>
                                        <Icon size={18} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className={cn("font-medium text-sm", isActive ? "text-white" : "text-gray-900")}>
                                            {item.label}
                                        </p>
                                        <p className={cn("text-[11px] mt-0.5 truncate", isActive ? "text-white/70" : "text-gray-400")}>
                                            {item.description}
                                        </p>
                                    </div>
                                    {isActive && <ChevronRight size={16} className="text-white/50" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Divider */}
                    <div className="my-6 border-t border-gray-100/50" />

                    {/* System Actions */}
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">
                        Sistema
                    </p>
                    <div className="space-y-1">
                        {/* Settings */}
                        <button
                            onClick={handleSettings}
                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-all group"
                        >
                            <div className="p-2 rounded-lg bg-gray-100 text-gray-500 group-hover:bg-white group-hover:text-emidias-accent group-hover:shadow-sm transition-colors">
                                <Settings size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-sm text-gray-900">
                                    Configurações
                                </p>
                                <p className="text-[11px] mt-0.5 text-gray-400 truncate">
                                    Segurança e preferências
                                </p>
                            </div>
                        </button>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-emidias-danger hover:bg-emidias-danger/5 transition-all group"
                        >
                            <div className="p-2 rounded-lg bg-emidias-danger/5 text-emidias-danger group-hover:bg-emidias-danger/10 transition-colors">
                                <LogOut size={18} />
                            </div>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-sm">
                                    Sair
                                </p>
                                <p className="text-[11px] mt-0.5 opacity-60">
                                    Encerrar sessão
                                </p>
                            </div>
                        </button>
                    </div>
                </nav>

                {/* Footer */}
                <div className="flex-shrink-0 p-4 border-t border-gray-100/50 bg-gray-50/50 backdrop-blur-md">
                    <p className="text-center text-[10px] text-gray-400 font-medium">
                        OOH Data Hub &copy; {new Date().getFullYear()} • v1.4.0
                    </p>
                </div>
            </div>
        </>
    );
}
