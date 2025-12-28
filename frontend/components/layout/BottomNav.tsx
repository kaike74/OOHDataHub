'use client';

import { FileText, Map, Users, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ViewType } from './MainTabs';

interface BottomNavProps {
    currentView: ViewType;
    onChangeView: (view: ViewType) => void;
    onMenuClick: () => void;
}

export default function BottomNav({ currentView, onChangeView, onMenuClick }: BottomNavProps) {
    const tabs = [
        { id: 'propostas' as const, label: 'Propostas', icon: FileText },
        { id: 'map' as const, label: 'Mapa', icon: Map },
        { id: 'clientes' as const, label: 'Clientes', icon: Users },
    ];

    return (
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-[60px] bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 px-4 flex items-center justify-around pb-safe">
            {tabs.map((tab) => {
                const isActive = currentView === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onChangeView(tab.id)}
                        className="flex flex-col items-center gap-1 group w-16"
                    >
                        <div className={cn(
                            "p-1.5 rounded-xl transition-all duration-300",
                            isActive
                                ? "text-white bg-emidias-primary shadow-lg shadow-emidias-primary/30 translate-y-[-4px]"
                                : "text-gray-400 group-hover:text-gray-600"
                        )}>
                            <Icon size={20} className={cn(isActive ? "fill-white/20" : "")} />
                        </div>
                        <span className={cn(
                            "text-[10px] font-medium transition-colors",
                            isActive ? "text-emidias-primary" : "text-gray-400"
                        )}>
                            {tab.label}
                        </span>
                    </button>
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
