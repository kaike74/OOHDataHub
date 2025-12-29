'use client';

import MainLayout from '@/components/layout/MainLayout';
import ExibidorasView from '@/components/ExibidorasView';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function ExibidorasPage() {
    const user = useStore(state => state.user);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (user?.type === 'external') {
        return (
            <MainLayout>
                <div className="p-8 text-center text-gray-500">
                    Acesso restrito.
                </div>
            </MainLayout>
        );
    }

    const actions = (
        <Button
            onClick={() => setIsModalOpen(true)}
            variant="accent"
            size="sm"
            leftIcon={<Plus size={16} />}
        >
            Nova Exibidora
        </Button>
    );

    return (
        <MainLayout
            actions={actions}
            breadcrumbs={[{ label: 'Exibidoras', href: '/exibidoras', active: true }]}
        >
            <ExibidorasView
                isModalOpen={isModalOpen}
                onCloseModal={() => setIsModalOpen(false)}
            />
        </MainLayout>
    );
}
