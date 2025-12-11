'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const setAuth = useStore((state) => state.setAuth);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.login(email, password);
            setAuth(response.user, response.token);
            router.push('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Side - Logo */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-50 to-blue-50 items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative circles */}
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

            {/* Right Side - Login Form */}
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

                    {/* Welcome Text */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Bem-vindo</h1>
                        <p className="text-gray-600">Faça login para acessar o sistema</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seuemail@hubradios.com"
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent transition"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
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
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                        >
                            {isLoading ? 'Entrando...' : 'Entrar'}
                        </button>

                        <div className="text-center">
                            <Link
                                href="/forgot-password"
                                className="text-sm text-pink-600 hover:text-pink-700 font-medium transition"
                            >
                                Esqueceu sua senha?
                            </Link>
                        </div>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        Apenas usuários autorizados com email @hubradios.com
                    </p>
                </div>
            </div>
        </div>
    );
}
