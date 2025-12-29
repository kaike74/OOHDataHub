import ProposalDetailClient from '@/components/proposals/ProposalDetailClient';
import { Suspense } from 'react';

// This page is a static shell that loads ProposalDetailClient which uses searchParams.
// It MUST be wrapped in Suspense for static export to work with searchParams.
export default function ProposalViewPage() {
    return (
        <Suspense fallback={<div className="h-screen w-full flex items-center justify-center">Carregando...</div>}>
            <ProposalDetailClient />
        </Suspense>
    );
}
