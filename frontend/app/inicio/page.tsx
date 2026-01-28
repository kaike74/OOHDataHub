'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import MainLayout from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { ArrowRight, FileText, Users, MapPin, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { ModalStackManager } from '@/app/mapa/ModalStackManager';

interface DashboardStats {
    propostas_count: number;
    clientes_count: number;
    itens_ativos_count: number;
    propostas_aprovadas_count: number;
}

export default function InicioPage() {
    const user = useStore(state => state.user);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                // Assuming api.getStats() exists and returns strictly what we need or more.
                // Since TypeScript might not know the return type, we cast or just define the state type.
                const data = await api.getStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to load stats', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            loadStats();
        }
    }, [user]);

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto p-6 md:p-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    Olá, {user?.name?.split(' ')[0] || 'Bem-vindo'}!
                </h1>
                <p className="text-white/70 mb-8">
                    Aqui está um resumo das suas atividades recentes no OOH Data Hub.
                </p>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-500 text-sm font-medium">Propostas Totais</span>
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                <FileText size={18} />
                            </div>
                        </div>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">{stats?.propostas_count || 0}</div>
                        )}
                    </Card>

                    <Card className="p-4 flex flex-col justify-between items-start hover:shadow-md transition-shadow">
                        <div className="w-full flex justify-between items-start mb-2">
                            <span className="text-gray-500 text-sm font-medium">Propostas Aprovadas</span>
                            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                                <CheckCircle size={18} />
                            </div>
                        </div>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">{stats?.propostas_aprovadas_count || 0}</div>
                        )}
                    </Card>

                    <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-500 text-sm font-medium">Carteira de Clientes</span>
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                <Users size={18} />
                            </div>
                        </div>
                        {loading ? (
                            <Skeleton className="h-8 w-16" />
                        ) : (
                            <div className="text-2xl font-bold text-gray-900">{stats?.clientes_count || 0}</div>
                        )}
                    </Card>

                    {user?.type === 'internal' && (
                        <Card className="p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-gray-500 text-sm font-medium">Pontos Ativos</span>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <MapPin size={18} />
                                </div>
                            </div>
                            {loading ? (
                                <Skeleton className="h-8 w-16" />
                            ) : (
                                <div className="text-2xl font-bold text-gray-900">{stats?.itens_ativos_count || 0}</div>
                            )}
                        </Card>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Quick Stats / Navigation */}
                    <Link href="/propostas" className="block group">
                        <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Propostas</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">Ver Lista</h3>
                                </div>
                                <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-100 transition-colors">
                                    <FileText size={20} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-blue-600 font-medium">
                                Acessar propostas <ArrowRight size={16} className="ml-1" />
                            </div>
                        </Card>
                    </Link>

                    <Link href="/clientes" className="block group">
                        <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Clientes</p>
                                    <h3 className="text-2xl font-bold text-gray-900 mt-1">Gerenciar</h3>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg text-purple-600 group-hover:bg-purple-100 transition-colors">
                                    <Users size={20} />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm text-purple-600 font-medium">
                                Ver carteira <ArrowRight size={16} className="ml-1" />
                            </div>
                        </Card>
                    </Link>

                    {user?.type === 'internal' && (
                        <Link href="/mapa" className="block group">
                            <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Mapa</p>
                                        <h3 className="text-2xl font-bold text-gray-900 mt-1">Planejamento</h3>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg text-green-600 group-hover:bg-green-100 transition-colors">
                                        <MapPin size={20} />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center text-sm text-green-600 font-medium">
                                    Explorar pontos <ArrowRight size={16} className="ml-1" />
                                </div>
                            </Card>
                        </Link>
                    )}
                </div>
            </div>

            <ModalStackManager />
        </MainLayout>
    );
}
