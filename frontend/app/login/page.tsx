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
        <div className="login-container flex items-center justify-center p-4 sm:p-6 lg:p-8">
            {/* Background Geometric Pattern */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Animated circles */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emidias-accent/10 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emidias-primary-light/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emidias-accent/5 rounded-full blur-3xl" />

                {/* Subtle grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02]"
                    style={{
                        backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '50px 50px'
                    }}
                />
            </div>

            {/* Main Content */}
            <div className={`relative z-10 w-full max-w-5xl flex flex-col lg:flex-row items-center gap-8 lg:gap-16 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Left Side - Logo & Branding */}
                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                    {/* Logo with Glow Effect */}
                    <div className="relative mb-6 lg:mb-8">
                        <div className="absolute inset-0 bg-emidias-accent/30 rounded-full blur-3xl scale-150 animate-pulse-gentle" />
                        <Image
                            src="/assets/logo.png"
                            alt="E-MÍDIAS Logo"
                            width={200}
                            height={200}
                            className="relative z-10 drop-shadow-2xl animate-glow-pulse lg:w-[280px] lg:h-[280px]"
                            priority
                        />
                    </div>

                    {/* Brand Text */}
                    <div className="hidden lg:block space-y-4">
                        <h1 className="text-4xl font-bold text-white tracking-tight">
                            OOH Data Hub
                        </h1>
                        <p className="text-lg text-white/70 max-w-md leading-relaxed">
                            Plataforma completa de gerenciamento de mídias Out of Home.
                            Visualize, analise e gerencie seus pontos de forma inteligente.
                        </p>
                        <div className="flex gap-3 pt-4">
                            <div className="px-4 py-2 glass rounded-full text-sm text-white/80">
                                <span className="text-emidias-accent font-semibold">+1000</span> Pontos
                            </div>
                            <div className="px-4 py-2 glass rounded-full text-sm text-white/80">
                                <span className="text-emidias-accent font-semibold">50+</span> Cidades
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Login Card */}
                <div className="w-full max-w-md">
                    <div className="login-card-light p-8 sm:p-10 animate-fade-in-scale" style={{ animationDelay: '0.2s' }}>
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
                        <div className="px-4 py-2 glass rounded-full text-sm text-white/80">
                            <span className="text-emidias-accent font-semibold">+1000</span> Pontos
                        </div>
                        <div className="px-4 py-2 glass rounded-full text-sm text-white/80">
                            <span className="text-emidias-accent font-semibold">50+</span> Cidades
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <p className="text-xs text-white/40 tracking-wider">
                    E-MÍDIAS &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
