'use client';

import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { X, Map, Building2, Settings, LogOut } from 'lucide-react';

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
        { id: 'map' as const, icon: Map, label: 'Mapa de Pontos', description: 'Visualizar pontos OOH no mapa', type: 'view' as const },
        { id: 'exibidoras' as const, icon: Building2, label: 'Exibidoras', description: 'Gerenciar exibidoras', type: 'view' as const },
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

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setMenuOpen(false)}
            />

            {/* Menu Lateral */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out">
                {/* Header */}
                <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-emidias-primary">Menu</h2>
                        <button
                            onClick={() => setMenuOpen(false)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Menu Items */}
                <nav className="p-4 space-y-2">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id)}
                                className={`w-full p-4 rounded-lg text-left transition-all ${
                                    isActive
                                        ? 'bg-emidias-primary text-white shadow-lg'
                                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                }`}
                            >
                                <div className="flex items-start gap-3">
                                    <Icon size={24} className={isActive ? 'text-white' : 'text-emidias-accent'} />
                                    <div className="flex-1">
                                        <h3 className={`font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                                            {item.label}
                                        </h3>
                                        <p className={`text-sm mt-1 ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-4" />

                    {/* Configurações - Apenas Master */}
                    {user?.role === 'master' && (
                        <button
                            onClick={handleSettings}
                            className="w-full p-4 rounded-lg text-left transition-all bg-gray-50 hover:bg-gray-100 text-gray-700"
                        >
                            <div className="flex items-start gap-3">
                                <Settings size={24} className="text-emidias-accent" />
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">
                                        Configurações
                                    </h3>
                                    <p className="text-sm mt-1 text-gray-500">
                                        Gerenciar usuários e conta
                                    </p>
                                </div>
                            </div>
                        </button>
                    )}

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full p-4 rounded-lg text-left transition-all bg-red-50 hover:bg-red-100 text-red-700"
                    >
                        <div className="flex items-start gap-3">
                            <LogOut size={24} className="text-red-600" />
                            <div className="flex-1">
                                <h3 className="font-semibold text-red-900">
                                    Sair
                                </h3>
                                <p className="text-sm mt-1 text-red-600">
                                    Fazer logout do sistema
                                </p>
                            </div>
                        </div>
                    </button>
                </nav>
            </div>
        </>
    );
}
