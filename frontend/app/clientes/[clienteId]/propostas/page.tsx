'use client';

import PropostasView from '@/components/PropostasView';
import AuthGuard from '@/components/AuthGuard';

export default function PropostasPage() {
    return (
        <AuthGuard>
            <PropostasView />
        </AuthGuard>
    );
}
