'use client';

import {
    Search, Bell, Settings, User, LogOut, Menu,
    MapPin, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MainTabs, { ViewType } from './MainTabs';
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs';
import GlobalSearch from '@/components/GlobalSearch';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { ReactNode, useState, useEffect } from 'react';

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

    const [isSearchOpen, setIsSearchOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 flex flex-col shadow-sm transition-all duration-200">
            {/* Main Header Strip */}
            <div className="flex items-center justify-between px-4 sm:px-6 h-[70px]">
                {/* Left: Logo & Breadcrumbs */}
                <div className="flex items-center gap-6 overflow-hidden">
                    <a
                        href="https://emidiastec.com.br"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
                    >
                        <img
                            src="https://emidiastec.com.br/wp-content/smush-avif/2025/03/logo-E-MIDIAS-png-fundo-escuro-HORIZONTAL.png.avif"
                            alt="E-MÍDIAS"
                            className="h-10 w-auto object-contain"
                        />
                    </a>

                    <div className="h-6 w-px bg-gray-200 hidden sm:block mx-2" />

                    <div className="hidden sm:block overflow-hidden">
                        <Breadcrumbs items={breadcrumbs} />
                    </div>
                </div>

                {/* Right Area: Global Search + Actions + Profile */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Global Search Trigger (Icon Block) */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="p-2 text-gray-400 hover:text-emidias-primary hover:bg-gray-100 rounded-lg transition-all group relative"
                        title="Buscar (⌘K)"
                    >
                        <Search size={20} />
                        {/* Keyboard shortcut hint tooltip could go here */}
                    </button>
                    <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

                    {/* Context Actions */}
                    {actions && (
                        <div className="flex items-center gap-2">
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
