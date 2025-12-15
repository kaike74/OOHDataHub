'use client';

import PropostasView from '@/components/PropostasView';
import AuthGuard from '@/components/AuthGuard';

export function generateStaticParams() {
    return [];
}

export default function PropostasPage() {
    return (
        <AuthGuard>
            <PropostasView />
        </AuthGuard>
    );
}
