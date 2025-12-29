'use client';

import { ReactNode, useState } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { BreadcrumbItem } from './Breadcrumbs';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
    children: ReactNode;
    user?: any; // Pass user explicitly or use store in TopBar
    actions?: ReactNode;
    counts?: Partial<Record<string, number>>; // For badges
    breadcrumbs?: BreadcrumbItem[]; // Override breadcrumbs
    fullScreen?: boolean;
}

export default function MainLayout({ children, user, actions, counts, breadcrumbs: propBreadcrumbs, fullScreen = false }: MainLayoutProps) {
    const setMenuOpen = useStore((state) => state.setMenuOpen);

    // Default breadcrumbs could be inferred from pathname later if needed
    // For now we rely on propBreadcrumbs being passed by pages

    return (
        <div className="min-h-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Fixed Top Navigation */}
            <TopBar
                breadcrumbs={propBreadcrumbs}
                user={user}
                actions={actions}
                counts={counts}
            />

            {/* Main Scrollable Content Area */}
            <main className={cn(
                "flex-1 relative overflow-hidden flex flex-col",
                fullScreen ? "pb-0" : "pb-[60px] md:pb-0"
            )}>
                {/* This container allows children to scroll properly if they are configured to do so */}
                {/* or children can take full height */}
                {children}
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <BottomNav
                onMenuClick={() => setMenuOpen(true)}
            />
        </div>
    );
}
