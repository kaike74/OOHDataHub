'use client';

import { useState } from 'react';
import {
    FileText, Map, Users, Building2, Shield, Trash2,
    MoreHorizontal, ChevronDown, LayoutGrid, Home
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

export type ViewType = 'map' | 'propostas' | 'clientes' | 'exibidoras' | 'contas' | 'lixeira';

interface MainTabsProps {
    currentView: ViewType;
    onChangeView: (view: ViewType) => void;
    className?: string;
    counts?: Partial<Record<ViewType, number>>;
}

export default function MainTabs({ className, counts }: Omit<MainTabsProps, 'currentView' | 'onChangeView'>) {
    const { user } = useStore();
    const pathname = usePathname();

    const isInternal = user?.type === 'internal';
    const isMaster = user?.role === 'master' || user?.role === 'admin';
    const isExternal = user?.type === 'external';

    // Helper to check if tab is active
    const isActiveTab = (path: string) => {
        if (path === '/') return pathname === '/inicio';
        return pathname.startsWith(path);
    };

    // All Tabs Combined
    const allTabs = [
        { id: '/inicio', label: 'Início', icon: Home, show: true },
        { id: '/propostas', label: 'Propostas', icon: FileText, show: true },
        { id: '/mapa', label: 'Mapa', icon: Map, show: true },
        { id: '/clientes', label: 'Clientes', icon: Users, show: true },
        { id: '/exibidoras', label: 'Exibidoras', icon: Building2, show: isInternal },
        { id: '/contas', label: 'Contas', icon: Shield, show: isMaster },
        { id: '/lixeira', label: 'Lixeira', icon: Trash2, show: isMaster },
    ].filter(t => t.show !== false);

    return (
        <div className={cn("flex items-center gap-2 h-full", className)}>
            {allTabs.map((tab) => {
                const isActive = isActiveTab(tab.id);
                const Icon = tab.icon;
                const count = counts?.[tab.id.replace('/', '') as ViewType];

                return (
                    <Link
                        key={tab.id}
                        href={tab.id}
                        className={cn(
                            "group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] overflow-hidden whitespace-nowrap",
                            isActive
                                ? "bg-plura-accent text-white shadow-md shadow-plura-accent/20 max-w-[160px]"
                                : "bg-transparent text-gray-600 hover:bg-plura-accent-subtle hover:text-plura-accent max-w-[44px] hover:max-w-[160px]"
                        )}
                    >
                        <Icon
                            size={20}
                            className={cn(
                                "min-w-[20px] transition-colors",
                                isActive ? "text-white" : "text-gray-600 group-hover:text-plura-accent"
                            )}
                        />

                        <span className={cn(
                            "text-sm font-medium transition-opacity duration-300 delay-75",
                            isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        )}>
                            {tab.label}
                        </span>

                        {count !== undefined && count > 0 && (
                            <span className={cn(
                                "ml-auto px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none",
                                isActive
                                    ? "bg-white/20 text-white"
                                    : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                            )}>
                                {count}
                            </span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
