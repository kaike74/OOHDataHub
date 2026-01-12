'use client';

import {
    Search, Bell, Settings, User, LogOut, Menu,
    MapPin, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import MainTabs from './MainTabs';
import UserMenu from '@/components/UserMenu';
import Breadcrumbs, { BreadcrumbItem } from './Breadcrumbs';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';
import { ReactNode, useState, useEffect } from 'react';

interface TopBarProps {
    breadcrumbs?: BreadcrumbItem[];
    user?: any;
    actions?: ReactNode;
    counts?: Partial<Record<string, number>>;
}

export default function TopBar({ breadcrumbs, user, actions, counts }: TopBarProps) {
    const { setMenuOpen } = useStore(); // Legacy menu for mobile or backup

    return (
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 flex flex-col shadow-sm transition-all duration-200">
            {/* Main Header Strip */}
            <div className="flex items-center justify-between px-4 sm:px-6 h-[70px]">
                {/* Left: Logo & Navigation */}
                <div className="flex items-center gap-6 h-full">
                    {/* Logo Area */}
                    <Link
                        href="/"
                        className="flex items-center flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80"
                    >
                        <img
                            src="/assets/logoHorizontalAzul.png"
                            alt="E-Mídias"
                            className="h-10 w-auto object-contain transition-transform hover:scale-105"
                        />
                    </Link>

                    {/* Main Navigation Tabs */}
                    <div className="hidden md:flex h-full items-center">
                        <MainTabs counts={counts} className="h-10" />
                    </div>

                    {/* Divider & Discrete Location Indicator */}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <>
                            <div className="h-6 w-px bg-gray-200 hidden md:block" />
                            <div className="hidden md:flex items-center gap-2 text-sm animate-in fade-in slide-in-from-left-2">
                                {breadcrumbs.map((item, index) => (
                                    <div key={item.label} className="flex items-center gap-2">
                                        {index > 0 && <span className="text-gray-300">/</span>}
                                        <span className={cn(
                                            index === breadcrumbs.length - 1
                                                ? "font-medium text-gray-900"
                                                : "text-gray-500"
                                        )}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Right Area: Profile & Actions */}
                <div className="flex items-center gap-2 sm:gap-4">
                    {/* Page specific actions could theoretically go here if passed via props, 
                        currently they are often redundant or page-specific logic is internal. 
                        If 'actions' are passed, we show them. */}
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

                    {/* User Profile Menu */}
                    <UserMenu />
                </div>
            </div>
        </div>
    );
}
