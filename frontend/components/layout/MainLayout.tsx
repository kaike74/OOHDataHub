'use client';

import { ReactNode, useState } from 'react';
import TopBar from './TopBar';
import BottomNav from './BottomNav';
import { ViewType } from './MainTabs';
import { useStore } from '@/lib/store';
import { BreadcrumbItem } from './Breadcrumbs';

interface MainLayoutProps {
    children: ReactNode;
    user?: any; // Pass user explicitly or use store in TopBar
    actions?: ReactNode;
    counts?: Partial<Record<ViewType, number>>; // For badges
    breadcrumbs?: BreadcrumbItem[]; // Override breadcrumbs
}

export default function MainLayout({ children, user, actions, counts, breadcrumbs: propBreadcrumbs }: MainLayoutProps) {
    const currentView = useStore((state) => state.currentView);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const setMenuOpen = useStore((state) => state.setMenuOpen);

    // Derive breadcrumbs from currentView
    // TODO: Make this dynamic based on deep structure (e.g. Proposal -> ID)
    // For now, simple mapping
    const viewLabels: Record<string, string> = {
        'map': 'Mapa',
        'propostas': 'Propostas',
        'clientes': 'Clientes',
        'exibidoras': 'Exibidoras',
        'contas': 'Contas',
        'lixeira': 'Lixeira'
    };

    const breadcrumbs: BreadcrumbItem[] = [
        { label: 'OOH Hub', href: '/' },
        { label: viewLabels[currentView] || 'Dashboard', active: true }
    ];

    return (
        <div className="min-h-screen h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* Fixed Top Navigation */}
            <TopBar
                currentView={currentView}
                onChangeView={(view) => setCurrentView(view)}
                breadcrumbs={propBreadcrumbs || breadcrumbs}
                user={user}
                actions={actions}
                counts={counts}
            />

            {/* Main Scrollable Content Area */}
            <main className="flex-1 relative overflow-hidden flex flex-col pb-[60px] md:pb-0">
                {/* This container allows children to scroll properly if they are configured to do so */}
                {/* or children can take full height */}
                {children}
            </main>

            {/* Bottom Navigation (Mobile Only) */}
            <BottomNav
                currentView={currentView}
                onChangeView={(view) => setCurrentView(view)}
                onMenuClick={() => setMenuOpen(true)}
            />
        </div>
    );
}
