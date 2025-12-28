'use client';

import {
    Search, Bell, Settings, User, LogOut, Menu,
    MapPin, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MainTabs, { ViewType } from './MainTabs';
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { ReactNode, useState } from 'react';

interface TopBarProps {
    currentView: ViewType;
    onChangeView: (view: ViewType) => void;
    breadcrumbs: BreadcrumbItem[];
    user?: any;
    actions?: ReactNode;
    counts?: Partial<Record<ViewType, number>>;
}

export default function TopBar({ currentView, onChangeView, breadcrumbs, user, actions, counts }: TopBarProps) {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const logout = useStore((state) => state.logout);
    const { setMenuOpen } = useStore(); // Legacy menu for mobile or backup

    return (
        <div className="flex flex-col bg-white border-b border-gray-200 shadow-sm z-40 sticky top-0">
            {/* Top Strip: Logo | Breadcrumbs/Search | Actions */}
            <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">

                {/* Left: Logo & Breadcrumbs */}
                <div className="flex items-center gap-6 min-w-0 flex-1">
                    {/* Logo */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="w-8 h-8 bg-emidias-primary text-white rounded-lg flex items-center justify-center shadow-md">
                            <MapPin size={18} className="text-emidias-accent" />
                        </div>
                        <span className="hidden lg:block font-bold text-lg tracking-tight text-gray-900">
                            OOH Hub
                        </span>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-200 hidden md:block" />

                    {/* Breadcrumbs - Hidden on small mobile */}
                    <div className="hidden md:block min-w-0 overflow-hidden">
                        <Breadcrumbs items={breadcrumbs} />
                    </div>
                </div>

                {/* Center: Global Search (Placeholder for now) */}
                <div className="hidden max-w-md w-full mx-4 lg:block">
                    <div className="relative group">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emidias-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar (Ctrl+K)"
                            className="w-full bg-gray-100 hover:bg-gray-50 focus:bg-white border border-transparent focus:border-emidias-primary/30 rounded-lg py-1.5 pl-9 pr-3 text-sm transition-all outline-none"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
                            <span className="text-[10px] bg-white border border-gray-200 rounded px-1.5 text-gray-400 font-medium">⌘K</span>
                        </div>
                    </div>
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    {/* Context Actions (Mobile/Tablet might hide these or put in overflow? For now keep visible) */}
                    {actions && (
                        <div className="flex items-center gap-2 mr-2">
                            {actions}
                        </div>
                    )}

                    {/* Notifications */}
                    <button className="w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors relative">
                        <Bell size={18} />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-emidias-danger rounded-full border border-white" />
                    </button>

                    {/* User Profile */}
                    <div className="relative">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            onBlur={() => setTimeout(() => setIsUserMenuOpen(false), 200)}
                            className="flex items-center gap-2.5 pl-1 pr-1.5 py-1 hover:bg-gray-50 rounded-full border border-transparent hover:border-gray-200 transition-all"
                        >
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shadow-sm">
                                {user?.email?.[0].toUpperCase() || <User size={14} />}
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Strip: Navigation Tabs (Desktop) */}
            <div className="hidden md:flex px-4 sm:px-6 bg-gray-50/50 border-t border-gray-100 items-center justify-between">
                <MainTabs
                    currentView={currentView}
                    onChangeView={onChangeView}
                    counts={counts}
                />
            </div>
        </div>
    );
}
