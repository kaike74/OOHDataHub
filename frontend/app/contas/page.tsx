'use client';

import MainLayout from '@/components/layout/MainLayout';
import AccountsView from '@/components/AccountsView';
import { useStore } from '@/lib/store';

export default function ContasPage() {
    const user = useStore(state => state.user);
    const isMaster = user?.role === 'master' || user?.role === 'admin';

    if (!isMaster) {
        return (
            <MainLayout>
                <div className="p-8 text-center text-gray-500">
                    Acesso restrito a administradores.
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <AccountsView />
        </MainLayout>
    );
}
