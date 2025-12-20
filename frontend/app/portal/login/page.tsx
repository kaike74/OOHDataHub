'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function PortalLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await api.portalLogin(email, password);
            if (res.token) {
                localStorage.setItem('ooh-client-auth-storage', JSON.stringify({
                    state: {
                        token: res.token,
                        user: res.client_user
                    }
                }));

                router.push('/portal/dashboard');
            } else {
                setError('Credenciais inválidas');
            }
        } catch (err: any) {
            setError(err.message || 'Falha no login');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100">
                <div className="p-8">
                    <div className="text-center mb-8">
                        <div className="h-12 w-12 bg-emidias-primary rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-emidias-primary/20">
                            ODH
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Portal do Cliente</h1>
                        <p className="text-gray-500 mt-2 text-sm">Acesse suas propostas e acompanhe seus projetos</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Email Corporativo"
                            icon={<Mail size={18} />}
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            required
                        />

                        <Input
                            label="Senha"
                            icon={<Lock size={18} />}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            required
                        />

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium animate-in zoom-in">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            isLoading={isLoading}
                            className="w-full mt-2"
                            rightIcon={<ArrowRight size={20} />}
                            variant="primary"
                        >
                            Entrar no Portal
                        </Button>
                    </form>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        &copy; {new Date().getFullYear()} OOH Data Hub. Todos os direitos reservados.
                    </p>
                </div>
            </div>
        </div>
    );
}
