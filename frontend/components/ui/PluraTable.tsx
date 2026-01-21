'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
    SortingState,
    ColumnDef,
    Row
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Search, ArrowUpDown, GripVertical, Plus } from 'lucide-react'; // Added icons
import FloatingActionMenu from './FloatingActionMenu';
import { Input } from '@/components/ui/Input';

interface PluraTableProps<T> {
    data: T[];
    columns: ColumnDef<T>[];
    isLoading?: boolean;
    searchPlaceholder?: string;
    onRowClick?: (row: T) => void;
    // Actions are now handled via a special column type or passed as a render prop function
    // But getting the FloatingActionMenu into standard columns is cleaner.
    // However, if we want a standard "Actions" column that is always there:
    renderActions?: (row: T) => { label: string; icon: React.ReactNode; onClick: () => void; color?: string; }[];
    // Drag to fill support
    enableDragToFill?: boolean;
    onDragFill?: (items: T[]) => void;
}

export function PluraTable<T>({
    data,
    columns,
    isLoading = false,
    searchPlaceholder = "Buscar...",
    onRowClick,
    renderActions,
    enableDragToFill = false,
    onDragFill
}: PluraTableProps<T>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [globalFilter, setGlobalFilter] = useState('');

    // Drag-to-fill state (simplified from CartTable)
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        startRowId: string | null;
        currentRowId: string | null;
        columnId: string | null;
        startValue: any;
    }>({ isDragging: false, startRowId: null, currentRowId: null, columnId: null, startValue: null });

    // Inject Actions Column if renderActions provides them
    const tableColumns = useMemo(() => {
        if (!renderActions) return columns;

        return [
            ...columns,
            {
                id: 'actions',
                header: '',
                cell: ({ row }) => {
                    const actions = renderActions(row.original);
                    return (
                        <div className="flex justify-end pr-4">
                            <FloatingActionMenu actions={actions} />
                        </div>
                    );
                },
                size: 60,
                enableSorting: false,
            } as ColumnDef<T>
        ];
    }, [columns, renderActions]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        state: {
            sorting,
            globalFilter,
        },
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    // --- Loading State ---
    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-gray-100 rounded-xl w-full max-w-sm mb-8" />
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-50 rounded-xl w-full" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // --- Empty State ---
    if (data.length === 0) {
        return (
            <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-500">
                <p className="text-lg font-medium text-plura-primary/50">Nenhum registro encontrado</p>
                <p className="text-sm text-gray-400 mt-2">Tente ajustar seus filtros ou adicione novos itens.</p>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full max-w-sm group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-plura-primary transition-colors" size={18} />
                    <Input
                        value={globalFilter}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="pl-10 h-11 bg-white border-transparent hover:border-gray-200 focus:border-plura-primary/20 rounded-2xl shadow-sm hover:shadow transition-all"
                    />
                </div>
                {/* Additional Toolbar Actions could go here */}
            </div>

            {/* Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200/50 overflow-hidden relative">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id} className="bg-plura-primary/5 border-b border-plura-primary/10">
                                    {headerGroup.headers.map(header => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-5 text-left text-xs font-bold text-plura-primary uppercase tracking-wider whitespace-nowrap group select-none first:pl-8 last:pr-8"
                                            style={{ width: header.getSize() !== 150 ? header.getSize() : 'auto' }}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    <ArrowUpDown size={12} className={cn("text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity", header.column.getIsSorted() && "opacity-100 text-plura-primary")} />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className="hover:bg-gray-50 transition-colors group relative"
                                    onClick={() => onRowClick?.(row.original)}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td
                                            key={cell.id}
                                            className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap first:pl-8 last:pr-8"
                                            style={{ width: cell.column.getSize() !== 150 ? cell.column.getSize() : 'auto' }}
                                        >
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-400 px-4">
                <span>{table.getFilteredRowModel().rows.length} registros</span>
            </div>
        </div>
    );
}
