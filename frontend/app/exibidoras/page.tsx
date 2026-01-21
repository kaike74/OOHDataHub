'use client';

import MainLayout from '@/components/layout/MainLayout';
import ExibidorasView from '@/components/ExibidorasView';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';
import { ActionButton } from '@/components/ui/PageComponents';


export default function ExibidorasPage() {
    const user = useStore(state => state.user);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

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
        <div className="flex items-center gap-3">
            <div className="relative z-50">
                <AnimatedSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar exibidoras..."
                    width="380px"
                />
            </div>
            <ActionButton
                onClick={() => setIsModalOpen(true)}
                label="Nova Exibidora"
            />
        </div>
    );


    return (
        <MainLayout
            actions={actions}
            breadcrumbs={[{ label: 'Exibidoras', href: '/exibidoras', active: true }]}
        >
            <ExibidorasView
                isModalOpen={isModalOpen}
                onCloseModal={() => setIsModalOpen(false)}
                searchTerm={searchTerm}
            />

        </MainLayout>
    );
}
