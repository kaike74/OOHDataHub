import { useState } from 'react';
import { ProposalTableItem } from './ProposalsTable'; // Import types
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { api } from '@/lib/api';
import { formatDate, formatCurrency } from '@/lib/utils';
import {
    MoreVertical, Calendar, FileText, Coins, Trash2,
    History, Eye, Clock, CheckCircle2, TrendingUp, AlertCircle, MapPin
} from 'lucide-react';
import { useStore } from '@/lib/store';

interface ProposalsKanbanProps {
    data: ProposalTableItem[];
    isLoading: boolean;
    onEdit: (item: ProposalTableItem) => void;
    onDelete: (id: number, e: React.MouseEvent) => void;
    onHistory: (id: number, e: React.MouseEvent) => void;
}

type KanbanColumn = {
    id: string;
    title: string;
    color: string;
    bgConfig: string;
    icon: any;
};

const COLUMNS: KanbanColumn[] = [
    {
        id: 'rascunho',
        title: 'Rascunho',
        color: 'text-gray-600',
        bgConfig: 'bg-gray-50 border-gray-200',
        icon: FileText
    },
    {
        id: 'em_negociacao',
        title: 'Em Negociação',
        color: 'text-blue-600',
        bgConfig: 'bg-blue-50/50 border-blue-100',
        icon: TrendingUp
    },
    {
        id: 'pendente_validacao',
        title: 'Aprovação',
        color: 'text-orange-600',
        bgConfig: 'bg-orange-50/50 border-orange-100',
        icon: Clock
    },
    {
        id: 'aprovada',
        title: 'Aprovada',
        color: 'text-green-600',
        bgConfig: 'bg-green-50/50 border-green-100',
        icon: CheckCircle2
    }
];

export default function ProposalsKanban({
    data,
    isLoading,
    onEdit,
    onDelete,
    onHistory
}: ProposalsKanbanProps) {
    const user = useStore((state) => state.user);

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full p-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex flex-col gap-4">
                        <div className="h-12 bg-gray-100 rounded-lg animate-pulse" />
                        <div className="h-40 bg-gray-50 rounded-xl border border-gray-100 p-4 animate-pulse" />
                        <div className="h-40 bg-gray-50 rounded-xl border border-gray-100 p-4 animate-pulse delay-75" />
                    </div>
                ))}
            </div>
        );
    }

    // Group proposals by status
    const groupedProposals = data.reduce((acc, proposal) => {
        const status = proposal.status || 'rascunho';
        // Normalize status if needed (e.g. handle unknown statuses)
        const columnId = COLUMNS.find(c => c.id === status)?.id || 'rascunho';

        if (!acc[columnId]) acc[columnId] = [];
        acc[columnId].push(proposal);
        return acc;
    }, {} as Record<string, ProposalTableItem[]>);

    return (
        <div className="flex gap-6 h-full overflow-x-auto pb-4 items-start min-w-[1000px]">
            {COLUMNS.map(column => (
                <div
                    key={column.id}
                    className="flex-1 min-w-[280px] flex flex-col h-full max-h-full"
                >
                    {/* Column Header */}
                    <div className={`p-4 rounded-xl border mb-4 flex items-center justify-between shadow-sm backdrop-blur-sm ${column.bgConfig}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-white shadow-sm ${column.color}`}>
                                <column.icon size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-sm ${column.color}`}>{column.title}</h3>
                                <span className="text-xs text-gray-500 font-medium">
                                    {groupedProposals[column.id]?.length || 0} propostas
                                </span>
                            </div>
                        </div>
                        {/* Optional: Add "Add" button for Draft column */}
                    </div>

                    {/* Cards List */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                        {groupedProposals[column.id]?.map((proposal) => (
                            <div
                                key={proposal.id}
                                onClick={() => onEdit(proposal)}
                                className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                            >
                                {/* Proposal Status Strip (Left Border) */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${column.color.replace('text-', 'bg-')}`} />

                                {/* Header: Name and Menu */}
                                <div className="flex items-start justify-between gap-2 mb-3 pl-2">
                                    <h4 className="font-bold text-gray-800 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                                        {proposal.nome}
                                    </h4>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Keep actions clean */}
                                    </div>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-4 pl-2">
                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Valor Total</span>
                                        <span className="text-sm font-bold text-gray-700 block">
                                            {formatCurrency(proposal.total_valor || 0)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                                        <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">Pontos</span>
                                        <span className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                            <MapPin size={12} className="text-gray-400" />
                                            {proposal.total_itens || 0}
                                        </span>
                                    </div>
                                </div>

                                {/* Footer: Date and User */}
                                <div className="pl-2 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                    <div className="flex items-center gap-1.5" title="Criado em">
                                        <Calendar size={12} />
                                        {formatDate(proposal.created_at)}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* History Button - Tiny */}
                                        <button
                                            onClick={(e) => onHistory(proposal.id, e)}
                                            className="p-1.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Ver Histórico"
                                        >
                                            <History size={14} />
                                        </button>

                                        {/* Delete Button - Tiny */}
                                        <button
                                            onClick={(e) => onDelete(proposal.id, e)}
                                            className="p-1.5 hover:bg-red-50 rounded-full text-gray-400 hover:text-red-600 transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {(!groupedProposals[column.id] || groupedProposals[column.id].length === 0) && (
                            <div className="h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-2 bg-gray-50/50">
                                <column.icon size={24} className="opacity-20" />
                                <span className="text-xs font-medium opacity-50">Vazio</span>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
