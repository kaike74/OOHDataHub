'use client';

import { useMemo } from 'react';
import { PluraTable } from '@/components/ui/PluraTable';
import { ColumnDef } from '@tanstack/react-table';
import { Exibidora } from '@/lib/types';
import { api } from '@/lib/api';
import { SafeImage } from '@/components/ui/SafeImage';
import { Building2, Edit2, Trash2, Eye } from 'lucide-react';

interface ExhibitorsTableProps {
    exibidoras: (Exibidora & { totalPontos?: number; cidades?: string[] })[];
    isLoading: boolean;
    onRowClick: (exibidora: Exibidora) => void;
    onEdit: (exibidora: Exibidora, e: React.MouseEvent) => void;
    onDelete: (exibidora: Exibidora, e: React.MouseEvent) => void;
}

export default function ExhibitorsTable({
    exibidoras,
    isLoading,
    onRowClick,
    onEdit,
    onDelete
}: ExhibitorsTableProps) {

    const columns = useMemo<ColumnDef<Exibidora & { totalPontos?: number; cidades?: string[] }>[]>(() => [
        {
            accessorKey: 'logo_r2_key',
            header: 'Logo',
            cell: ({ row }) => (
                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                    {row.original.logo_r2_key ? (
                        <SafeImage
                            src={api.getImageUrl(row.original.logo_r2_key)}
                            alt={row.original.nome}
                            className="w-full h-full object-contain"
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
            header: 'Exibidora',
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
            accessorKey: 'totalPontos',
            header: 'Pontos',
            cell: ({ getValue }) => (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-plura-primary/5 text-plura-primary">
                    {getValue() as number || 0}
                </span>
            ),
            size: 100,
        },
        {
            accessorKey: 'cidades',
            header: 'Atuação',
            cell: ({ getValue }) => {
                const cidades = getValue() as string[] || [];
                return (
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {cidades.slice(0, 2).map((city, i) => (
                            <span key={i} className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                {city}
                            </span>
                        ))}
                        {cidades.length > 2 && (
                            <span className="text-xs text-gray-400 px-1">+{cidades.length - 2}</span>
                        )}
                        {cidades.length === 0 && '-'}
                    </div>
                );
            },
        },
    ], []);

    const renderActions = (item: Exibidora) => [
        {
            label: 'Editar',
            icon: <Edit2 size={18} />,
            onClick: (e?: any) => onEdit(item, e), // Safe fallback for event
            color: 'text-blue-600'
        },
        {
            label: 'Excluir',
            icon: <Trash2 size={18} />,
            onClick: (e?: any) => onDelete(item, e),
            color: 'text-red-600'
        }
    ];

    return (
        <PluraTable
            data={exibidoras}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar exibidora..."
            onRowClick={onRowClick}
            renderActions={renderActions}
        />
    );
}
