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
            {/* Animated Signal Cables Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Signal Cable Lines - Animated */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        {/* Gradient for signal pulse */}
                        <linearGradient id="signalGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 0)" />
                            <stop offset="50%" stopColor="rgba(252, 30, 117, 0.6)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>
                        <linearGradient id="signalGradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 0)" />
                            <stop offset="50%" stopColor="rgba(252, 30, 117, 0.5)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Cable 1 - Top Left to Bottom Right */}
                    <path
                        d="M 0,20 Q 200,100 400,80 T 800,120 L 1200,200"
                        stroke="rgba(6, 5, 91, 0.08)"
                        strokeWidth="1.5"
                        fill="none"
                        className="signal-cable"
                    />
                    <path
                        d="M 0,20 Q 200,100 400,80 T 800,120 L 1200,200"
                        stroke="url(#signalGradient1)"
                        strokeWidth="2.5"
                        fill="none"
                        className="signal-pulse"
                        style={{ animationDelay: '0s' }}
                    />

                    {/* Cable 2 - Bottom Left to Top Right */}
                    <path
                        d="M 0,600 Q 300,500 600,550 T 1200,400"
                        stroke="rgba(6, 5, 91, 0.08)"
                        strokeWidth="1.5"
                        fill="none"
                        className="signal-cable"
                    />
                    <path
                        d="M 0,600 Q 300,500 600,550 T 1200,400"
                        stroke="url(#signalGradient1)"
                        strokeWidth="2.5"
                        fill="none"
                        className="signal-pulse"
                        style={{ animationDelay: '2s' }}
                    />

                    {/* Cable 3 - Vertical Left */}
                    <path
                        d="M 100,0 Q 120,200 100,400 T 100,800"
                        stroke="rgba(6, 5, 91, 0.08)"
                        strokeWidth="1.5"
                        fill="none"
                        className="signal-cable"
                    />
                    <path
                        d="M 100,0 Q 120,200 100,400 T 100,800"
                        stroke="url(#signalGradient2)"
                        strokeWidth="2.5"
                        fill="none"
                        className="signal-pulse-vertical"
                        style={{ animationDelay: '1s' }}
                    />

                    {/* Cable 4 - Diagonal Center */}
                    <path
                        d="M 200,0 Q 400,300 600,400 T 1000,700"
                        stroke="rgba(6, 5, 91, 0.08)"
                        strokeWidth="1.5"
                        fill="none"
                        className="signal-cable"
                    />
                    <path
                        d="M 200,0 Q 400,300 600,400 T 1000,700"
                        stroke="url(#signalGradient1)"
                        strokeWidth="2.5"
                        fill="none"
                        className="signal-pulse"
                        style={{ animationDelay: '3.5s' }}
                    />

                    {/* Cable 5 - Top Right to Bottom */}
                    <path
                        d="M 1200,100 Q 1000,250 900,400 T 700,800"
                        stroke="rgba(6, 5, 91, 0.08)"
                        strokeWidth="1.5"
                        fill="none"
                        className="signal-cable"
                    />
                    <path
                        d="M 1200,100 Q 1000,250 900,400 T 700,800"
                        stroke="url(#signalGradient2)"
                        strokeWidth="2.5"
                        fill="none"
                        className="signal-pulse-vertical"
                        style={{ animationDelay: '1.5s' }}
                    />

                    {/* Cable 6 - Horizontal Middle */}
                    <path
                        d="M 0,400 Q 300,420 600,400 T 1200,400"
                        stroke="rgba(6, 5, 91, 0.08)"
                        strokeWidth="1.5"
                        fill="none"
                        className="signal-cable"
                    />
                    <path
                        d="M 0,400 Q 300,420 600,400 T 1200,400"
                        stroke="url(#signalGradient1)"
                        strokeWidth="2.5"
                        fill="none"
                        className="signal-pulse"
                        style={{ animationDelay: '4s' }}
                    />
                </svg>

                {/* Subtle gradient orbs for depth */}
                <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-gradient-to-br from-emidias-accent/3 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-[20%] right-[15%] w-80 h-80 bg-gradient-to-br from-emidias-primary/3 to-transparent rounded-full blur-3xl" />
            </div>

            {/* Main Content */}
            <div className={`relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Left Side - Static Logo with Hover Effect */}
                <div className="flex-1 flex flex-col items-center lg:items-start">
                    {/* Logo with Hover Zoom and Shadow */}
                    <div className="relative mb-8 lg:mb-10 group cursor-pointer">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emidias-accent/10 to-emidias-primary/10 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        {/* Static logo with hover effect */}
                        <div className="relative transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-2xl">
                            <Image
                                src="/assets/logo.png"
                                alt="E-MÍDIAS Logo"
                                width={240}
                                height={240}
                                className="relative z-10 drop-shadow-lg lg:w-[320px] lg:h-[320px]"
                                priority
                            />
                        </div>
                    </div>

                    {/* Brand Text */}
                    <div className="hidden lg:block space-y-4 text-center lg:text-left">
                        <h1 className="text-4xl xl:text-5xl font-bold text-emidias-gray-900 tracking-tight">
                            OOH Data Hub
                        </h1>
                        <p className="text-lg text-emidias-gray-600 max-w-md leading-relaxed">
                            Plataforma completa de gerenciamento de mídias Out of Home.
                            Visualize, analise e gerencie seus pontos de forma inteligente.
                        </p>
                        <div className="flex gap-3 pt-4 justify-center lg:justify-start">
                            <div className="px-4 py-2 bg-emidias-gray-50 border border-emidias-gray-200 rounded-full text-sm text-emidias-gray-700">
                                <span className="text-emidias-accent font-semibold">+1000</span> Pontos
                            </div>
                            <div className="px-4 py-2 bg-emidias-gray-50 border border-emidias-gray-200 rounded-full text-sm text-emidias-gray-700">
                                <span className="text-emidias-accent font-semibold">50+</span> Cidades
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="w-full max-w-md">
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

                    {/* Mobile Stats */}
                    <div className="lg:hidden flex justify-center gap-3 mt-6">
                        <div className="px-4 py-2 bg-emidias-gray-50 border border-emidias-gray-200 rounded-full text-sm text-emidias-gray-700">
                            <span className="text-emidias-accent font-semibold">+1000</span> Pontos
                        </div>
                        <div className="px-4 py-2 bg-emidias-gray-50 border border-emidias-gray-200 rounded-full text-sm text-emidias-gray-700">
                            <span className="text-emidias-accent font-semibold">50+</span> Cidades
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
