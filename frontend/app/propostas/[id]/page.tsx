'use client';

import Dashboard from '@/components/Dashboard';

export default function ProposalPage({ params }: { params: { id: string } }) {
    return <Dashboard initialProposalId={params.id} />;
}
