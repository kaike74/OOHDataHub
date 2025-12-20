'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AnimatedBackground from '@/components/AnimatedBackground';

function ResetPasswordForm() {
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const tokenParam = searchParams.get('token');
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setError('Token de redefinição não encontrado');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword !== confirmPassword) {
            setError('As senhas não coincidem');
            return;
        }

        if (newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsLoading(true);

        try {
            await api.resetPassword(token, newPassword);
            setSuccess(true);
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir senha');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <AnimatedBackground />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
                {/* Left Side - Logo */}
                <div className="flex-1 flex items-center justify-center lg:justify-start lg:pl-8">
                    <div className="relative group cursor-pointer" onClick={() => router.push('/login')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        <div className="relative transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                            <Image
                                src="/assets/logo.png"
                                alt="E-MÍDIAS Logo"
                                width={280}
                                height={280}
                                className="relative z-10 lg:w-[340px] lg:h-[340px]"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="w-full max-w-md lg:pl-12">
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-emidias-xl border border-emidias-gray-100 group/card relative transition-all duration-500 hover:shadow-2xl">
                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl scale-110 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* Header */}
                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                Redefinir Senha
                            </h2>
                            <p className="text-gray-500">
                                Digite sua nova senha abaixo
                            </p>
                        </div>

                        {success ? (
                            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-8 rounded-xl text-center">
                                    <CheckCircle2 size={48} className="mx-auto mb-4 text-green-600" />
                                    <p className="font-bold text-lg mb-2">Sucesso!</p>
                                    <p className="text-sm">
                                        Sua senha foi redefinida. Redirecionando para login...
                                    </p>
                                </div>
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full"
                                    variant="primary"
                                    rightIcon={<ArrowRight size={20} />}
                                >
                                    Ir para Login agora
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <Input
                                    label="Nova Senha"
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    icon={<Lock size={20} />}
                                />

                                <Input
                                    label="Confirmar Nova Senha"
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    icon={<Lock size={20} />}
                                />

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                        <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    disabled={!token}
                                    className="w-full py-6 text-base"
                                    variant="accent"
                                    rightIcon={<ArrowRight size={20} />}
                                >
                                    Redefinir Senha
                                </Button>

                                <div className="text-center pt-2">
                                    <Link
                                        href="/login"
                                        className="text-sm text-gray-500 hover:text-emidias-primary font-medium transition-colors hover:underline underline-offset-4 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={16} />
                                        Voltar ao login
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-center text-xs text-gray-400">
                                @hubradios.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <p className="text-xs text-gray-400 tracking-wider">
                    E-MÍDIAS &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Carregando...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
