'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useStore((state) => state.setAuth);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

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
            {/* Animated Signal Lines Background - High Speed Cyberpunk Network */}
            <div className="absolute inset-y-0 right-0 w-full overflow-hidden pointer-events-none select-none">
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        {/* Glow Filter */}
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Intense Pink Pulse - Fades out to left */}
                        <linearGradient id="signalPulse" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 1)" />
                            <stop offset="30%" stopColor="rgba(252, 30, 117, 0.9)" />
                            <stop offset="70%" stopColor="rgba(252, 30, 117, 0.4)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>

                        {/* Visible Cable Trace - Fades out to left */}
                        <linearGradient id="cableGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgba(106, 13, 173, 0.35)" />
                            <stop offset="40%" stopColor="rgba(106, 13, 173, 0.15)" />
                            <stop offset="90%" stopColor="rgba(106, 13, 173, 0)" />
                        </linearGradient>

                        {/* Vertical Gradient for Top-Down flows */}
                        <linearGradient id="verticalPulse" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 1)" />
                            <stop offset="50%" stopColor="rgba(252, 30, 117, 0.5)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Complex Cable Network with Top-Down Lines */}
                    <g className="cable-network">
                        {/* --- TOP-DOWN TRUNK 1 (Right) --- */}
                        <path d="M 95,0 V 10 L 90,15 H 70" stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
                        {/* Branch */}
                        <path d="M 90,15 V 30 L 85,35 H 65" stroke="url(#cableGradient)" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* --- TOP-DOWN TRUNK 2 (Mid-Right) --- */}
                        <path d="M 80,0 V 25 L 75,30 H 50" stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />
                        {/* Branch */}
                        <path d="M 75,30 V 45 L 70,50 H 55" stroke="url(#cableGradient)" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* --- TOP-DOWN TRUNK 3 (Center-Right) --- */}
                        <path d="M 65,0 V 40 L 60,45 H 20" stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* --- Horizontal Trunks (Existing but adjusted) --- */}
                        {/* TRUNK A */}
                        <path d="M 100,5 H 98 L 95,10" stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* TRUNK B */}
                        <path d="M 100,50 H 85 L 80,55 H 40 L 35,60 H 0" stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* TRUNK C */}
                        <path d="M 100,80 H 90 L 85,85 H 60 L 55,90 H 20" stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Ramifications */}
                        <path d="M 80,55 V 65 L 75,70 H 50" stroke="url(#cableGradient)" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />
                        <path d="M 55,90 V 80 L 50,75 H 25" stroke="url(#cableGradient)" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />
                    </g>

                    {/* Active Pulses - FAST & SPARCE */}
                    <g className="signal-pulses" filter="url(#glow)">
                        {/* FAST VERTICAL PULSE 1 */}
                        <path d="M 95,0 V 10 L 90,15 H 70" stroke="url(#verticalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '30 70', animation: 'signalFlow 1.5s linear infinite' }} vectorEffect="non-scaling-stroke" />

                        {/* FAST VERTICAL PULSE 2 */}
                        <path d="M 80,0 V 25 L 75,30 H 50" stroke="url(#verticalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '25 75', animation: 'signalFlow 1.8s linear infinite', animationDelay: '0.4s' }} vectorEffect="non-scaling-stroke" />

                        {/* FAST VERTICAL PULSE 3 */}
                        <path d="M 65,0 V 40 L 60,45 H 20" stroke="url(#verticalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '40 60', animation: 'signalFlow 1.6s linear infinite', animationDelay: '0.8s' }} vectorEffect="non-scaling-stroke" />

                        {/* FAST HORIZONTAL PULSE - Main Trunk */}
                        <path d="M 100,50 H 85 L 80,55 H 40 L 35,60 H 0" stroke="url(#signalPulse)" strokeWidth="1" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '40 60', animation: 'signalFlow 1.2s linear infinite', animationDelay: '0s' }} vectorEffect="non-scaling-stroke" />

                        {/* FAST HORIZONTAL PULSE - Bottom */}
                        <path d="M 100,80 H 90 L 85,85 H 60 L 55,90 H 20" stroke="url(#signalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '30 70', animation: 'signalFlow 1.4s linear infinite', animationDelay: '0.5s' }} vectorEffect="non-scaling-stroke" />
                    </g>
                </svg>

                {/* Depth Orbs */}
                <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-gradient-to-br from-purple-500/5 to-transparent rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-[20%] right-[30%] w-80 h-80 bg-gradient-to-br from-pink-500/5 to-transparent rounded-full blur-3xl opacity-50" />

                <style jsx>{`
                    @keyframes signalFlow {
                        0% {
                            stroke-dashoffset: 0;
                            opacity: 0;
                        }
                        10% {
                            opacity: 1;
                        }
                        70% {
                           opacity: 1;
                        }
                        100% {
                            stroke-dashoffset: -100;
                            opacity: 0;
                        }
                    }
                `}</style>
            </div>

            {/* Main Content */}
            <div className={`relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Left Side - Logo positioned more to the left */}
                <div className="flex-1 flex items-center justify-center lg:justify-start lg:pl-8">
                    {/* Logo with subtle hover effect */}
                    <div className="relative group cursor-pointer">
                        {/* Very subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                        {/* Static logo with very subtle hover zoom */}
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

                {/* Right Side - Login Card */}
                <div className="w-full max-w-md lg:pl-12">
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl border border-emidias-gray-100 animate-fade-in-scale group/card relative transition-all duration-500 hover:shadow-2xl" style={{ animationDelay: '0.2s' }}>
                        {/* Subtle glow on hover - same as logo */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl scale-110 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

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

