'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const isAuthenticated = useStore((state) => state.isAuthenticated);

    useEffect(() => {
        // Skip check for portal routes (they handle their own auth or are public)
        if (pathname?.startsWith('/portal')) return;

        // Se não está autenticado e não está na página de login, redireciona
        if (!isAuthenticated && pathname !== '/login') {
            router.push('/login');
        }

        // Se está autenticado e está na página de login, redireciona para home
        if (isAuthenticated && pathname === '/login') {
            router.push('/');
        }
    }, [isAuthenticated, pathname, router]);

    // Se não está autenticado e não está na página de login (e nao é portal), não renderiza nada
    if (!isAuthenticated && pathname !== '/login' && !pathname?.startsWith('/portal')) {
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
