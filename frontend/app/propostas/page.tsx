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
            const tokenParam = searchParams.get('token');
            const idParam = searchParams.get('id');

            // 1. If TOKEN is present, we assume Public Access intent.
            // We do NOT force login. The ProposalDetailClient will handle fetching via Public API.
            if (tokenParam) {
                // Happy path for public access
                setIsChecking(false);
                return;
            }

            // 2. If ID is present (Internal Access intent)
            if (idParam) {
                if (isAuthenticated) {
                    // Logged in + ID = Allowed
                    setIsChecking(false);
                    return;
                } else {
                    // Not logged in + ID = Force Login
                    // We preserve the ID in the redirect so they come back to ?id=...
                    const currentPath = `/propostas?id=${idParam}`;
                    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
                    return;
                }
            }

            // 3. No ID, No Token -> List View or Login
            if (!isAuthenticated) {
                // No params, not logged in -> Login
                router.push('/login');
            } else {
                // Logged in, no params -> List View (handled by return null below + component render)
                setIsChecking(false);
            }
        };

        checkRouting();
    }, [isAuthenticated, searchParams, router]);

    const tokenParam = searchParams.get('token');
    const idParam = searchParams.get('id');

    // Show loading while checking auth logic (unless we have a token, which bypasses immediately)
    if (isChecking && !tokenParam) {
        return <LoadingSpinner />;
    }

    // Render Detail if we have either Token or ID
    // (If ID + Unauth, we redirected above, so if we are here we are safe)
    if (tokenParam || idParam) {
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
