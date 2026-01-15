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
        // If not logged in, check if accessing a specific proposal
        if (!isAuthenticated) {
            const proposalId = searchParams.get('id');

            if (proposalId) {
                // Check if this proposal has public access
                setCheckingPublicAccess(true);

                // Try to fetch proposal to check if it's public
                // If it's public, PropostasView will handle showing it
                // If it's not public or doesn't exist, we'll redirect to login
                // This check happens in PropostasView component

                // For now, let PropostasView handle the logic
                // It will show public view if accessible, or show "access denied" message
                setCheckingPublicAccess(false);
            } else {
                // No specific proposal ID, redirect to login
                const emailParam = searchParams.get('email');
                if (emailParam) {
                    router.push(`/login?email=${encodeURIComponent(emailParam)}`);
                } else {
                    router.push('/login');
                }
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
