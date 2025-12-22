'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    useEffect(() => {
        if (!isHydrated) return;
        // Skip check for portal routes (they handle their own auth or are public)
        if (pathname?.startsWith('/portal')) return;

        // Public routes whitelist
        const publicRoutes = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password'];
        if (publicRoutes.some(route => pathname?.startsWith(route)) || pathname?.startsWith('/propostas/')) return;

        // Se não está autenticado e não está na página de login, redireciona
        if (!isAuthenticated) {
            router.push('/login');
        }

        // Se está autenticado e está na página de login, redireciona
        if (isAuthenticated && pathname === '/login') {
            const user = useStore.getState().user;
            if (user?.role === 'client') {
                router.push('/admin/proposals');
            } else {
                router.push('/');
            }
        }
    }, [isAuthenticated, pathname, router]);

    // Se não está autenticado e não está em rota publica, ou ainda não hidratou
    const isPublicRoute = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password', '/portal'].some(r => pathname?.startsWith(r)) || pathname?.startsWith('/propostas/');

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
