'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import MainLayout from '@/components/layout/MainLayout';
import PropostasView from '@/components/PropostasView';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { AnimatedSearchBar } from '@/components/ui/AnimatedSearchBar';
import ProposalDetailClient from '@/components/proposals/ProposalDetailClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function PropostasPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated, user } = useStore();
    const [isChecking, setIsChecking] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const checkRouting = async () => {
            const proposalId = searchParams.get('id');

            // If user is authenticated, redirect to their scoped URL
            // internal: /propostas/{userId}?id={proposalId}
            if (isAuthenticated && user?.id) {
                // If there is a proposal ID, preserve it
                if (proposalId) {
                    router.push(`/propostas/${user.id}?id=${proposalId}`);
                } else {
                    // If no proposal ID, probably just browsing list?
                    // But requirement says "Interno: ... aparecem na aba propostas" (List).
                    // If I am at /propostas (no ID), I should see the list.
                    // Does the list view need to be scoped? "/propostas/[userId]"?
                    // User said: "https://oohdatahub.pages.dev/propostas/{idusuario}?id=codigo" for accessing a proposal.
                    // It implies LIST might handle itself on /propostas or /propostas/{userId}.
                    // For now, if no ID, let's keep showing the list here OR redirect to scoped list?
                    // Let's stay here for list view as it's cleaner, UNLESS the new route is required for list too.
                    // The request focused on "ao acessar uma proposta".
                    // So if NO ID, we stay here and render list.

                    // BUT, if I have an ID and I am logged in, I redirect.
                    router.push(`/propostas/${user.id}?id=${proposalId}`);
                    return;
                }
            } else {
                // Not authenticated
                if (proposalId) {
                    // Public view attempt
                    // We stay here and render ProposalDetailClient (which handles public logic)
                } else {
                    // No ID, not logged in -> Login
                    const emailParam = searchParams.get('email');
                    if (emailParam) {
                        router.push(`/login?email=${encodeURIComponent(emailParam)}`);
                    } else {
                        router.push('/login');
                    }
                }
            }
            setIsChecking(false);
        };

        checkRouting();
    }, [isAuthenticated, user, searchParams, router]);

    const proposalId = searchParams.get('id');

    if (isChecking && proposalId && isAuthenticated) {
        return <LoadingSpinner />;
    }

    // If we have an ID (and are not redirected yet, i.e. not auth or public view), render Detail
    // If we are auth, we redirected above. So if we are here and have ID, we must be Public (Unauth).
    if (proposalId) {
        return <ProposalDetailClient />;
    }

    // List View (Internal Only essentially, since unauth redirects to login)
    // If we are here, we are either Auth (and no ID) or Unauth (and checking->redirecting).
    if (!isAuthenticated) return null;

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
