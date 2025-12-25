import { useStore } from '@/lib/store';
import { formatDate, formatCurrency } from '@/lib/utils';
import { FileText, MapPin, Coins, History, Trash2, Building2, Pencil } from 'lucide-react';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button'; // Assuming Button is available if needed, though primarily using icon buttons here

export interface ProposalTableItem {
    id: number;
    id_cliente: number;
    nome: string;
    status: string;
    created_at: string;
    updated_at?: string;
    comissao: string | 'V2' | 'V3' | 'V4';
    total_itens?: number;
    total_valor?: number;
    client_name?: string; // Optional, for admin view
    client_logo?: string | null; // Optional, for admin view
    creator_email?: string;
    created_by?: number | null;
    shared_with?: Array<{ email: string }>;
}

interface ProposalsTableProps {
    data: ProposalTableItem[];
    isLoading: boolean;
    showClientColumn?: boolean;
    onEdit: (item: ProposalTableItem) => void;
    onRowClick: (item: ProposalTableItem) => void;
    onDelete: (id: number, e: React.MouseEvent) => void;
    onHistory?: (id: number, e: React.MouseEvent) => void;
    emptyMessage?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
}

export default function ProposalsTable({
    data,
    isLoading,
    showClientColumn = false,
    onEdit,
    onRowClick,
    onDelete,
    onHistory,
    emptyMessage = "Nenhuma proposta encontrada",
    emptyActionLabel,
    onEmptyAction
}: ProposalsTableProps) {
    const user = useStore((state) => state.user);
    const isClient = user?.role === 'client';

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200 animate-in fade-in zoom-in duration-500">
                <FileText className="mx-auto text-gray-300 mb-3" size={48} />
                <p className="text-gray-500 font-medium mb-4">{emptyMessage}</p>
                {emptyActionLabel && onEmptyAction && (
                    <button
                        onClick={onEmptyAction}
                        className="text-emidias-accent font-medium hover:underline flex items-center gap-2"
                    >
                        {emptyActionLabel}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in-up duration-500">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Status</th>
                            {showClientColumn && <th className="px-6 py-4">Cliente</th>}
                            <th className="px-6 py-4">Proposta</th>
                            {!isClient && <th className="px-6 py-4">Comissão</th>}
                            <th className="px-6 py-4">Criado em</th>
                            <th className="px-6 py-4">Última Edição</th>
                            <th className="px-6 py-4 text-center">Pontos</th>
                            <th className="px-6 py-4 text-right">Valor</th>
                            <th className="px-6 py-4 text-right"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((item) => (
                            <tr
                                key={item.id}
                                onClick={() => onRowClick(item)}
                                className="group hover:bg-emidias-accent/5 transition-colors cursor-pointer"
                            >
                                {/* Status */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5 ${item.status === 'aprovada'
                                        ? 'bg-green-100 text-green-700'
                                        : item.status === 'em_negociacao'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'aprovada' ? 'bg-green-500' :
                                            item.status === 'em_negociacao' ? 'bg-blue-500' : 'bg-yellow-500'
                                            }`} />
                                        {item.status?.replace('_', ' ') || 'Rascunho'}
                                    </span>
                                </td>

                                {/* Client (Optional) */}
                                {showClientColumn && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 p-1 flex items-center justify-center overflow-hidden">
                                                {item.client_logo ? (
                                                    <SafeImage
                                                        src={api.getImageUrl(item.client_logo)}
                                                        alt={item.client_name || 'Cliente'}
                                                        className="w-full h-full object-contain"
                                                    />
                                                ) : (
                                                    <Building2 size={14} className="text-gray-400" />
                                                )}
                                            </div>
                                            <span className="text-sm font-medium text-gray-900 line-clamp-1">
                                                {item.client_name || '-'}
                                            </span>
                                        </div>
                                    </td>
                                )}

                                {/* Proposta Name */}
                                <td className="px-6 py-4">
                                    <div className="font-semibold text-gray-900 group-hover:text-emidias-accent transition-colors line-clamp-1">
                                        {item.nome}
                                    </div>
                                    {/* Mobile/Compact: Show creator if available */}
                                    {item.creator_email && !showClientColumn && (
                                        <div className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">
                                            Criado por: {item.creator_email.split('@')[0]}
                                        </div>
                                    )}
                                </td>

                                {/* Comissao (Internal Only) */}
                                {!isClient && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-mono text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                            {item.comissao || '-'}
                                        </span>
                                    </td>
                                )}

                                {/* Created At */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(item.created_at)}
                                </td>

                                {/* Updated At */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.updated_at ? formatDate(item.updated_at) : '-'}
                                </td>

                                {/* Pontos */}
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700">
                                        <MapPin size={14} className="text-gray-400" />
                                        {item.total_itens || 0}
                                    </div>
                                </td>

                                {/* Valor */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(item.total_valor || 0)}
                                    </span>
                                </td>

                                {/* Actions */}
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-100 group-hover:opacity-100 transition-opacity">
                                        {/* Edit Action - Primary */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEdit(item);
                                            }}
                                            className="p-2 text-gray-500 hover:text-emidias-accent hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                            title="Editar proposta"
                                        >
                                            <Pencil size={16} />
                                        </button>

                                        {onHistory && (
                                            <button
                                                onClick={(e) => onHistory(item.id, e)}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                                title="Histórico de alterações"
                                            >
                                                <History size={16} />
                                            </button>
                                        )}

                                        <button
                                            onClick={(e) => onDelete(item.id, e)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                            title="Mover para lixeira"
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
