'use client';

import { FileText, Map, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BottomNavProps {
    onMenuClick: () => void;
}

export default function BottomNav({ onMenuClick }: BottomNavProps) {
    const pathname = usePathname();

    const isActiveTab = (path: string) => {
        if (path === '/') return pathname === '/inicio';
        return pathname.startsWith(path);
    };

    const tabs = [
        { id: '/propostas', label: 'Propostas', icon: FileText },
        { id: '/mapa', label: 'Mapa', icon: Map },
        { id: '/clientes', label: 'Clientes', icon: Users },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-plura-primary/95 backdrop-blur-sm border-t border-plura-primary-light shadow-lg z-50 px-4 flex items-center justify-around pb-safe">
            {tabs.map((tab) => {
                const isActive = isActiveTab(tab.id);
                const Icon = tab.icon;

                return (
                    <Link
                        key={tab.id}
                        href={tab.id}
                        className="flex flex-col items-center gap-1 group w-16"
                    >
                        <div className={cn(
                            "p-1.5 rounded-xl transition-all duration-300",
                            isActive
                                ? "text-white bg-plura-accent shadow-lg shadow-plura-accent/30 translate-y-[-4px]"
                                : "text-gray-300 group-hover:text-plura-accent"
                        )}>
                            <Icon size={20} className={cn(isActive ? "fill-white/20" : "")} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium transition-colors",
                            isActive ? "text-plura-accent" : "text-gray-300"
                        )}>
                            {tab.label}
                        </span>
                    </Link>
                );
            })}

            {/* More / Menu */}
            <button
                onClick={onMenuClick}
                className="flex flex-col items-center gap-1 group w-16"
            >
                <div className="p-1.5 rounded-xl text-gray-400 group-hover:text-gray-600 transition-colors">
                    <Menu size={20} />
                </div>
                <span className="text-[10px] font-medium text-gray-400">
                    Mais
                </span>
            </button>
        </div>
    );
}
