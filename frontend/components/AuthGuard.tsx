'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const user = useStore((state) => state.user);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated) return;

        // 1. Routes independent of Main View Auth
        // Skip check for portal routes (they handle their own auth or are public)
        if (pathname?.startsWith('/portal')) return;

        // Public routes whitelist
        const publicRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password', '/propostas'];
        // Note: keeping /propostas public to allow invite logic in page.tsx to fail gracefully or redirect if needed.

        const isPublic = publicRoutes.some(route => pathname?.startsWith(route));

        // 2. Not Authenticated Logic
        if (!isAuthenticated) {
            if (!isPublic) {
                router.push('/login');
            }
            return;
        }

        // 3. Authenticated Logic
        // Redirect out of login page
        if (pathname === '/login') {
            router.push('/inicio');
            return;
        }

        // Redirect legacy admin routes
        if (pathname?.startsWith('/admin')) {
            router.push('/inicio');
            return;
        }

        // 4. Role-Based Access Control (RBAC)
        if (user) {
            const isInternal = user.type === 'internal';
            const isAdminOrMaster = user.role === 'admin' || user.role === 'master';

            // Internal-only routes
            const internalRoutes = ['/mapa', '/exibidoras'];
            if (!isInternal && internalRoutes.some(r => pathname?.startsWith(r))) {
                console.warn('Access denied: External user attempted to access internal route');
                router.push('/inicio');
                return;
            }

            // Admin/Master-only routes
            const adminRoutes = ['/contas', '/lixeira'];
            if (!isAdminOrMaster && adminRoutes.some(r => pathname?.startsWith(r))) {
                console.warn('Access denied: Insufficient permissions for admin route');
                router.push('/inicio');
                return;
            }
        }

    }, [isAuthenticated, user, pathname, router, isHydrated]);

    // Loading State
    const isPublicRoute = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password', '/portal', '/propostas'].some(r => pathname?.startsWith(r));

    if ((!isHydrated) || (!isAuthenticated && !isPublicRoute)) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Carregando...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
