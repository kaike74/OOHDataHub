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
            {/* Animated Signal Lines Background - Tree-like branching from right to left */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        {/* Pink gradient for signal pulse - more intense and visible */}
                        <linearGradient id="signalPulse" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 1)" />
                            <stop offset="20%" stopColor="rgba(252, 30, 117, 1)" />
                            <stop offset="50%" stopColor="rgba(252, 30, 117, 0.7)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>

                        {/* Subtle cable color */}
                        <linearGradient id="cableGradient" x1="100%" y1="0%" x2="0%" y2="0%">
                            <stop offset="0%" stopColor="rgba(106, 13, 173, 0.12)" />
                            <stop offset="50%" stopColor="rgba(106, 13, 173, 0.08)" />
                            <stop offset="100%" stopColor="rgba(106, 13, 173, 0)" />
                        </linearGradient>
                    </defs>

                    {/* Cable paths - subtle static lines */}
                    <g className="cable-network">
                        {/* Main trunk line 1 */}
                        <path
                            d="M 100,12 L 85,12 L 85,18 L 70,18 L 70,24 L 55,24 L 55,28 L 40,28 L 40,32 L 25,32"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.216"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 1a */}
                        <path
                            d="M 85,18 L 85,22 L 75,22 L 75,28 L 60,28 L 60,32 L 45,32 L 45,36 L 30,36"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.18"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 1b */}
                        <path
                            d="M 70,24 L 70,30 L 58,30 L 58,34 L 43,34 L 43,38 L 28,38"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.144"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Main trunk line 2 */}
                        <path
                            d="M 100,28 L 88,28 L 88,35 L 73,35 L 73,42 L 58,42 L 58,46 L 43,46 L 43,50 L 28,50"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.216"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 2a */}
                        <path
                            d="M 88,35 L 88,40 L 78,40 L 78,46 L 63,46 L 63,50 L 48,50 L 48,54 L 33,54"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.18"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 2b */}
                        <path
                            d="M 73,42 L 73,48 L 61,48 L 61,52 L 46,52 L 46,56 L 31,56"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.144"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 2c */}
                        <path
                            d="M 78,40 L 78,44 L 68,44 L 68,48 L 53,48 L 53,52 L 38,52"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.108"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Main trunk line 3 */}
                        <path
                            d="M 100,48 L 86,48 L 86,54 L 71,54 L 71,60 L 56,60 L 56,64 L 41,64 L 41,68 L 26,68"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.216"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 3a */}
                        <path
                            d="M 86,54 L 86,59 L 76,59 L 76,65 L 61,65 L 61,69 L 46,69 L 46,73 L 31,73"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.18"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 3b */}
                        <path
                            d="M 71,60 L 71,66 L 59,66 L 59,70 L 44,70 L 44,74 L 29,74"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.144"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Main trunk line 4 */}
                        <path
                            d="M 100,68 L 90,68 L 90,74 L 75,74 L 75,80 L 60,80 L 60,84 L 45,84 L 45,88 L 30,88"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.216"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 4a */}
                        <path
                            d="M 90,74 L 90,78 L 80,78 L 80,84 L 65,84 L 65,88 L 50,88 L 50,92 L 35,92"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.18"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Branch 4b */}
                        <path
                            d="M 75,80 L 75,86 L 63,86 L 63,90 L 48,90 L 48,94 L 33,94"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.144"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Additional top line */}
                        <path
                            d="M 100,5 L 92,5 L 92,10 L 77,10 L 77,15 L 62,15 L 62,19 L 47,19 L 47,23 L 32,23"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.18"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        <path
                            d="M 92,10 L 92,14 L 82,14 L 82,19 L 67,19 L 67,23 L 52,23 L 52,27 L 37,27"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.144"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Additional bottom line */}
                        <path
                            d="M 100,88 L 88,88 L 88,92 L 73,92 L 73,96 L 58,96"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.18"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                        <path
                            d="M 88,92 L 88,95 L 78,95 L 78,98 L 63,98"
                            stroke="url(#cableGradient)"
                            strokeWidth="0.108"
                            fill="none"
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>

                    {/* Animated signal pulses - running from right to left */}
                    <g className="signal-pulses">
                        {/* Pulse 1 - Main trunk 1 */}
                        <path
                            d="M 100,12 L 85,12 L 85,18 L 70,18 L 70,24 L 55,24"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.25"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '15 85',
                                animation: 'signalFlow 3s linear infinite',
                                animationDelay: '0s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 1a - Branch */}
                        <path
                            d="M 85,18 L 85,22 L 75,22 L 75,28 L 60,28"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.2"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '12 88',
                                animation: 'signalFlow 2.8s linear infinite',
                                animationDelay: '0.3s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 1b - Branch */}
                        <path
                            d="M 70,24 L 70,30 L 58,30"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.18"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '10 90',
                                animation: 'signalFlow 2.5s linear infinite',
                                animationDelay: '0.5s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Pulse 2 - Main trunk 2 */}
                        <path
                            d="M 100,28 L 88,28 L 88,35 L 73,35 L 73,42 L 58,42"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.25"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '15 85',
                                animation: 'signalFlow 3.2s linear infinite',
                                animationDelay: '1s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 2a - Branch */}
                        <path
                            d="M 88,35 L 88,40 L 78,40 L 78,46 L 63,46"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.2"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '12 88',
                                animation: 'signalFlow 2.9s linear infinite',
                                animationDelay: '1.3s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 2b - Branch */}
                        <path
                            d="M 73,42 L 73,48 L 61,48"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.18"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '10 90',
                                animation: 'signalFlow 2.6s linear infinite',
                                animationDelay: '1.5s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 2c - Small branch */}
                        <path
                            d="M 78,40 L 78,44 L 68,44"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.15"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '8 92',
                                animation: 'signalFlow 2.3s linear infinite',
                                animationDelay: '1.7s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Pulse 3 - Main trunk 3 */}
                        <path
                            d="M 100,48 L 86,48 L 86,54 L 71,54 L 71,60 L 56,60"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.25"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '15 85',
                                animation: 'signalFlow 3.1s linear infinite',
                                animationDelay: '2s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 3a - Branch */}
                        <path
                            d="M 86,54 L 86,59 L 76,59 L 76,65 L 61,65"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.2"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '12 88',
                                animation: 'signalFlow 2.85s linear infinite',
                                animationDelay: '2.3s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 3b - Branch */}
                        <path
                            d="M 71,60 L 71,66 L 59,66"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.18"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '10 90',
                                animation: 'signalFlow 2.55s linear infinite',
                                animationDelay: '2.5s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Pulse 4 - Main trunk 4 */}
                        <path
                            d="M 100,68 L 90,68 L 90,74 L 75,74 L 75,80 L 60,80"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.25"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '15 85',
                                animation: 'signalFlow 3.3s linear infinite',
                                animationDelay: '0.7s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 4a - Branch */}
                        <path
                            d="M 90,74 L 90,78 L 80,78 L 80,84 L 65,84"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.2"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '12 88',
                                animation: 'signalFlow 2.95s linear infinite',
                                animationDelay: '1.0s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        {/* Pulse 4b - Branch */}
                        <path
                            d="M 75,80 L 75,86 L 63,86"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.18"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '10 90',
                                animation: 'signalFlow 2.65s linear infinite',
                                animationDelay: '1.2s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Top pulses */}
                        <path
                            d="M 100,5 L 92,5 L 92,10 L 77,10 L 77,15 L 62,15"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.22"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '13 87',
                                animation: 'signalFlow 2.7s linear infinite',
                                animationDelay: '0.4s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        <path
                            d="M 92,10 L 92,14 L 82,14 L 82,19 L 67,19"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.18"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '10 90',
                                animation: 'signalFlow 2.4s linear infinite',
                                animationDelay: '0.6s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Bottom pulses */}
                        <path
                            d="M 100,88 L 88,88 L 88,92 L 73,92 L 73,96 L 58,96"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.22"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '13 87',
                                animation: 'signalFlow 2.75s linear infinite',
                                animationDelay: '1.8s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                        <path
                            d="M 88,92 L 88,95 L 78,95"
                            stroke="url(#signalPulse)"
                            strokeWidth="0.15"
                            fill="none"
                            className="signal-flow"
                            style={{
                                strokeDasharray: '8 92',
                                animation: 'signalFlow 2.2s linear infinite',
                                animationDelay: '2.0s'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                </svg>

                {/* Subtle gradient orbs for depth */}
                <div className="absolute top-[20%] left-[10%] w-96 h-96 bg-gradient-to-br from-purple-500/3 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-[20%] right-[15%] w-80 h-80 bg-gradient-to-br from-pink-500/3 to-transparent rounded-full blur-3xl" />

                <style jsx>{`
                    @keyframes signalFlow {
                        0% {
                            stroke-dashoffset: 0;
                        }
                        100% {
                            stroke-dashoffset: -100;
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

