'use client';

import { User as UserType } from '@/lib/types'; // Or generic User type
import { Briefcase, Shield, Mail, Calendar, Trash2, RotateCcw, Share2, MoreVertical, Search, Edit2, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// Redefine locally if needed to match AccountsView data structure exactly
interface UserAccount {
    id: number;
    name: string;
    email: string;
    type: 'internal' | 'external';
    role: string;
    created_at: string;
    shared_count: number;
}

interface AccountsTableProps {
    accounts: UserAccount[];
    isLoading: boolean;
    onRowClick: (account: UserAccount) => void;
    onDelete: (id: number) => void;
    onResetPassword: (id: number) => void;
}

export default function AccountsTable({ accounts, isLoading, onRowClick, onDelete, onResetPassword }: AccountsTableProps) {
    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-plura-accent"></div>
            </div>
        );
    }

    if (accounts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 text-center">
                <div className="p-4 bg-gray-50 rounded-full mb-4">
                    <User size={32} className="text-gray-300" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Nenhum usuário encontrado</h3>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[60px]">
                                Av.
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Nome
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Tipo / Função
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Compartilhamentos
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {accounts.map((user) => {
                            const isInternal = user.type === 'internal';
                            return (
                                <tr
                                    key={user.id}
                                    onClick={() => onRowClick(user)}
                                    className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0 ${isInternal ? 'bg-gradient-to-br from-purple-600 to-indigo-600' : 'bg-gradient-to-br from-plura-primary to-plura-primary-light'}`}>
                                            {(user.name || user.email || '?').charAt(0).toUpperCase()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="font-medium text-gray-900 group-hover:text-plura-primary transition-colors">
                                            {user.name || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {user.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        {isInternal ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                <Shield size={10} className="mr-1" /> Interno ({user.role})
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                <Briefcase size={10} className="mr-1" /> Externo
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap">
                                        {user.shared_count > 0 ? (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                <Share2 size={10} className="mr-1" /> {user.shared_count}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                onClick={() => onResetPassword(user.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-plura-accent hover:bg-plura-accent/5"
                                                title="Resetar Senha"
                                            >
                                                <RotateCcw size={16} />
                                            </Button>
                                            <Button
                                                onClick={() => onDelete(user.id)}
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                                                title="Excluir Conta"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
