'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';

// Load Google OAuth library
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
            console.error('Login error:', err);
            setError(err.message || 'Falha no login. Verifique se seu email é @hubradios.com');
        } finally {
            setLoading(false);
        }
    };

    // Initialize Google Sign-In
    useState(() => {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            if (window.google) {
                window.google.accounts.id.initialize({
                    client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
                    callback: handleGoogleLogin,
                });
                window.google.accounts.id.renderButton(
                    document.getElementById('googleSignInButton'),
                    {
                        theme: 'outline',
                        size: 'large',
                        width: 350,
                        text: 'signin_with',
                        locale: 'pt-BR'
                    }
                );
            }
        };
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    });

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Logo */}
            <div className="hidden lg:flex lg:w-1/2 gradient-primary items-center justify-center p-12">
                <div className="text-center">
                    <div className="mb-8">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={200}
                            height={200}
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
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-8">
                        <Image
                            src="/logo.png"
                            alt="Logo"
                            width={120}
                            height={120}
                            className="mx-auto mb-4"
                        />
                        <h1 className="text-2xl font-bold text-emidias-primary">OOH DataHub</h1>
                    </div>

                    <div className="bg-white rounded-xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-emidias-primary mb-6 text-center">
                            Bem-vindo
                        </h2>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Email/Password Fields (Future) */}
                        <div className="space-y-4 mb-6 opacity-50 pointer-events-none">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                                    placeholder="seu@hubradios.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Senha
                                </label>
                                <input
                                    type="password"
                                    disabled
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100"
                                    placeholder="••••••••"
                                />
                            </div>
                            <button
                                disabled
                                className="w-full py-3 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed"
                            >
                                Login
                            </button>
                        </div>

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
                        <div className="flex justify-center">
                            {loading ? (
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Loader2 className="animate-spin" size={20} />
                                    <span>Autenticando...</span>
                                </div>
                            ) : (
                                <div id="googleSignInButton"></div>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 text-center mt-6">
                            Apenas emails @hubradios.com são permitidos
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
