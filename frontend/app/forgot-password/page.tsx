'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import AnimatedBackground from '@/components/AnimatedBackground';

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
        <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            <AnimatedBackground />

            {/* Main Content */}
            <div className="relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20 transition-all duration-700 animate-in fade-in slide-in-from-bottom-4">
                {/* Left Side - Logo */}
                <div className="flex-1 flex items-center justify-center lg:justify-start lg:pl-8">
                    <div className="relative group cursor-pointer" onClick={() => router.push('/login')}>
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-full blur-2xl scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
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

                {/* Right Side - Form */}
                <div className="w-full max-w-md lg:pl-12">
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-plura-xl border border-plura-gray-100 group/card relative transition-all duration-500 hover:shadow-2xl">
                        {/* Subtle glow on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl blur-2xl scale-110 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700 pointer-events-none" />

                        {/* Header */}
                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                                Esqueceu sua senha?
                            </h2>
                            <p className="text-gray-500">
                                Digite seu email para receber um link de redefinição
                            </p>
                        </div>

                        {success ? (
                            <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl">
                                    <p className="font-bold mb-2">Email enviado!</p>
                                    <p className="text-sm">
                                        Se o email existir em nosso sistema, você receberá um link para redefinir sua senha.
                                        Verifique sua caixa de entrada.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => router.push('/login')}
                                    className="w-full"
                                    variant="primary"
                                    rightIcon={<ArrowRight size={20} />}
                                >
                                    Voltar ao Login
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
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

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-shake">
                                        <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                                        {error}
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    isLoading={isLoading}
                                    className="w-full py-6 text-base"
                                    variant="accent"
                                    rightIcon={<ArrowRight size={20} />}
                                >
                                    Enviar Link
                                </Button>

                                <div className="text-center pt-2">
                                    <Link
                                        href="/login"
                                        className="text-sm text-gray-500 hover:text-plura-primary font-medium transition-colors hover:underline underline-offset-4 flex items-center justify-center gap-2"
                                    >
                                        <ArrowLeft size={16} />
                                        Voltar ao login
                                    </Link>
                                </div>
                            </form>
                        )}

                        {/* Footer */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-center text-xs text-gray-400">
                                @hubradios.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Branding */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <p className="text-xs text-gray-400 tracking-wider">
                    E-MÍDIAS &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
