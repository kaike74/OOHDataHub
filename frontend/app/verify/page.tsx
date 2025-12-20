'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function VerifyEmailPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const setAuth = useStore((state) => state.setAuth);

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token inválido ou ausente.');
            return;
        }

        const verify = async () => {
            try {
                const res = await api.verifyEmail(token);
                if (res.success && res.token) {
                    // Auto login
                    setAuth(res.user, res.token);
                    setStatus('success');
                    setMessage('Email verificado com sucesso!');

                    // Redirect after delay
                    setTimeout(() => {
                        router.push('/portal/dashboard');
                    }, 2000);
                } else {
                    setStatus('error');
                    setMessage(res.error || 'Falha na verificação');
                }
            } catch (error: any) {
                setStatus('error');
                setMessage(error.message || 'Erro ao conectar com o servidor');
            }
        };

        verify();
    }, [token, setAuth, router]);

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-emidias-xl border border-emidias-gray-100 text-center animate-fade-in-scale">

                <div className="mb-6 flex justify-center">
                    <Image src="/assets/logo.png" alt="Logo" width={180} height={180} className="w-48" />
                </div>

                {status === 'loading' && (
                    <div className="py-8">
                        <Loader2 className="w-12 h-12 text-emidias-primary animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-900">Verificando...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="py-2">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
                            <CheckCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verificado!</h2>
                        <p className="text-gray-500 mb-6">
                            Sua conta foi ativada. Você será redirecionado para o portal...
                        </p>
                        <Button onClick={() => router.push('/portal/dashboard')} className="w-full">
                            Ir para o Portal agora
                        </Button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="py-2">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                            <XCircle size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Erro na Verificação</h2>
                        <p className="text-red-500 mb-6 font-medium">
                            {message}
                        </p>
                        <Button onClick={() => router.push('/login')} variant="outline" className="w-full">
                            Voltar para Login
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
