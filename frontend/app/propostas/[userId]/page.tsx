'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import ProposalDetailClient from '@/components/proposals/ProposalDetailClient';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function UserProposalPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user, isAuthenticated } = useStore();

    // We expect userId to be in the URL path
    const userIdRouteParam = params?.userId as string;
    const proposalId = searchParams.get('id');

    useEffect(() => {
        if (!isAuthenticated) {
            // Let the middleware or ProposalDetailClient handle auth redirect if needed, 
            // but strictly speaking this route is for internal/logged-in users.
            // However, ProposalDetailClient handles "public" logic too, but we want this route strictly for internal.
            router.push(`/login?redirect=/propostas/${userIdRouteParam}?id=${proposalId}`);
        }
    }, [isAuthenticated, router, userIdRouteParam, proposalId]);

    // Optional: add check if user.id == userIdRouteParam 
    // For now we trust ProposalDetailClient to handle fetching and permissions, 
    // but the URL structure is valid.

    if (!proposalId) {
        // If no ID, maybe redirect to list?
        if (typeof window !== 'undefined') router.push('/propostas');
        return <LoadingSpinner />;
    }

    return <ProposalDetailClient />;
}
