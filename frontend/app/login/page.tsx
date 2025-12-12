'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();
    const setAuth = useStore((state) => state.setAuth);

    useEffect(() => {
        setMounted(true);
    }, []);

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
        <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Animated Signal Cables Background - Invisible lines with neon pulses */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Signal Cable Lines - Invisible with pink pulses */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        {/* Gradient for signal pulse - right to left */}
                        <linearGradient id="signalGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 0)" />
                            <stop offset="30%" stopColor="rgba(252, 30, 117, 0.7)" />
                            <stop offset="70%" stopColor="rgba(252, 30, 117, 0.7)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Cable 1 - Top horizontal */}
                    <path
                        d="M 1400,150 L 600,150"
                        stroke="transparent"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M 1400,150 L 600,150"
                        stroke="url(#signalGradient)"
                        strokeWidth="3"
                        fill="none"
                        className="signal-pulse-rtl"
                        style={{ animationDelay: '0s' }}
                        strokeLinecap="square"
                    />

                    {/* Cable 2 - Upper middle horizontal */}
                    <path
                        d="M 1400,280 L 600,280"
                        stroke="transparent"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M 1400,280 L 600,280"
                        stroke="url(#signalGradient)"
                        strokeWidth="3"
                        fill="none"
                        className="signal-pulse-rtl"
                        style={{ animationDelay: '1.5s' }}
                        strokeLinecap="square"
                    />

                    {/* Cable 3 - Center horizontal */}
                    <path
                        d="M 1400,400 L 600,400"
                        stroke="transparent"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M 1400,400 L 600,400"
                        stroke="url(#signalGradient)"
                        strokeWidth="3"
                        fill="none"
                        className="signal-pulse-rtl"
                        style={{ animationDelay: '3s' }}
                        strokeLinecap="square"
                    />

                    {/* Cable 4 - Lower middle horizontal */}
                    <path
                        d="M 1400,520 L 600,520"
                        stroke="transparent"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M 1400,520 L 600,520"
                        stroke="url(#signalGradient)"
                        strokeWidth="3"
                        fill="none"
                        className="signal-pulse-rtl"
                        style={{ animationDelay: '4.5s' }}
                        strokeLinecap="square"
                    />

                    {/* Cable 5 - Bottom horizontal */}
                    <path
                        d="M 1400,650 L 600,650"
                        stroke="transparent"
                        strokeWidth="2"
                        fill="none"
                    />
                    <path
                        d="M 1400,650 L 600,650"
                        stroke="url(#signalGradient)"
                        strokeWidth="3"
                        fill="none"
                        className="signal-pulse-rtl"
                        style={{ animationDelay: '6s' }}
                        strokeLinecap="square"
                    />
                </svg>

                {/* Very subtle gradient orbs for depth */}
                <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-gradient-to-br from-emidias-accent/2 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-[20%] right-[15%] w-80 h-80 bg-gradient-to-br from-emidias-primary/2 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Main Content - Centered Layout */}
            <div className={`relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Centered Logo with Very Subtle Hover Effect */}
                <div className="flex items-center justify-center lg:flex-1">
                    <div className="relative group cursor-pointer">
                        {/* Very subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emidias-accent/5 to-emidias-primary/5 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Static logo with very subtle hover effect */}
                        <div className="relative transition-all duration-500 ease-out group-hover:scale-[1.02]">
                            <Image
                                src="/assets/logo.png"
                                alt="E-MÍDIAS Logo"
                                width={240}
                                height={240}
                                className="relative z-10 lg:w-[280px] lg:h-[280px]"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="w-full max-w-md lg:flex-1">
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-emidias-gray-100 animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
                        {/* Welcome Text */}
                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-emidias-gray-900 mb-2">
                                Bem-vindo de volta
                            </h2>
                            <p className="text-emidias-gray-500">
                                Faça login para acessar o sistema
                            </p>
                        </div>

                        {/* Login Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email Field */}
                            <div className="space-y-2">
                                <label htmlFor="email" className="block text-sm font-medium text-emidias-gray-700">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emidias-gray-400">
                                        <Mail size={20} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seuemail@hubradios.com"
                                        required
                                        className="input-base pl-12 pr-4"
                                    />
                                </div>
                            </div>

                            {/* Password Field */}
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium text-emidias-gray-700">
                                    Senha
                                </label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emidias-gray-400">
                                        <Lock size={20} />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Digite sua senha"
                                        required
                                        className="input-base pl-12 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-emidias-gray-400 hover:text-emidias-gray-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="bg-emidias-danger/10 border border-emidias-danger/20 text-emidias-danger px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                    <div className="w-2 h-2 bg-emidias-danger rounded-full flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full btn-base btn-accent py-4 text-base group relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                <span className={`flex items-center justify-center gap-2 transition-all ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                                    Entrar
                                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                                {isLoading && (
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <Loader2 size={24} className="animate-spin" />
                                    </span>
                                )}
                            </button>

                            {/* Forgot Password Link */}
                            <div className="text-center pt-2">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-emidias-accent hover:text-emidias-accent-dark font-medium transition-colors hover:underline underline-offset-4"
                                >
                                    Esqueceu sua senha?
                                </Link>
                            </div>
                        </form>

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-emidias-gray-200">
                            <p className="text-center text-sm text-emidias-gray-500">
                                Apenas usuários autorizados
                            </p>
                            <p className="text-center text-xs text-emidias-gray-400 mt-1">
                                @hubradios.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <p className="text-xs text-emidias-gray-400 tracking-wider">
                    E-MÍDIAS &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
