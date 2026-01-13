'use client';

import MainLayout from '@/components/layout/MainLayout';
import AccountsView from '@/components/AccountsView';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';

export default function ContasPage() {
    const user = useStore(state => state.user);
    const isMaster = user?.role === 'master' || user?.role === 'admin';
    const [searchTerm, setSearchTerm] = useState('');

    if (!isMaster) {
        return (
            <MainLayout>
                <div className="p-8 text-center text-gray-500">
                    Acesso restrito a administradores.
                </div>
            </MainLayout>
        );
    }

    const actions = (
        <div className="flex items-center gap-3">
            <div className="relative z-50">
                <AnimatedSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar usuário..."
                    width="380px"
                />
            </div>
        </div>
    );

    return (
        <MainLayout
            actions={actions}
            breadcrumbs={[{ label: 'Contas e Permissões', href: '/contas', active: true }]}
        >
            <AccountsView searchTerm={searchTerm} />
        </MainLayout>
    );
}
