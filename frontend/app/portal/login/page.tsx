'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, Mail, Lock, ArrowRight } from 'lucide-react';

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
                // Token is stored in localStorage by api.ts helper if response structure matches, 
                // but api.portalLogin returns JSON.
                // We need to store it manually because api.ts logic for getToken reads from storage, 
                // but doesn't write. The main app likely uses a store for this.
                // For portal, we'll manually set the localStorage key we defined in api.ts

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
                        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl shadow-lg shadow-blue-600/20">
                            ODH
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Portal do Cliente</h1>
                        <p className="text-gray-500 mt-2 text-sm">Acesse suas propostas e acompanhe seus projetos</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 uppercase tracking-wide">Senha</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                                    placeholder="Sua senha temporária"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium animate-in zoom-in">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                            Entrar no Portal
                        </button>
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
