'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import Image from 'next/image';

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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl flex bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden">
                {/* Logo Section */}
                <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-blue-600 to-purple-600 p-12 flex-col justify-center items-center">
                    <div className="text-center">
                        <div className="mb-8">
                            <div className="w-32 h-32 mx-auto bg-white rounded-full flex items-center justify-center shadow-xl">
                                <span className="text-4xl font-bold text-blue-600">OOH</span>
                            </div>
                        </div>
                        <h1 className="text-4xl font-bold text-white mb-4">
                            OOH Data Hub
                        </h1>
                        <p className="text-blue-100 text-lg">
                            Sistema de Gestão E-MÍDIAS
                        </p>
                        <div className="mt-8 space-y-3 text-left">
                            <div className="flex items-center text-white">
                                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Gestão de Pontos OOH
                            </div>
                            <div className="flex items-center text-white">
                                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Controle de Exibidoras
                            </div>
                            <div className="flex items-center text-white">
                                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Visualização de Mapas
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Form Section */}
                <div className="w-full md:w-1/2 p-12 flex flex-col justify-center">
                    <div className="mb-8 md:hidden text-center">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl mb-4">
                            <span className="text-2xl font-bold text-white">OOH</span>
                        </div>
                        <h1 className="text-2xl font-bold text-white">OOH Data Hub</h1>
                    </div>

                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">Bem-vindo</h2>
                        <p className="text-gray-300 mb-8">Faça login para acessar o sistema</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="seuemail@hubradios.com"
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                    Senha
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                />
                            </div>

                            {error && (
                                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                            >
                                {isLoading ? 'Entrando...' : 'Entrar'}
                            </button>
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-400">
                            Apenas usuários autorizados com email @hubradios.com
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
