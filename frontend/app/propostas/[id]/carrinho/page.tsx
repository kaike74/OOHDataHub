'use client';

import CarrinhoView from '@/components/CarrinhoView';
import AuthGuard from '@/components/AuthGuard';

export default function CarrinhoPage() {
    return (
        <AuthGuard>
            <CarrinhoView />
        </AuthGuard>
    );
}
