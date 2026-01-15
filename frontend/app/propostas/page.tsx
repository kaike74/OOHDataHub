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
            const idParam = searchParams.get('id');
            const uidParam = searchParams.get('uid');

            // If user is authenticated, we want to ensure the URL has the correct context (uid)
            // Desired format: /propostas?uid={myId}&id={token|id}
            if (isAuthenticated && user?.id) {
                // If the URL logic already matches, do nothing to avoid loop
                if (uidParam === String(user.id) && idParam) {
                    setIsChecking(false);
                    return;
                }

                // If we have an ID but wrong/missing UID, redirect to include UID
                if (idParam) {
                    // We keep the ID param as is (whether it's numeric ID or token)
                    // Ideally we convert numeric ID to token if available, but we might not have it here yet.
                    // For now, simply enforcing the UID presence.
                    router.replace(`/propostas?uid=${user.id}&id=${idParam}`);
                    return;
                }
            } else {
                // Not authenticated
                if (idParam) {
                    // Public view: Just render Detail. UID might be missing or present (creator's UID?), 
                    // but functionally we just need the ID/Token.
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
