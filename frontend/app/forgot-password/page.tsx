'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess(false);
        setIsLoading(true);

        try {
            await api.forgotPassword(email);
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || 'Erro ao solicitar redefinição de senha');
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
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">Esqueceu sua senha?</h1>
                        <p className="text-gray-600">Digite seu email para receber um link de redefinição</p>
                    </div>

                    {success ? (
                        <div className="space-y-6">
                            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-lg">
                                <p className="font-medium mb-2">Email enviado!</p>
                                <p className="text-sm">
                                    Se o email existir em nosso sistema, você receberá um link para redefinir sua senha.
                                    Verifique sua caixa de entrada.
                                </p>
                            </div>
                            <Link
                                href="/login"
                                className="block w-full text-center bg-gradient-to-r from-pink-500 to-blue-600 hover:from-pink-600 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                                Voltar ao Login
                            </Link>
                        </div>
                    ) : (
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
                                {isLoading ? 'Enviando...' : 'Enviar Link de Redefinição'}
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
