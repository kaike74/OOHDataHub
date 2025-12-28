'use client';

import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import {
    Map,
    Building2,
    Users,
    FileText,
    Shield,
    Trash2,
    Settings,
    LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

export default function ModernNavigation() {
    const router = useRouter();
    const currentView = useStore((state) => state.currentView);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const user = useStore((state) => state.user);
    const logout = useStore((state) => state.logout);
    const selectedProposta = useStore((state) => state.selectedProposta);
    const setMenuOpen = useStore((state) => state.setMenuOpen);

    // Only render for authenticated users
    if (!user) return null;

    const mainItems = [
        {
            id: 'map' as const,
            icon: Map,
            label: 'Mapa',
            activeColor: 'text-blue-500',
            bgColor: 'bg-blue-500/10'
        },
        {
            id: 'exibidoras' as const,
            icon: Building2,
            label: 'Exibidoras',
            activeColor: 'text-purple-500',
            bgColor: 'bg-purple-500/10'
        },
        {
            id: 'clientes' as const,
            icon: Users,
            label: 'Clientes',
            activeColor: 'text-green-500',
            bgColor: 'bg-green-500/10'
        },
        {
            id: 'propostas' as const,
            icon: FileText,
            label: 'Propostas',
            activeColor: 'text-orange-500',
            bgColor: 'bg-orange-500/10'
        }
    ];

    const systemItems = [
        {
            id: 'contas' as const,
            icon: Shield,
            label: 'Contas',
            activeColor: 'text-indigo-500',
            bgColor: 'bg-indigo-500/10'
        },
        {
            id: 'lixeira' as const,
            icon: Trash2,
            label: 'Lixeira',
            activeColor: 'text-red-500',
            bgColor: 'bg-red-500/10'
        }
    ];

    // Filter items based on user role
    const visibleMainItems = user.type === 'external'
        ? mainItems.filter(item => ['propostas', 'clientes'].includes(item.id))
        : mainItems;

    const visibleSystemItems = user.type === 'external'
        ? [] // External users don't see system items here
        : systemItems;

    const handleViewChange = (viewId: string) => {
        if (viewId === 'propostas') router.push('/admin/proposals');
        else if (viewId === 'clientes') router.push('/admin/clients');
        else if (viewId === 'contas') router.push('/admin/accounts');
        else if (viewId === 'lixeira') router.push('/admin/trash');
        else if (viewId === 'map' || viewId === 'exibidoras') router.push('/');

        setCurrentView(viewId as any);
    };

    const handleLogout = () => {
        if (confirm('Tem certeza que deseja sair?')) {
            logout();
            router.push('/login');
        }
    };

    return (
        <TooltipProvider>
            {/* Desktop: Floating Left Rail (or Bottom Dock) - Let's do Left Rail for Map Apps */}
            <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col gap-6">

                {/* Main Navigation Group */}
                <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/5 rounded-2xl p-2 flex flex-col gap-2 relative overflow-hidden group/dock">
                    {/* Glass Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent pointer-events-none" />

                    {visibleMainItems.map((item) => {
                        const isActive = item.id === 'propostas' && selectedProposta
                            ? true
                            : currentView === item.id;

                        return (
                            <Tooltip key={item.id} delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => handleViewChange(item.id)}
                                        className={cn(
                                            "relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 group hover:scale-110",
                                            isActive
                                                ? `${item.bgColor} ${item.activeColor} shadow-inner`
                                                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                        )}
                                    >
                                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />

                                        {/* Active Indicator Dot */}
                                        {isActive && (
                                            <div className={cn(
                                                "absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-3 rounded-l-full bg-current opacity-100 transition-all",
                                                item.activeColor
                                            )} />
                                        )}
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-semibold" sideOffset={10}>
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}

                    {visibleSystemItems.length > 0 && (
                        <>
                            <div className="w-full h-px bg-gray-200/50 my-1" />
                            {visibleSystemItems.map((item) => {
                                const isActive = currentView === item.id;
                                return (
                                    <Tooltip key={item.id} delayDuration={0}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => handleViewChange(item.id)}
                                                className={cn(
                                                    "w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 group",
                                                    isActive
                                                        ? `${item.bgColor} ${item.activeColor} shadow-inner`
                                                        : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                                                )}
                                            >
                                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-semibold" sideOffset={10}>
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </>
                    )}
                </div>

                {/* User Actions Group (Settings / Logout) */}
                <div className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-black/5 rounded-2xl p-2 flex flex-col gap-2">
                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => router.push('/config')}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-all duration-300 hover:rotate-45"
                            >
                                <Settings size={20} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>Configurações</TooltipContent>
                    </Tooltip>

                    <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleLogout}
                                className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-300 hover:scale-110"
                            >
                                <LogOut size={20} />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10}>Sair</TooltipContent>
                    </Tooltip>
                </div>
            </div>

            {/* Mobile Bottom Bar (iOS Style) */}
            <div className="md:hidden fixed bottom-6 left-6 right-6 z-50">
                <div className="bg-white/90 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-black/10 rounded-full px-6 py-4 flex items-center justify-between">
                    {visibleMainItems.map((item) => {
                        const isActive = item.id === 'propostas' && selectedProposta
                            ? true
                            : currentView === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleViewChange(item.id)}
                                className={cn(
                                    "flex flex-col items-center gap-1 transition-all",
                                    isActive ? item.activeColor : "text-gray-400"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-full transition-all",
                                    isActive ? item.bgColor : ""
                                )}>
                                    <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                            </button>
                        );
                    })}

                    <button
                        onClick={() => setMenuOpen(true)} // Keep the old menu for "More" items on mobile
                        className="flex flex-col items-center gap-1 text-gray-400"
                    >
                        <div className="p-2">
                            <Settings size={24} />
                        </div>
                    </button>
                </div>
            </div>
        </TooltipProvider>
    );
}
