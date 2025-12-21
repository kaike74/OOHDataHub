'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
            if (response.user.role === 'client') {
                router.push('/admin/proposals');
            } else {
                router.push('/');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Animated Signal Lines Background - Cyberpunk Circuit */}
            <div className="absolute inset-y-0 right-0 w-full overflow-hidden pointer-events-none select-none">
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                        {/* Glow Filter for Neon Effect - Softer */}
                        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                            <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>

                        {/* Pink Gradient for Active Beams */}
                        <linearGradient id="beamGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(252, 30, 117, 0.9)" />
                            <stop offset="50%" stopColor="rgba(252, 30, 117, 0.6)" />
                            <stop offset="100%" stopColor="rgba(252, 30, 117, 0)" />
                        </linearGradient>

                        {/* Very Subtle Gradient for Static Traces */}
                        <linearGradient id="traceGradient" x1="100%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(106, 13, 173, 0.15)" />
                            <stop offset="50%" stopColor="rgba(106, 13, 173, 0.08)" />
                            <stop offset="100%" stopColor="rgba(106, 13, 173, 0)" />
                        </linearGradient>
                    </defs>

                    {/* --- STATIC CIRCUIT TRACES (Background Network) - Thinner and Dense --- */}
                    <g className="circuit-traces" stroke="url(#traceGradient)" fill="none" strokeWidth="0.3" vectorEffect="non-scaling-stroke">
                        {/* Network 1: Top Right Cluster */}
                        <path d="M 100,2 H 95 L 90,7 H 85" />
                        <path d="M 90,7 V 15 L 85,20 H 75" />
                        <path d="M 85,20 V 30 L 80,35 H 60" />
                        <path d="M 60,35 V 45 L 55,50 H 30" />

                        {/* Detail Branches for Net 1 */}
                        <path d="M 95,2 V 8" />
                        <path d="M 85,7 V 12 H 80" />
                        <path d="M 75,20 V 25 L 72,28" />
                        <path d="M 60,35 L 62,38 V 42" />
                        <path d="M 30,50 L 25,55 H 20" />

                        {/* Network 2: Mid Right Main Trunk */}
                        <path d="M 100,20 H 94 L 88,26 H 70 L 65,31 H 50" />
                        <path d="M 88,26 V 40 L 83,45 H 65" />
                        <path d="M 70,26 V 15 L 65,10 H 55" />

                        {/* Detail Branches for Net 2 */}
                        <path d="M 94,20 V 25 H 90" />
                        <path d="M 65,31 V 36 H 60" />
                        <path d="M 50,31 L 45,36 H 35" />
                        <path d="M 83,45 V 55 L 78,60 H 60" />

                        {/* Network 3: Lower Right Complex */}
                        <path d="M 100,50 H 95 L 90,55 H 80 L 75,60 H 55" />
                        <path d="M 90,55 V 70 L 85,75 H 65" />
                        <path d="M 80,55 V 45 L 75,40 H 60" />

                        {/* Detail Branches for Net 3 */}
                        <path d="M 95,50 V 45 H 90" />
                        <path d="M 75,60 V 68 H 70" />
                        <path d="M 55,60 L 50,65 H 40" />
                        <path d="M 65,75 V 85 L 60,90 H 40" />
                        <path d="M 85,75 L 88,78 V 82" />

                        {/* Network 4: Bottom Swirls */}
                        <path d="M 100,80 H 92 L 85,87 H 60" />
                        <path d="M 85,87 V 95 H 80" />
                        <path d="M 92,80 V 75 H 88" />

                        {/* Micro-connections (Tiny vertical/horizontal bits) */}
                        <path d="M 80,10 V 15" opacity="0.6" />
                        <path d="M 40,40 H 45" opacity="0.6" />
                        <path d="M 60,80 V 85" opacity="0.6" />
                        <path d="M 30,60 V 65" opacity="0.6" />
                    </g>

                    {/* --- ACTIVE PULSE BEAMS (Reduced Count, Thinner) --- */}
                    <g className="active-beams" filter="url(#neonGlow)">
                        {/* Beam 1: Long path on Network 2 Main Trunk */}
                        <path d="M 100,20 H 94 L 88,26 H 70 L 65,31 H 50"
                            stroke="url(#beamGradient)" strokeWidth="1" fill="none"
                            style={{
                                strokeDasharray: '30 120', // Shorter beam relative to gap
                                strokeLinecap: 'round',
                                animation: 'circuitDash 5s cubic-bezier(0.1, 0.8, 0.2, 1) infinite'
                            }}
                            vectorEffect="non-scaling-stroke"
                        />

                        {/* Beam 2: Alternate path on Network 3 (Delayed) */}
                        <path d="M 100,50 H 95 L 90,55 H 80 L 75,60 H 55"
                            stroke="url(#beamGradient)" strokeWidth="1" fill="none"
                            style={{
                                strokeDasharray: '25 120',
                                strokeLinecap: 'round',
                                animation: 'circuitDash 6s cubic-bezier(0.1, 0.8, 0.2, 1) infinite',
                                animationDelay: '2.5s' // Alternate timing
                            }}
                            vectorEffect="non-scaling-stroke"
                        />
                    </g>
                </svg>

                {/* Depth/Glow Effects - Reduced Intensity */}
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[80px] pointer-events-none" />

                <style jsx>{`
                    @keyframes circuitDash {
                        0% {
                            stroke-dashoffset: 150;
                            opacity: 0;
                        }
                        10% {
                            opacity: 1;
                        }
                        40% {
                            opacity: 1;
                        }
                        100% {
                            stroke-dashoffset: -150;
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
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-emidias-xl border border-emidias-gray-100 animate-fade-in-scale group/card relative transition-all duration-500 hover:shadow-2xl" style={{ animationDelay: '0.2s' }}>
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
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <Input
                                label="Email"
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seuemail@hubradios.com"
                                required
                                icon={<Mail size={20} />}
                            />

                            {/* Password Field */}
                            <Input
                                label="Senha"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha"
                                required
                                icon={<Lock size={20} />}
                                rightElement={
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-emidias-gray-400 hover:text-emidias-gray-600 transition-colors p-1"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                }
                            />

                            {/* Error Message */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                    <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                isLoading={isLoading}
                                className="w-full py-6 text-base"
                                variant="accent"
                                rightIcon={<ArrowRight size={20} />}
                            >
                                Entrar
                            </Button>

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
                                Não tem uma conta?{' '}
                                <Link
                                    href="/signup"
                                    className="text-emidias-accent hover:text-emidias-accent-dark font-medium transition-colors hover:underline underline-offset-4"
                                >
                                    Criar conta
                                </Link>
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
