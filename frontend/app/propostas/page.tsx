'use client';

import Dashboard from '@/components/Dashboard';
import { Suspense } from 'react';

function ProposalContent() {
    return <Dashboard />;
}

export default function ProposalPage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen bg-gray-50 flex items-center justify-center">Carregando...</div>}>
            <ProposalContent />
        </Suspense>
    );
}
