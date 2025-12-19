'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import TrashView from '@/components/TrashView';
import NavigationMenu from '@/components/NavigationMenu';
import { Menu, MapPin } from 'lucide-react';

export default function AdminTrashPage() {
    const router = useRouter();
    const user = useStore((state) => state.user);
    const setMenuOpen = useStore((state) => state.setMenuOpen);

    useEffect(() => {
        // Simple client-side auth check
        if (!user) {
            router.push('/login');
            return;
        }

        // Trash is strictly for internal agency users (master/editor)
        if (user.role === 'client') {
            router.push('/admin/proposals');
        }
    }, [user, router]);

    if (!user || user.role === 'client') return null;

    return (
        <div className="h-screen flex flex-col bg-emidias-gray-50">
            {/* Header */}
            <header className="gradient-primary px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 h-[70px] border-b-4 border-emidias-accent shadow-emidias-xl">
                {/* Logo OOH Data Hub - Left */}
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
                        <MapPin size={22} className="text-emidias-accent" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                            Admin Lixeira
                        </h1>
                        <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
                            Recuperação de Dados
                        </p>
                    </div>
                </div>

                {/* Logo E-MÍDIAS - Center */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                    <img
                        src="https://raw.githubusercontent.com/kaike74/distribuicaoemidias/main/logo%20E-MIDIAS%20png%20fundo%20escuro%20HORIZONTAL%20(1).png"
                        alt="E-MÍDIAS Logo"
                        className="h-10 lg:h-12 object-contain drop-shadow-lg"
                    />
                </div>

                {/* Actions - Right */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Menu Button */}
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                        title="Menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            <NavigationMenu />

            {/* Content Content - Reusing TrashView */}
            <div className="flex-1 overflow-hidden relative">
                <TrashView />
            </div>
        </div>
    );
}
