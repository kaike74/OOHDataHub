'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import MainLayout from '@/components/layout/MainLayout';
import PropostasView from '@/components/PropostasView';
import { Button } from '@/components/ui/Button';
import { Plus, Search } from 'lucide-react';

export default function PropostasPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isAuthenticated = useStore(state => state.isAuthenticated);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // If not logged in, check for invite params
        if (!isAuthenticated) {
            const emailParam = searchParams.get('email');
            if (emailParam) {
                router.push(`/login?email=${encodeURIComponent(emailParam)}`);
            } else {
                router.push('/login');
            }
        }
    }, [isAuthenticated, searchParams, router]);

    const actions = (
        <div className="flex items-center gap-3">
            <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                    type="text"
                    placeholder="Buscar propostas..."
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
                Nova Proposta
            </Button>
        </div>
    );

    return (
        <MainLayout
            actions={actions}
            breadcrumbs={[{ label: 'Propostas', href: '/propostas', active: true }]}
        >
            <PropostasView
                isModalOpen={isModalOpen}
                onCloseModal={() => setIsModalOpen(false)}
                searchTerm={searchTerm}
            />
        </MainLayout>
    );
}
