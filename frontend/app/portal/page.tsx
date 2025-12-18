'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PortalIndexPage() {
    const router = useRouter();

    useEffect(() => {
        const auth = localStorage.getItem('ooh-client-auth-storage');
        if (auth) {
            router.replace('/portal/dashboard');
        } else {
            router.replace('/portal/login');
        }
    }, [router]);

    return null; // Render nothing while redirecting
}
