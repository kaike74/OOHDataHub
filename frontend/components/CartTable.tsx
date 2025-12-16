'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { PropostaItem } from '@/lib/types';
import {
    Trash2,
    Settings,
    MoreHorizontal,
    ChevronDown,
    ArrowUpDown,
    Check,
    X,
    Calendar as CalendarIcon
} from 'lucide-react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    ColumnDef,
    flexRender,
    SortingState,
    VisibilityState,
    RowSelectionState,
    ColumnResizeMode,
} from '@tanstack/react-table';

// Helper for formatted money
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export default function CartTable() {
    const selectedProposta = useStore((state) => state.selectedProposta);
    const refreshProposta = useStore((state) => state.refreshProposta);
    const [itens, setItens] = useState<PropostaItem[]>([]);
    const [loading, setLoading] = useState(false);

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnSizing, setColumnSizing] = useState({});

    // UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Batch Actions State
    const [isBatchPeriodOpen, setIsBatchPeriodOpen] = useState(false);
    const [batchPeriodValue, setBatchPeriodValue] = useState('');

    // Initial Load
    useEffect(() => {
        if (selectedProposta) {
            setItens(selectedProposta.itens || []);
        } else {
            setItens([]);
        }
    }, [selectedProposta]);

    // Optimistic Update Helper
    const updateItem = useCallback(async (id: number, field: string, value: any) => {
        // Immediate local update
        const updatedItens = itens.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        );
        setItens(updatedItens);

        // Propagate to global store
        refreshProposta({ ...selectedProposta!, itens: updatedItens });

        // Debounced API call could live here, but for now we do direct updates
        try {
            await api.updateCart(selectedProposta!.id, updatedItens);
        } catch (error) {
            console.error("Failed to update item", error);
        }
    }, [itens, refreshProposta, selectedProposta]);

    const removeItem = useCallback(async (id: number) => {
        // Optimistic remove
        const updatedItens = itens.filter(item => item.id !== id);
        setItens(updatedItens);

        refreshProposta({ ...selectedProposta!, itens: updatedItens });

        try {
            await api.updateCart(selectedProposta!.id, updatedItens);
        } catch (error) {
            console.error("Failed to remove item", error);
            // Revert logic would go here
            setItens(itens); // revert
        }
    }, [itens, refreshProposta, selectedProposta]);

    const applyBatchPeriod = useCallback(async () => {
        if (!batchPeriodValue) return;

        const selectedIds = Object.keys(rowSelection).map(Number);
        if (selectedIds.length === 0) return;

        // Optimistic update
        const updatedItens = itens.map(item => {
            if (selectedIds.includes(item.id)) {
                return { ...item, periodo: batchPeriodValue };
            }
            return item;
        });

        setItens(updatedItens);
        setIsBatchPeriodOpen(false);
        setRowSelection({}); // Clear selection after apply

        // Propagate
        refreshProposta({ ...selectedProposta!, itens: updatedItens });

        try {
            await api.updateCart(selectedProposta!.id, updatedItens);
        } catch (error) {
            console.error("Failed to batch update", error);
        }
    }, [batchPeriodValue, itens, rowSelection, refreshProposta, selectedProposta]);


    // Columns Definition
    const columns = useMemo<ColumnDef<PropostaItem>[]>(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <div className="px-1">
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                        className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="px-1">
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={(e) => row.toggleSelected(!!e.target.checked)}
                        className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                </div>
            ),
            size: 40,
            enableResizing: false,
        },
        {
            accessorKey: 'codigo_ooh',
            header: 'Código',
            size: 100,
            cell: ({ row }) => <span className="font-mono text-xs">{row.original.codigo_ooh}</span>
        },
        {
            accessorKey: 'cidade',
            header: 'Cidade/UF',
            size: 140,
            cell: ({ row }) => <span>{row.original.cidade}/{row.original.uf}</span>
        },
        {
            accessorKey: 'endereco',
            header: 'Endereço',
            size: 250,
            cell: ({ row }) => <span className="truncate block" title={row.original.endereco}>{row.original.endereco}</span>
        },
        {
            accessorKey: 'bairro',
            header: 'Bairro',
            size: 120,
        },
        {
            accessorKey: 'exibidora',
            header: 'Exibidora',
            size: 120,
        },
        {
            accessorKey: 'tipo',
            header: 'Tipo',
            size: 100,
        },
        {
            header: 'Periodo',
            accessorKey: 'periodo',
            size: 180,
            cell: ({ row }) => (
                <input
                    className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 text-sm"
                    value={row.original.periodo || ''}
                    placeholder="DD/MM/AAAA - DD/MM/AAAA"
                    onChange={(e) => updateItem(row.original.id, 'periodo', e.target.value)}
                />
            )
        },
        {
            header: 'Valor Tabela',
            accessorKey: 'valor',
            size: 120,
            cell: ({ row }) => (
                <div className="text-right">
                    {formatCurrency(row.original.valor || 0)}
                </div>
            )
        },
        {
            header: 'Desc %',
            accessorKey: 'desconto_padrao',
            size: 80,
            cell: ({ row }) => (
                <div className="flex items-center justify-end">
                    <input
                        type="number"
                        className="w-16 bg-transparent border-none text-right focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                        value={row.original.desconto_padrao || 0}
                        onChange={(e) => updateItem(row.original.id, 'desconto_padrao', Number(e.target.value))}
                    />
                    <span className="ml-1 text-gray-500">%</span>
                </div>
            )
        },
        {
            header: 'Total Invest.',
            accessorKey: 'total_investimento',
            size: 130,
            cell: ({ row }) => (
                <div className="text-right font-semibold text-gray-900">
                    {formatCurrency(row.original.total_investimento || 0)}
                </div>
            )
        },
        {
            id: 'actions',
            size: 50,
            enableResizing: false,
            cell: ({ row }) => (
                <div className="flex justify-center">
                    <button
                        onClick={() => removeItem(row.original.id)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Remover Item"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ], [updateItem, removeItem]);


    const table = useReactTable({
        data: itens,
        columns,
        state: {
            sorting,
            columnVisibility,
            rowSelection,
            columnSizing,
        },
        columnResizeMode: 'onChange',
        enableRowSelection: true,
        getRowId: row => String(row.id),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (!selectedProposta) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 text-gray-500">
                Selecione uma proposta para ver o carrinho
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-white border-t border-gray-200 shadow-up-lg">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <h3 className="font-semibold text-gray-800 text-sm">Itens ({itens.length})</h3>

                    {/* Bulk Actions */}
                    {Object.keys(rowSelection).length > 0 && (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md animate-in fade-in slide-in-from-left-2 shadow-sm border border-blue-100 relative">
                            <span className="text-xs font-bold">{Object.keys(rowSelection).length}</span>
                            <div className="h-4 w-px bg-blue-200 mx-1" />

                            {/* Apply Period Trigger */}
                            <button
                                onClick={() => setIsBatchPeriodOpen(true)}
                                className="text-xs font-medium hover:text-blue-900 flex items-center gap-1 transition-colors relative"
                            >
                                <CalendarIcon size={14} /> Aplicar Período
                            </button>

                            {/* Apply Period Popover */}
                            {isBatchPeriodOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsBatchPeriodOpen(false)} />
                                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50 w-64 animate-in fade-in zoom-in-95">
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Novo Período para selecionados</label>
                                        <input
                                            autoFocus
                                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                            placeholder="DD/MM/AAAA - DD/MM/AAAA"
                                            value={batchPeriodValue}
                                            onChange={(e) => setBatchPeriodValue(e.target.value)}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setIsBatchPeriodOpen(false)}
                                                className="px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={applyBatchPeriod}
                                                className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded font-medium"
                                            >
                                                Aplicar
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="h-4 w-px bg-blue-200 mx-1" />

                            {/* Remove Selected */}
                            <button
                                onClick={() => {
                                    // Remove selected logic
                                    const selectedIds = Object.keys(rowSelection).map(Number);
                                    const updatedItens = itens.filter(item => !selectedIds.includes(item.id));
                                    setItens(updatedItens);
                                    setRowSelection({});
                                    refreshProposta({ ...selectedProposta!, itens: updatedItens });
                                    api.updateCart(selectedProposta!.id, updatedItens).catch(console.error);
                                }}
                                className="text-xs font-medium hover:text-red-700 flex items-center gap-1 text-red-600 transition-colors"
                            >
                                <Trash2 size={14} /> Remover
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 relative">
                    {/* Settings Toggle */}
                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`p-1.5 rounded-md transition-all ${isSettingsOpen ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        title="Configurações da tabela"
                    >
                        <Settings size={16} />
                    </button>

                    {/* Settings Popover */}
                    {isSettingsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Colunas Visíveis</h4>
                                <div className="max-h-60 overflow-y-auto px-1">
                                    {table.getAllLeafColumns().map(column => {
                                        if (!column.id) return null;
                                        return (
                                            <div
                                                key={column.id}
                                                className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                                                onClick={column.getToggleVisibilityHandler()}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${column.getIsVisible() ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                                                    {column.getIsVisible() && <Check size={10} strokeWidth={3} />}
                                                </div>
                                                <span className="text-sm text-gray-700 truncate capitalize select-none">
                                                    {(column.columnDef.header as string) || column.id}
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto relative bg-gray-50/50">
                <div
                    className="min-w-full inline-block align-top"
                    style={{ width: table.getTotalSize() }}
                >
                    {/* Head */}
                    <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 font-semibold text-xs text-gray-500 uppercase text-left flex shadow-sm">
                        {table.getHeaderGroups().map(headerGroup => (
                            <div key={headerGroup.id} className="flex flex-row w-full">
                                {headerGroup.headers.map(header => (
                                    <div
                                        key={header.id}
                                        className="relative group px-3 py-2.5 border-r border-gray-200 last:border-r-0 flex items-center justify-between select-none bg-gray-50"
                                        style={{ width: header.getSize(), flex: `0 0 ${header.getSize()}px` }}
                                    >
                                        <div
                                            className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 truncate w-full"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: <ArrowUpDown size={12} className="text-blue-600 shrink-0" />,
                                                desc: <ArrowUpDown size={12} className="text-blue-600 rotate-180 shrink-0" />,
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>

                                        {/* Resize Handle */}
                                        {header.column.getCanResize() && (
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity z-20 ${header.column.getIsResizing() ? 'bg-blue-500 opacity-100' : ''}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="divide-y divide-gray-100 bg-white">
                        {table.getRowModel().rows.map(row => (
                            <div
                                key={row.id}
                                className={`flex items-center hover:bg-blue-50/20 transition-colors group ${row.getIsSelected() ? 'bg-blue-50/60' : ''}`}
                            >
                                {row.getVisibleCells().map(cell => (
                                    <div
                                        key={cell.id}
                                        className="px-3 py-2.5 text-sm text-gray-700 border-r border-transparent group-hover:border-gray-100 truncate flex items-center"
                                        style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
                                    >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {table.getRowModel().rows.length === 0 && (
                            <div className="p-12 text-center text-gray-400 text-sm w-full flex flex-col items-center gap-3">
                                <div className="p-3 bg-gray-100 rounded-full">
                                    <Settings size={24} className="text-gray-300" />
                                </div>
                                <span>Nenhum ponto no carrinho.</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Summary */}
            <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between text-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                <div className="text-gray-500 text-xs">
                    {itens.length} pontos listados
                </div>
                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Investimento Total</span>
                        <span className="font-bold text-lg text-emerald-600 leading-none">
                            {formatCurrency(itens.reduce((sum, item) => sum + (item.total_investimento || item.valor || 0), 0))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
