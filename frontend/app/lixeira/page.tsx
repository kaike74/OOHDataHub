'use client';

import MainLayout from '@/components/layout/MainLayout';
import TrashView from '@/components/TrashView';
import { useStore } from '@/lib/store';

export default function LixeiraPage() {
    const user = useStore(state => state.user);
    const isMaster = ['master', 'admin'].includes(user?.role as string);

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
            <TrashView />
        </MainLayout>
    );
}
