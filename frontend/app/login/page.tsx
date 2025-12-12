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
            {/* Animated Signal Lines Background - Cyberpunk Circuit */}
            <div className="absolute inset-y-0 right-0 w-[55%] overflow-hidden pointer-events-none select-none">
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

                        {/* Intense Pink Pulse */}
                        <linearGradient id="signalPulse" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 1)" />
                            <stop offset="20%" stopColor="rgba(252, 30, 117, 0.8)" />
                            <stop offset="50%" stopColor="rgba(252, 30, 117, 0.6)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>

                        {/* Visible Cable Trace */}
                        <linearGradient id="cableGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgba(106, 13, 173, 0.3)" />
                            <stop offset="50%" stopColor="rgba(106, 13, 173, 0.15)" />
                            <stop offset="100%" stopColor="rgba(106, 13, 173, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Base Cables - Static but visible */}
                    <g className="cable-network">
                        {/* Long Line 1 - Top */}
                        <path d="M 100,10 H 90 L 85,15 H 70 L 65,20 H 40 L 35,25 H 10"
                            stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Branch 1a */}
                        <path d="M 85,15 V 25 L 80,30 H 60"
                            stroke="url(#cableGradient)" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Long Line 2 - Mid Top */}
                        <path d="M 100,35 H 85 L 80,30 H 60 L 55,25 H 20"
                            stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Long Line 3 - Center */}
                        <path d="M 100,50 H 95 L 90,55 H 75 L 70,50 H 50 L 45,55 H 5"
                            stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Branch 3a */}
                        <path d="M 70,50 V 40 L 65,35 H 45"
                            stroke="url(#cableGradient)" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Long Line 4 - Mid Bottom */}
                        <path d="M 100,70 H 80 L 75,75 H 55 L 50,70 H 15"
                            stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Long Line 5 - Bottom */}
                        <path d="M 100,90 H 85 L 80,85 H 60 L 55,80 H 30"
                            stroke="url(#cableGradient)" strokeWidth="0.5" fill="none" vectorEffect="non-scaling-stroke" />

                        {/* Branch 5a */}
                        <path d="M 80,85 V 75 L 75,70 H 60"
                            stroke="url(#cableGradient)" strokeWidth="0.4" fill="none" vectorEffect="non-scaling-stroke" />
                    </g>

                    {/* Active Pulses - Glowing and Fast */}
                    <g className="signal-pulses" filter="url(#glow)">
                        {/* Pulse 1 */}
                        <path d="M 100,10 H 90 L 85,15 H 70 L 65,20 H 40 L 35,25 H 10"
                            stroke="url(#signalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '20 80', animation: 'signalFlow 2.5s linear infinite' }} vectorEffect="non-scaling-stroke" />

                        {/* Pulse 2 */}
                        <path d="M 100,35 H 85 L 80,30 H 60 L 55,25 H 20"
                            stroke="url(#signalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '25 75', animation: 'signalFlow 3s linear infinite', animationDelay: '0.5s' }} vectorEffect="non-scaling-stroke" />

                        {/* Pulse 3 */}
                        <path d="M 100,50 H 95 L 90,55 H 75 L 70,50 H 50 L 45,55 H 5"
                            stroke="url(#signalPulse)" strokeWidth="1" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '30 70', animation: 'signalFlow 2.8s linear infinite', animationDelay: '1s' }} vectorEffect="non-scaling-stroke" />

                        {/* Pulse 4 */}
                        <path d="M 100,70 H 80 L 75,75 H 55 L 50,70 H 15"
                            stroke="url(#signalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '20 80', animation: 'signalFlow 3.2s linear infinite', animationDelay: '0.2s' }} vectorEffect="non-scaling-stroke" />

                        {/* Pulse 5 */}
                        <path d="M 100,90 H 85 L 80,85 H 60 L 55,80 H 30"
                            stroke="url(#signalPulse)" strokeWidth="0.8" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '25 75', animation: 'signalFlow 2.6s linear infinite', animationDelay: '1.5s' }} vectorEffect="non-scaling-stroke" />

                        {/* Branch Pulses */}
                        <path d="M 85,15 V 25 L 80,30 H 60"
                            stroke="url(#signalPulse)" strokeWidth="0.6" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '15 85', animation: 'signalFlow 2.5s linear infinite', animationDelay: '0.8s' }} vectorEffect="non-scaling-stroke" />

                        <path d="M 80,85 V 75 L 75,70 H 60"
                            stroke="url(#signalPulse)" strokeWidth="0.6" fill="none" className="signal-flow"
                            style={{ strokeDasharray: '15 85', animation: 'signalFlow 2.6s linear infinite', animationDelay: '2s' }} vectorEffect="non-scaling-stroke" />
                    </g>
                </svg>

                <style jsx>{`
                    @keyframes signalFlow {
                        0% {
                            stroke-dashoffset: 0;
                            opacity: 0;
                        }
                        10% {
                            opacity: 1;
                        }
                        90% {
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

