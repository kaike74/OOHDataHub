'use client';

import { useMemo } from 'react';
import { PluraTable } from '@/components/ui/PluraTable';
import { ColumnDef } from '@tanstack/react-table';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FileText, MapPin, Eye, Trash2, Pencil, History, User } from 'lucide-react'; // Added User icon
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/StatusBadge';

// --- Types ---
export interface ProposalTableItem {
    id: number;
    nome: string;
    client_name?: string;
    client_logo?: string | null;
    id_cliente: number;
    created_at: string;
    updated_at?: string;
    status: string;
    comissao: string | 'V2' | 'V3' | 'V4';
    total_itens?: number;
    total_valor?: number;
    shared_with?: string | Array<{ email: string; name: string }>;
    creator_email?: string;
    can_edit_metadata?: number;
}

export interface ProposalsTableProps {
    data: ProposalTableItem[];
    isLoading: boolean;
    showClientColumn?: boolean;
    onView?: (id: number) => void;
    onDelete: (id: number, e?: any) => void;
    onEdit: (item: ProposalTableItem) => void;
    onRowClick?: (item: ProposalTableItem) => void;
    onHistory?: (id: number, e: React.MouseEvent) => void;
    emptyMessage?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
}

// --- Components ---


export default function ProposalsTable({
    data,
    isLoading,
    showClientColumn = true,
    onView,
    onDelete,
    onEdit,
    onRowClick,
    onHistory,
}: ProposalsTableProps) {

    // Define Columns
    const columns = useMemo<ColumnDef<ProposalTableItem>[]>(() => {
        const cols: ColumnDef<ProposalTableItem>[] = [
            {
                accessorKey: 'status',
                header: 'Status',
                cell: ({ getValue }) => <StatusBadge status={getValue() as string} />,
                size: 140,
            },
        ];

        if (showClientColumn) {
            cols.push({
                accessorKey: 'client_name',
                header: 'Cliente',
                cell: ({ row }) => (
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs overflow-hidden shadow-sm">
                            {row.original.client_logo ? (
                                <SafeImage
                                    src={row.original.client_logo.startsWith('http') ? row.original.client_logo : api.getImageUrl(row.original.client_logo)}
                                    alt={row.original.client_name || '-'}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                (row.original.client_name || '?').charAt(0)
                            )}
                        </div>
                        <span className="font-semibold text-gray-900">{row.original.client_name || 'Sem Nome'}</span>
                    </div>
                ),
            });
        }

        cols.push(
            {
                accessorKey: 'nome',
                header: 'Proposta',
                cell: ({ getValue }) => <div className="font-bold text-gray-900">{getValue() as string}</div>,
            },
            {
                accessorKey: 'creator_email',
                header: 'Criado Por',
                cell: ({ getValue }) => (
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                        <div className="p-1 bg-gray-100 rounded-full">
                            <User size={12} />
                        </div>
                        {getValue() as string || '-'}
                    </div>
                ),
            }
        );

        if (showClientColumn) {
            cols.push({
                accessorKey: 'comissao',
                header: 'Comissão',
                cell: ({ getValue }) => (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {getValue() as string || '-'}
                    </span>
                ),
                size: 100,
            });
        }

        cols.push(
            {
                accessorKey: 'created_at',
                header: 'Criado Em', // Standardize Header Case
                cell: ({ getValue }) => <span className="text-gray-500 text-sm">{new Date(getValue() as string).toLocaleDateString()}</span>,
            },
            {
                accessorKey: 'total_itens',
                header: 'Itens',
                cell: ({ getValue }) => (
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                        <MapPin size={14} className="text-plura-primary/40" />
                        <span>{getValue() as number || 0}</span>
                    </div>
                ),
                size: 100,
            },
            {
                accessorKey: 'total_valor',
                header: 'Valor Total',
                cell: ({ getValue }) => (
                    <div className="font-black text-plura-primary tracking-tight">
                        {formatCurrency(getValue() as number || 0)}
                    </div>
                ),
            }
        );

        return cols;
    }, [showClientColumn]);

    // Define Actions (Radial Menu)
    const renderActions = (item: ProposalTableItem) => {
        const actions = [
            {
                label: 'Visualizar',
                icon: <Eye size={18} />,
                onClick: () => {
                    if (onView) onView(item.id);
                    else if (onRowClick) onRowClick(item);
                },
                color: 'text-gray-700'
            }
        ];

        // Edit
        if (item.can_edit_metadata === 1) {
            actions.push({
                label: 'Editar',
                icon: <Pencil size={18} />,
                onClick: () => onEdit(item),
                color: 'text-blue-600'
            });
        }

        // History
        if (onHistory) {
            actions.push({
                label: 'Histórico',
                icon: <History size={18} />,
                onClick: () => onHistory(item.id, {} as any), // Mock event
                color: 'text-purple-600'
            });
        }

        // Delete (Always last for radial positioning mostly)
        actions.push({
            label: 'Excluir',
            icon: <Trash2 size={18} />,
            onClick: () => onDelete(item.id),
            color: 'text-red-600'
        });

        return actions;
    };

    return (
        <PluraTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            searchPlaceholder="Buscar proposta, cliente..."
            renderActions={renderActions}
            onRowClick={onRowClick || ((item) => onView && onView(item.id))}
        />
    );
}
