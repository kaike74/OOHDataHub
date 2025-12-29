'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import MainLayout from '@/components/layout/MainLayout';
import PropostasView from '@/components/PropostasView';

export default function PropostasPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const user = useStore(state => state.user);
    const isAuthenticated = useStore(state => state.isAuthenticated);

    useEffect(() => {
        // If not logged in, check for invite params
        if (!isAuthenticated) {
            const emailParam = searchParams.get('email');
            if (emailParam) {
                router.push(`/login?email=${encodeURIComponent(emailParam)}`);
            } else {
                router.push('/login');
            }
        }
    }, [isAuthenticated, searchParams, router]);

    return (
        <MainLayout>
            <PropostasView />
        </MainLayout>
    );
}
