'use client';

import { useStore } from '@/lib/store';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ClientesView from '@/components/ClientesView';

export default function ClientsPage() {
    const user = useStore((state) => state.user);
    const router = useRouter();
    const setCurrentView = useStore((state) => state.setCurrentView);

    useEffect(() => {
        // Redirect if not logged in (handled by middleware usually, but good to have)
        if (!user) {
            router.push('/login');
        } else {
            setCurrentView('clientes');
        }
    }, [user, router, setCurrentView]);

    if (!user) return null;

    return (
        <div className="h-full w-full">
            <ClientesView />
        </div>
    );
}
