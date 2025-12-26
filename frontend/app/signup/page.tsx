'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Mail, Lock, Eye, EyeOff, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const setAuth = useStore((state) => state.setAuth);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Auto-fill from invite link if present
    const inviteToken = searchParams.get('invite');
    const emailParam = searchParams.get('email');

    useEffect(() => {
        if (emailParam) setEmail(emailParam);
    }, [emailParam]);

    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (password !== confirmPassword) {
            setError('As senhas não coincidem');
            setIsLoading(false);
            return;
        }

        try {
            const response = await api.registerClientPublic({
                name,
                email,
                password,
                inviteToken: inviteToken || undefined
            });

            // If success but NO token, it means verification required
            if (response.success && !response.token) {
                setSuccess(true);
            } else if (response.success && response.token) {
                setAuth(response.user, response.token);
                // Redirect to Admin Proposals
                router.push('/admin/proposals');
            } else {
                router.push('/login?registered=true');
            }

        } catch (err: any) {
            setError(err.message || 'Erro ao criar conta');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-emidias-xl border border-emidias-gray-100 text-center animate-fade-in-scale">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifique seu email</h2>
                    <p className="text-gray-500 mb-8">
                        Enviamos um link de confirmação para <strong>{email}</strong>. <br />
                        Por favor, clique no link para ativar sua conta.
                    </p>
                    <Link href="/login">
                        <Button variant="outline" className="w-full">
                            Voltar para Login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
            {/* Reuse Login Background Style via CSS reuse or similar structure */}
            <div className="absolute inset-y-0 right-0 w-full overflow-hidden pointer-events-none select-none">
                {/* Simplified Background for Signup to distinguish or keep consistent? Keeping consistent.*/}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-pink-50/30" />
            </div>

            {/* Main Content */}
            <div className={`relative z-10 w-full max-w-6xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Left Side - Logo */}
                <div className="flex-1 flex items-center justify-center lg:justify-start lg:pl-8">
                    <div className="relative group cursor-pointer">
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

                {/* Right Side - Signup Card */}
                <div className="w-full max-w-md lg:pl-12">
                    <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-emidias-xl border border-emidias-gray-100 animate-fade-in-scale relative">

                        <div className="mb-8 text-center lg:text-left">
                            <h2 className="text-2xl sm:text-3xl font-bold text-emidias-gray-900 mb-2">
                                Crie sua conta
                            </h2>
                            <p className="text-emidias-gray-500">
                                {inviteToken ? 'Para aceitar seu convite, preencha seus dados.' : 'Cadastre-se para acessar o portal.'}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Nome Completo"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Seu nome"
                                required
                                icon={<User size={20} />}
                            />

                            <Input
                                label="Email"
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="seuemail@exemplo.com"
                                required
                                readOnly={!!inviteToken} // Lock email ONLY if from invite link
                                className={inviteToken ? 'bg-gray-50 cursor-not-allowed' : ''}
                                icon={<Mail size={20} />}
                            />

                            <Input
                                label="Senha"
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Crie uma senha"
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

                            <Input
                                label="Confirmar Senha"
                                id="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirme sua senha"
                                required
                                icon={<Lock size={20} />}
                            />

                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                isLoading={isLoading}
                                className="w-full py-6 text-base mt-2"
                                variant="accent"
                                rightIcon={<ArrowRight size={20} />}
                            >
                                Criar Conta e Acessar
                            </Button>

                            <div className="text-center pt-2 text-sm text-gray-500">
                                Já tem uma conta?{' '}
                                <Link
                                    href="/login"
                                    className="text-emidias-accent hover:text-emidias-accent-dark font-medium transition-colors hover:underline"
                                >
                                    Fazer Login
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
