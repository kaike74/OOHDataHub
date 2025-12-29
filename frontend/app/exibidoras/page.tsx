'use client';

import MainLayout from '@/components/layout/MainLayout';
import ExibidorasView from '@/components/ExibidorasView';
import { useStore } from '@/lib/store';

export default function ExibidorasPage() {
    const user = useStore(state => state.user);

    if (user?.type === 'external') {
        return (
            <MainLayout>
                <div className="p-8 text-center text-gray-500">
                    Acesso restrito.
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <ExibidorasView />
        </MainLayout>
    );
}
