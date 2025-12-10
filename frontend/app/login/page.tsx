'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { Loader2, AlertCircle } from 'lucide-react';

declare global {
    interface Window {
        google: any;
    }
}

export default function LoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();
    const { login } = useAuth();

    const handleGoogleLogin = async (response: any) => {
        setLoading(true);
        setError('');

        try {
            await login(response.credential);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Falha no login. Verifique se seu email é @hubradios.com');
        } finally {
            setLoading(false);
        }
    };

    // Initialize Google Sign-In
    if (typeof window !== 'undefined' && window.google) {
        window.google.accounts.id.initialize({
            client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
            callback: handleGoogleLogin,
        });

        window.google.accounts.id.renderButton(
            document.getElementById('googleSignInButton'),
            {
                theme: 'filled_blue',
                size: 'large',
                text: 'signin_with',
                width: 300,
            }
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Logo */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emidias-primary to-emidias-secondary items-center justify-center p-12">
                <div className="text-center">
                    <div className="mb-8">
                        <Image
                            src="/logo.svg"
                            alt="OOH DataHub"
                            width={200}
                            height={80}
                            className="mx-auto"
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">OOH DataHub</h1>
                    <p className="text-white/80 text-lg">
                        Sistema de Gerenciamento de Pontos OOH
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Image
                            src="/logo.svg"
                            alt="OOH DataHub"
                            width={150}
                            height={60}
                            className="mx-auto mb-4"
                        />
                        <h1 className="text-2xl font-bold text-emidias-primary">OOH DataHub</h1>
                    </div>

                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold text-emidias-primary mb-2">Bem-vindo</h2>
                        <p className="text-gray-600 mb-8">Faça login para acessar o sistema</p>

                        {/* Email Field (disabled for now) */}
                        <div className="mb-4">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                type="email"
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                placeholder="seu-email@hubradios.com"
                            />
                        </div>

                        {/* Password Field (disabled for now) */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Senha
                            </label>
                            <input
                                type="password"
                                disabled
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Login Button (disabled) */}
                        <button
                            disabled
                            className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-semibold mb-6 cursor-not-allowed"
                        >
                            Login
                        </button>

                        {/* Divider */}
                        <div className="relative mb-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">ou</span>
                            </div>
                        </div>

                        {/* Google Sign-In Button */}
                        <div className="flex justify-center mb-4">
                            <div id="googleSignInButton"></div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Loading State */}
                        {loading && (
                            <div className="mt-4 flex items-center justify-center gap-2 text-emidias-primary">
                                <Loader2 className="animate-spin" size={20} />
                                <span className="text-sm">Autenticando...</span>
                            </div>
                        )}

                        {/* Info */}
                        <p className="mt-6 text-center text-sm text-gray-500">
                            Apenas emails <strong>@hubradios.com</strong> são permitidos
                        </p>
                    </div>
                </div>
            </div>

            {/* Load Google Sign-In Script */}
            <script src="https://accounts.google.com/gsi/client" async defer></script>
        </div>
    );
}
