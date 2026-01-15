'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import MainLayout from '@/components/layout/MainLayout';
import PropostasView from '@/components/PropostasView';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';
import { api } from '@/lib/api';

export default function PropostasPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isAuthenticated = useStore(state => state.isAuthenticated);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [checkingPublicAccess, setCheckingPublicAccess] = useState(false);

    useEffect(() => {
        const proposalId = searchParams.get('id');

        // If accessing a specific proposal, redirect to the detail view
        if (proposalId) {
            router.push(`/propostas/visualizar?id=${proposalId}`);
            return;
        }

        // If not logged in and no proposal ID, redirect to login
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
            <div className="relative z-50">
                <AnimatedSearchBar
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder="Buscar propostas..."
                    width="380px"
                />
            </div>
            <Button
                onClick={() => setIsModalOpen(true)}
                variant="accent"
                size="sm"
                leftIcon={<Plus size={16} />}
            >
                Novo Proposta
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
