'use client';

import { useMemo } from 'react';
import { PluraTable } from '@/components/ui/PluraTable';
import { ColumnDef } from '@tanstack/react-table';
import { Cliente } from '@/lib/types';
import { api } from '@/lib/api';
import { SafeImage } from '@/components/ui/SafeImage';
import { Building2, MapPin, Edit2, Trash2 } from 'lucide-react';

interface ClientsTableProps {
    clients: Cliente[];
    isLoading: boolean;
    onRowClick: (client: Cliente) => void;
    onEdit: (client: Cliente, e: React.MouseEvent) => void;
    onDelete: (client: Cliente, e: React.MouseEvent) => void;
}

export default function ClientsTable({ clients, isLoading, onRowClick, onEdit, onDelete }: ClientsTableProps) {

    const columns = useMemo<ColumnDef<Cliente>[]>(() => [
        {
            accessorKey: 'logo_url',
            header: 'Logo',
            cell: ({ row }) => (
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                    {row.original.logo_url ? (
                        <SafeImage
                            src={api.getImageUrl(row.original.logo_url)}
                            alt={row.original.nome}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Building2 size={20} className="text-gray-300" />
                    )}
                </div>
            ),
            size: 80,
            enableSorting: false,
        },
        {
            accessorKey: 'nome',
            header: 'Cliente',
            cell: ({ getValue }) => (
                <div className="font-semibold text-gray-900">
                    {getValue() as string}
                </div>
            ),
        },
        {
            accessorKey: 'cnpj',
            header: 'CNPJ',
            cell: ({ getValue }) => (
                <div className="font-mono text-xs text-gray-500">
                    {getValue() as string || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'segmento',
            header: 'Segmento',
            cell: ({ getValue }) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                    {getValue() as string || 'Geral'}
                </span>
            ),
        },
        {
            id: 'localizacao',
            header: 'Localização',
            cell: ({ row }) => (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin size={14} className="text-gray-400" />
                    <span>
                        {row.original.cidade ? `${row.original.cidade}/${row.original.uf}` : '-'}
                    </span>
                </div>
            ),
        },
    ], []);

    const renderActions = (client: Cliente) => [
        {
            label: 'Editar',
            icon: <Edit2 size={18} />,
            onClick: (e?: any) => onEdit(client, e),
            color: 'text-plura-accent'
        },
        {
            label: 'Excluir',
            icon: <Trash2 size={18} />,
            onClick: (e?: any) => onDelete(client, e),
            color: 'text-red-600'
        }
    ];

    return (
        <PluraTable
            data={clients}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar cliente..."
            onRowClick={onRowClick}
            renderActions={renderActions}
        />
    );
}
