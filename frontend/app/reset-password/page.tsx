'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

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
        <div className="min-h-screen bg-white flex">
            {/* Left Side - Logo */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-50 to-blue-50 items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute top-20 left-20 w-64 h-64 bg-pink-200 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>

                <div className="relative z-10">
                    <Image
                        src="/assets/logo.png"
                        alt="E-MÍDIAS Logo"
                        width={400}
                        height={400}
                        className="drop-shadow-2xl"
                        priority
                    />
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Image
                            src="/assets/logo.png"
                            alt="E-MÍDIAS Logo"
                            width={120}
                            height={120}
                            className="mx-auto"
                            priority
                        />
                    </div>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Redefinir Senha</h1>
                        <p className="text-gray-600">Digite sua nova senha</p>
                    </div>

                    {success ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg">
                                <p className="font-medium mb-2">Senha redefinida com sucesso!</p>
                                <p className="text-sm">
                                    Você será redirecionado para a página de login em alguns segundos...
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="block w-full text-center bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Ir para Login
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Nova Senha
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirmar Nova Senha
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading || !token}
                                className="w-full bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? 'Redefinindo...' : 'Redefinir Senha'}
                            </button>

                            <div className="text-center">
                                <Link
                                    href="/login"
                                    className="text-sm text-pink-600 hover:text-pink-700 font-medium transition"
                                >
                                    Voltar ao login
                                </Link>
                            </div>
                        </form>
                    )}

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Apenas usuários autorizados com email @hubradios.com
                    </p>
                </div>
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
