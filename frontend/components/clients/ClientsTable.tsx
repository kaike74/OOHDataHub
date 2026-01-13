'use client';

import { Cliente } from '@/lib/types';
import { api } from '@/lib/api';
import { SafeImage } from '@/components/ui/SafeImage';
import { Building2, MapPin, MoreVertical, Edit2, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ClientsTableProps {
    clients: Cliente[];
    isLoading: boolean;
    onRowClick: (client: Cliente) => void;
    onEdit: (client: Cliente, e: React.MouseEvent) => void;
    onDelete: (client: Cliente, e: React.MouseEvent) => void;
}

export default function ClientsTable({ clients, isLoading, onRowClick, onEdit, onDelete }: ClientsTableProps) {

    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emidias-accent"></div>
            </div>
        );
    }

    if (clients.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 text-center">
                <Building2 size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhum cliente encontrado</h3>
                <p className="text-sm text-gray-500 mt-1">Cadastre novos clientes para vê-los aqui.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[80px]">
                                Logo
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Cliente
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                CNPJ
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Segmento
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Localização
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {clients.map((client) => (
                            <tr
                                key={client.id}
                                onClick={() => onRowClick(client)}
                                className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                                        {client.logo_url ? (
                                            <SafeImage
                                                src={api.getImageUrl(client.logo_url)}
                                                alt={client.nome}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Building2 size={20} className="text-gray-300" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="font-medium text-gray-900 group-hover:text-emidias-primary transition-colors">
                                        {client.nome}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="font-mono text-xs text-gray-500">
                                        {client.cnpj || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {client.segmento || 'Geral'}
                                    </span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                        <MapPin size={14} className="text-gray-400" />
                                        <span>
                                            {client.cidade ? `${client.cidade}/${client.uf}` : '-'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => onEdit(client, e)}
                                            className="p-2 text-gray-400 hover:text-emidias-accent hover:bg-emidias-accent/5 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => onDelete(client, e)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
