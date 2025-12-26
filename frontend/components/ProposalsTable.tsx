import { useStore } from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FileText, MapPin, Coins, History, Trash2, Building2, Pencil, ArrowUpDown, Eye } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button'; // Assuming Button is available if needed, though primarily using icon buttons here
import { useState } from 'react';

// Assuming StatusBadge and formatAOA are defined elsewhere or need to be added.
// For now, I'll assume they are imported or defined in a way that makes the code syntactically correct.
// If StatusBadge is a component, it needs to be imported. If formatAOA is a utility, it needs to be imported.
// Since they are not provided in the original or the change, I'll add placeholder imports for them.
// If they are meant to be internal to this file, they would need to be defined here.
// Given the context, they are likely external utilities/components.
// For the purpose of making the provided code syntactically correct, I will add dummy definitions if not imported.
// However, the instruction is to make the change faithfully and without unrelated edits.
// The user provided a full component replacement, which includes these new elements.
// I will assume `StatusBadge` and `formatAOA` are available in the environment.
// If not, the user would need to provide their definitions or imports.
// For now, I'll add dummy definitions to ensure syntactic correctness for the output.

// Dummy StatusBadge component for syntactic correctness if not imported
const StatusBadge = ({ status }: { status: string }) => {
    let bgColor, textColor, dotColor;
    switch (status) {
        case 'aprovada':
            bgColor = 'bg-green-100';
            textColor = 'text-green-700';
            dotColor = 'bg-green-500';
            break;
        case 'em_negociacao':
            bgColor = 'bg-blue-100';
            textColor = 'text-blue-700';
            dotColor = 'bg-blue-500';
            break;
        default:
            bgColor = 'bg-yellow-100';
            textColor = 'text-yellow-700';
            dotColor = 'bg-yellow-500';
    }
    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${bgColor} ${textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {status?.replace('_', ' ') || 'Rascunho'}
        </span>
    );
};


export interface ProposalTableItem {
    id: number;
    nome: string;
    client_name?: string; // Optional (not needed if showClientColumn=false)
    client_logo?: string | null; // Allow null to match DB/API types
    id_cliente: number; // Add this
    created_at: string;
    updated_at?: string;
    status: string;
    comissao: string | 'V2' | 'V3' | 'V4'; // Union, usually string from DB
    total_itens?: number;
    total_valor?: number;
    shared_with?: string | Array<{ email: string; name: string }>; // Optional
    creator_email?: string;
    can_edit_metadata?: number; // 0 or 1
}

export interface ProposalsTableProps {
    data: ProposalTableItem[]; // User 'data' to match consumers
    isLoading: boolean;
    showClientColumn?: boolean;
    onView?: (id: number) => void; // Optional
    onDelete: (id: number, e?: any) => void;
    onEdit: (item: ProposalTableItem) => void;
    onRowClick?: (item: ProposalTableItem) => void; // Compat
    onHistory?: (id: number, e: React.MouseEvent) => void; // Compat
    emptyMessage?: string; // Compat
    emptyActionLabel?: string; // Compat
    onEmptyAction?: () => void; // Compat
}

export default function ProposalsTable({
    data,
    isLoading,
    showClientColumn = true,
    onView,
    onDelete,
    onEdit,
    onRowClick,
    onHistory,
    emptyMessage,
    emptyActionLabel,
    onEmptyAction
}: ProposalsTableProps) {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

    // Map data to local var for sorting
    const proposals = data || [];

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedProposals = [...proposals].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aValue: any = (a as any)[key];
        let bValue: any = (b as any)[key];

        if (key === 'total_valor' || key === 'total_itens') {
            aValue = Number(aValue);
            bValue = Number(bValue);
        }

        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emidias-accent"></div>
            </div>
        );
    }

    if (proposals.length === 0) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-500">
                <FileText size={48} className="mb-4 text-gray-300" />
                <p className="text-lg font-medium">Nenhuma proposta encontrada</p>
                <p className="text-sm">Crie uma nova proposta para começar.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Status
                            </th>
                            {showClientColumn && (
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Cliente
                                </th>
                            )}
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={() => handleSort('nome')}
                            >
                                <div className="flex items-center gap-1">
                                    Proposta
                                    <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Criado por
                            </th>
                            {showClientColumn && (
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Comissão
                                </th>
                            )}
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={() => handleSort('created_at')}
                            >
                                <div className="flex items-center gap-1">
                                    Criado em
                                    <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Última Edição
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Itens
                            </th>
                            <th
                                className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                                onClick={() => handleSort('total_valor')}
                            >
                                <div className="flex items-center gap-1">
                                    Valor Total
                                    <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedProposals.map((item) => {
                            const showCommission = !showClientColumn; // Logic: Clients don't see Client Column, but also don't see Commission.
                            // Wait, logic inversion:
                            // PropostasView: isClient ? false : true -> showClientColumn
                            // If user is INTERNAL, showClientColumn=True.
                            // If user is CLIENT, showClientColumn=False.

                            // If showClientColumn (Internal): Show Commission? YES.
                            // If !showClientColumn (Client): Show Commission? NO.
                            // The prop logic passed from parent hides commission for clients separately via CSS/Layout or checking role?
                            // Actually parent hides the Header.
                            // Let's rely on props or item properties if needed.

                            return (
                                <tr
                                    key={item.id}
                                    className="hover:bg-gray-50/80 transition-colors group"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={item.status} />
                                    </td>

                                    {showClientColumn && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs overflow-hidden">
                                                    {item.client_logo ? (
                                                        <SafeImage src={item.client_logo} alt={item.client_name || '-'} className="w-full h-full object-cover" />
                                                    ) : (
                                                        (item.client_name || '?').charAt(0)
                                                    )}
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{item.client_name || 'Sem Nome'}</span>
                                            </div>
                                        </td>
                                    )}

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{item.nome}</div>
                                    </td>

                                    {/* Creator Email */}
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{item.creator_email || '-'}</div>
                                    </td>

                                    {/* Commission - Only show if showing client column (internal) or forced?
                                    Actually logic from parent: isClient -> showClientColumn=false.
                                    So if showClientColumn is true, it is internal, so show commission.
                                */}
                                    {showClientColumn && (
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {item.comissao || '-'}
                                            </span>
                                        </td>
                                    )}

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">
                                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                            <MapPin size={16} className="text-gray-400" />
                                            <span>{item.total_itens || 0}</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {formatCurrency(item.total_valor || 0)}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {/* View Button - Always Visible */}
                                            <button
                                                onClick={() => {
                                                    if (onView) onView(item.id);
                                                    else if (onRowClick) onRowClick(item);
                                                }}
                                                className="p-2 text-gray-400 hover:text-emidias-accent hover:bg-emidias-accent/5 rounded-lg transition-colors"
                                                title="Ver no Mapa"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {/* Edit Button - Conditional Visibility */}
                                            {/* Show IF can_edit_metadata is 1 OR undefined (legacy/safeguard) */}
                                            {/* Assuming 1 = true, 0 = false. Default to true if missing? No, user wants restriction. */}
                                            {(item.can_edit_metadata === 1) && (
                                                <button
                                                    onClick={() => onEdit(item)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar Metadados"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                            )}

                                            {/* History Button (Legacy Support) */}
                                            {onHistory && (
                                                <button
                                                    onClick={(e) => onHistory(item.id, e)}
                                                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Histórico"
                                                >
                                                    <History size={18} />
                                                </button>
                                            )}

                                            <button
                                                onClick={(e) => onDelete(item.id, e)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Excluir Proposta"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
