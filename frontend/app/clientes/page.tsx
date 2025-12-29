'use client';

import MainLayout from '@/components/layout/MainLayout';
import ClientesView from '@/components/ClientesView';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export default function ClientesPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const actions = (
        <div className="flex items-center gap-3">
            <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Buscar clientes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full h-9 pl-9 pr-4 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-primary/20 focus:border-emidias-primary transition-all"
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
