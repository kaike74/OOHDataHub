'use client';

import MainLayout from '@/components/layout/MainLayout';
import ClientesView from '@/components/ClientesView';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';


export default function ClientesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const actions = (
        <div className="flex items-center gap-3">
            <div className="relative z-50">
                <AnimatedSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar clientes..."
                    width="380px"
                />
            </div>
            <Button
                onClick={() => setIsModalOpen(true)}
                variant="accent"
                size="sm"
                leftIcon={<Plus size={16} />}
            >
                Novo Cliente
            </Button>
        </div>
    );


    return (
        <MainLayout
            actions={actions}
            breadcrumbs={[{ label: 'Clientes', href: '/clientes', active: true }]}
        >
            <ClientesView
                isModalOpen={isModalOpen}
                onCloseModal={() => setIsModalOpen(false)}
                searchTerm={searchTerm}
            />
        </MainLayout>
    );
}
