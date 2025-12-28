'use client';

import { useState } from 'react';
import {
    FileText, Map, Users, Building2, Shield, Trash2,
    MoreHorizontal, ChevronDown, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewType = 'map' | 'propostas' | 'clientes' | 'exibidoras' | 'contas' | 'lixeira';

interface MainTabsProps {
    currentView: ViewType;
    onChangeView: (view: ViewType) => void;
    className?: string;
    counts?: Partial<Record<ViewType, number>>;
}

export default function MainTabs({ currentView, onChangeView, className, counts }: MainTabsProps) {
    const [isMoreOpen, setIsMoreOpen] = useState(false);

    const mainTabs = [
        { id: 'propostas' as const, label: 'Propostas', icon: FileText },
        { id: 'map' as const, label: 'Mapa', icon: Map },
        { id: 'clientes' as const, label: 'Clientes', icon: Users },
    ];

    const secondaryTabs = [
        { id: 'exibidoras' as const, label: 'Exibidoras', icon: Building2 },
        { id: 'contas' as const, label: 'Contas', icon: Shield },
        { id: 'lixeira' as const, label: 'Lixeira', icon: Trash2 },
    ];

    const isSecondaryActive = secondaryTabs.some(t => t.id === currentView);

    return (
        <div className={cn("flex items-center gap-1", className)}>
            {/* Primary Tabs */}
            {mainTabs.map((tab) => {
                const isActive = currentView === tab.id;
                const Icon = tab.icon;
                const count = counts?.[tab.id];

                return (
                    <button
                        key={tab.id}
                        onClick={() => onChangeView(tab.id)}
                        className={cn(
                            "relative px-4 py-2.5 rounded-t-lg flex items-center gap-2 transition-all duration-200 group overflow-hidden",
                            isActive
                                ? "text-emidias-primary bg-white shadow-[0_-1px_2px_rgba(0,0,0,0.02)] border-t-2 border-emidias-primary"
                                : "text-gray-600 hover:text-gray-900 hover:bg-black/[0.02]"
                        )}
                    >
                        {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-b from-emidias-primary/5 to-transparent pointer-events-none" />
                        )}

                        <Icon
                            size={16}
                            className={cn(
                                "transition-colors",
                                isActive ? "text-emidias-primary fill-emidias-primary/10" : "text-gray-500 group-hover:text-gray-700"
                            )}
                        />

                        <span className={cn(
                            "text-sm font-medium",
                            isActive ? "font-semibold" : ""
                        )}>
                            {tab.label}
                        </span>

                        {count !== undefined && count > 0 && (
                            <span className={cn(
                                "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                                isActive
                                    ? "bg-emidias-primary/10 text-emidias-primary"
                                    : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                            )}>
                                {count}
                            </span>
                        )}

                        {/* Active Indicator (Bottom Line) and Background */}
                        {isActive && (
                            <>
                                <div className="absolute inset-0 bg-gradient-to-b from-emidias-primary/5 to-transparent pointer-events-none animate-in fade-in duration-300" />
                                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emidias-primary rounded-t-full animate-in zoom-in-x duration-300" />
                            </>
                        )}
                    </button>
                );
            })}

            {/* Separator */}
            <div className="w-px h-5 bg-gray-300 mx-1" />

            {/* Secondary/More Menu */}
            <div className="relative">
                <button
                    onClick={() => setIsMoreOpen(!isMoreOpen)}
                    onBlur={() => setTimeout(() => setIsMoreOpen(false), 200)}
                    className={cn(
                        "px-3 py-2.5 rounded-lg flex items-center gap-1.5 transition-all text-sm font-medium",
                        isSecondaryActive || isMoreOpen
                            ? "text-gray-900 bg-gray-100" // Not white to differentiate from active tab
                            : "text-gray-500 hover:text-gray-900 hover:bg-black/[0.02]"
                    )}
                >
                    <LayoutGrid size={16} />
                    <span>Mais</span>
                    <ChevronDown size={14} className={cn("transition-transform", isMoreOpen ? "rotate-180" : "")} />
                </button>

                {/* Dropdown */}
                <div
                    className={cn(
                        "absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 transform transition-all origin-top-left",
                        isMoreOpen
                            ? "opacity-100 scale-100 translate-y-0"
                            : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                    )}
                >
                    <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Outras Seções
                    </div>

                    {secondaryTabs.map((tab) => {
                        const isActive = currentView === tab.id;
                        const Icon = tab.icon;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => {
                                    onChangeView(tab.id);
                                    setIsMoreOpen(false);
                                }}
                                className={cn(
                                    "w-full px-3 py-2 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left",
                                    isActive ? "bg-emidias-primary/5 text-emidias-primary font-medium" : "text-gray-700"
                                )}
                            >
                                <Icon size={16} className={isActive ? "text-emidias-primary" : "text-gray-400"} />
                                <span className="text-sm">{tab.label}</span>
                                {isActive && <div className="ml-auto w-1.5 h-1.5 bg-emidias-primary rounded-full" />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
