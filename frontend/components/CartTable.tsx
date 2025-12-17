'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Proposta, PropostaItem } from '@/lib/types';
import {
    Trash2,
    Settings,
    ChevronDown,
    ChevronRight,
    ArrowUpDown,
    Check,
    Calendar as CalendarIcon,
    Layers,
    Hash,
    Type,
    MapPin,
    Box,
    Ruler,
    DollarSign,
    Globe,
    Building2,
    StickyNote
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
} from '@tanstack/react-table';

// Helper for formatted money
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
}

const formatDecimal = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

// Helper to handle Enter to move to next row, Tab for regular behavior
const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, moveToNext?: () => void) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
        if (moveToNext) {
            setTimeout(() => moveToNext(), 10);
        }
    }
}

interface CartTableProps {
    proposta?: Proposta;
    isOpen: boolean;
    onToggle: () => void;
}

export default function CartTable({ isOpen, onToggle }: CartTableProps) {
    const selectedProposta = useStore((state) => state.selectedProposta);
    const refreshProposta = useStore((state) => state.refreshProposta);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const pontos = useStore((state) => state.pontos);

    const [itens, setItens] = useState<PropostaItem[]>([]);

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnSizing, setColumnSizing] = useState({});

    // UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
    const [focusedCell, setFocusedCell] = useState<{ rowId: number | null; columnId: string | null }>({ rowId: null, columnId: null });

    // Grouping State
    type GroupByField = 'none' | 'pais' | 'uf' | 'cidade' | 'exibidora_nome';
    const [groupBy, setGroupBy] = useState<GroupByField>('none');
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    // Drag-to-Fill State
    const [dragState, setDragState] = useState<{
        isDragging: boolean;
        startRowId: number | null;
        currentRowId: number | null;
        columnKey: string | null;
        startValue: any;
    }>({ isDragging: false, startRowId: null, currentRowId: null, columnKey: null, startValue: null });

    // Height Resizing State
    const [tableHeight, setTableHeight] = useState(500);
    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);

    // Initial Load
    useEffect(() => {
        if (selectedProposta) {
            setItens(selectedProposta.itens || []);
            console.log('🛒 CartTable recebeu itens:', selectedProposta.itens);
        } else {
            setItens([]);
        }
    }, [selectedProposta]);

    // Group items by selected field
    const groupedData = useMemo(() => {
        if (groupBy === 'none') {
            return null;
        }

        const groups = new Map<string, PropostaItem[]>();

        itens.forEach(item => {
            const groupKey = (item[groupBy as keyof PropostaItem] || 'Sem categoria') as string;
            if (!groups.has(groupKey)) {
                groups.set(groupKey, []);
            }
            groups.get(groupKey)!.push(item);
        });

        // Convert to array and sort by group name
        return Array.from(groups.entries())
            .map(([name, items]) => ({ name, items, count: items.length }))
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [itens, groupBy]);

    // Toggle group collapse
    const toggleGroupCollapse = useCallback((groupName: string) => {
        setCollapsedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupName)) {
                newSet.delete(groupName);
            } else {
                newSet.add(groupName);
            }
            return newSet;
        });
    }, []);

    // Resizing Handlers
    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        isResizingRef.current = true;
        startYRef.current = e.clientY;
        startHeightRef.current = tableHeight;

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', stopResizing);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isResizingRef.current) return;

        // Use requestAnimationFrame for smoother performance
        requestAnimationFrame(() => {
            const deltaY = startYRef.current - e.clientY;
            const newHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeightRef.current + deltaY));
            setTableHeight(newHeight);
        });
    }, []);

    const stopResizing = useCallback(() => {
        isResizingRef.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', stopResizing);
    }, [handleMouseMove]);


    // Optimistic Update Helper
    const updateItem = useCallback(async (id: number, field: string, value: any) => {
        console.log(`📝 CartTable updateItem called:`, { id, field, value });

        const updatedItens = itens.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (['fluxo_diario', 'qtd_bi_mes', 'valor', 'valor_papel', 'valor_lona'].includes(field)) {
                    if (field === 'fluxo_diario') {
                        updatedItem.impactos = (value || 0) * 30;
                    }
                }
                console.log(`✅ Updated item:`, updatedItem);
                return updatedItem;
            }
            return item;
        });
        setItens(updatedItens);
        refreshProposta({ ...selectedProposta!, itens: updatedItens });
        try {
            await api.updateCart(selectedProposta!.id, updatedItens);
            console.log(`✅ API updateCart successful`);
        } catch (error) {
            console.error("Failed to update item", error);
        }
    }, [itens, refreshProposta, selectedProposta]);

    // Drag-to-Fill Handlers - Simplified to avoid circular dependencies
    const dragEndRef = useRef<(() => void) | null>(null);

    const handleDragEnd = useCallback(() => {
        if (dragState.isDragging && dragState.startRowId !== null && dragState.currentRowId !== null && dragState.columnKey) {
            const startIdx = itens.findIndex(item => item.id === dragState.startRowId);
            const endIdx = itens.findIndex(item => item.id === dragState.currentRowId);

            if (startIdx !== -1 && endIdx !== -1) {
                const [minIdx, maxIdx] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
                const updatedItens = [...itens];

                console.log('🎯 Drag-fill applying:', {
                    columnKey: dragState.columnKey,
                    value: dragState.startValue,
                    fromRow: minIdx,
                    toRow: maxIdx,
                    totalRows: maxIdx - minIdx + 1
                });

                // Apply the value to all rows in range
                for (let i = minIdx; i <= maxIdx; i++) {
                    // Handle período specially (it has two date fields)
                    if (dragState.columnKey === 'periodo' && typeof dragState.startValue === 'object') {
                        updatedItens[i] = {
                            ...updatedItens[i],
                            periodo_inicio: dragState.startValue.periodo_inicio,
                            periodo_fim: dragState.startValue.periodo_fim
                        };
                    } else {
                        updatedItens[i] = { ...updatedItens[i], [dragState.columnKey]: dragState.startValue };
                    }
                }

                const columnKey = dragState.columnKey!;
                console.log('✅ Drag-fill completed. Updated items:', updatedItens.slice(minIdx, maxIdx + 1).map(item => ({
                    id: item.id,
                    [columnKey]: (item as any)[columnKey]
                })));

                setItens(updatedItens);
                refreshProposta({ ...selectedProposta!, itens: updatedItens });
                api.updateCart(selectedProposta!.id, updatedItens).catch(console.error);
            }
        }

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setDragState({ isDragging: false, startRowId: null, currentRowId: null, columnKey: null, startValue: null });
    }, [dragState, itens, refreshProposta, selectedProposta]);

    // Update ref when handleDragEnd changes
    useEffect(() => {
        dragEndRef.current = handleDragEnd;
    }, [handleDragEnd]);

    const startDragging = useCallback((rowId: number, columnKey: string, value: any) => {
        console.log('🎯 Starting drag from row:', rowId, 'column:', columnKey, 'value:', value);

        document.body.style.cursor = 'crosshair';
        document.body.style.userSelect = 'none';

        setDragState({
            isDragging: true,
            startRowId: rowId,
            currentRowId: rowId,
            columnKey,
            startValue: value
        });
    }, []);

    // Global mouse move handler for drag-fill
    useEffect(() => {
        if (!dragState.isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const element = document.elementFromPoint(e.clientX, e.clientY);
            if (!element) return;

            const row = element.closest('[data-row-id]');
            if (row) {
                const rowId = parseInt(row.getAttribute('data-row-id') || '0');
                if (rowId && rowId !== dragState.currentRowId) {
                    setDragState(prev => ({ ...prev, currentRowId: rowId }));
                }
            }
        };

        const handleMouseUp = () => {
            if (dragEndRef.current) {
                dragEndRef.current();
            }
        };

        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState.isDragging, dragState.currentRowId]);

    // Check if a row is in the drag range
    const isInDragRange = useCallback((rowId: number) => {
        if (!dragState.isDragging || dragState.startRowId === null || dragState.currentRowId === null) return false;

        const startIdx = itens.findIndex(item => item.id === dragState.startRowId);
        const endIdx = itens.findIndex(item => item.id === dragState.currentRowId);
        const currentIdx = itens.findIndex(item => item.id === rowId);

        if (startIdx === -1 || endIdx === -1 || currentIdx === -1) return false;

        const [minIdx, maxIdx] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
        return currentIdx >= minIdx && currentIdx <= maxIdx;
    }, [dragState, itens]);

    const removeItem = useCallback(async (id: number) => {
        const updatedItens = itens.filter(item => item.id !== id);
        setItens(updatedItens);
        refreshProposta({ ...selectedProposta!, itens: updatedItens });
        try {
            await api.updateCart(selectedProposta!.id, updatedItens);
        } catch (error) {
            console.error("Failed to remove item", error);
            setItens(itens);
        }
    }, [itens, refreshProposta, selectedProposta]);


    // Columns Definition
    const columns = useMemo<ColumnDef<PropostaItem>[]>(() => [
        {
            id: 'select',
            header: ({ table }) => (
                <div className="w-full h-full flex items-center justify-center opacity-0 group-hover/header:opacity-100 transition-opacity">
                    <input
                        type="checkbox"
                        checked={table.getIsAllPageRowsSelected()}
                        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
                        className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className={`px-1 flex justify-center transition-opacity ${row.getIsSelected() ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <input
                        type="checkbox"
                        checked={row.getIsSelected()}
                        onChange={(e) => row.toggleSelected(!!e.target.checked)}
                        className="cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                    />
                </div>
            ),
            size: 32,
            enableResizing: false,
        },
        {
            accessorKey: 'uf',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <MapPin size={13} />
                    <span>UF</span>
                </div>
            ),
            size: 60,
            cell: ({ row }) => <span className="text-gray-700 whitespace-nowrap text-[13px]">{row.original.uf}</span>
        },
        {
            accessorKey: 'cidade', // "Praça" in user image seems to map to Cidade
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <MapPin size={13} />
                    <span>Praça</span>
                </div>
            ),
            size: 140,
            cell: ({ row }) => <span className="text-gray-900 font-medium whitespace-nowrap overflow-hidden text-ellipsis text-[13px]">{row.original.cidade}</span>
        },
        {
            accessorKey: 'endereco',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <MapPin size={13} />
                    <span>Endereço</span>
                </div>
            ),
            size: 280,
            cell: ({ row }) => (
                <button
                    className="truncate block text-left text-gray-900 hover:text-blue-600 hover:underline text-[13px]"
                    title="Ver detalhes do ponto"
                    onClick={() => {
                        const ponto = pontos.find(p => p.id === row.original.id_ooh);
                        if (ponto) {
                            setSelectedPonto(ponto);
                        } else {
                            setSelectedPonto({ id: row.original.id_ooh } as any);
                        }
                    }}
                >
                    {row.original.endereco}
                </button>
            )
        },
        {
            accessorKey: 'exibidora_nome',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Building2 size={13} />
                    <span>Exibidora</span>
                </div>
            ),
            size: 140,
            cell: ({ row }) => <span className="text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis block text-[13px]">{row.original.exibidora_nome || row.original.exibidora}</span>
        },
        {
            accessorKey: 'codigo_ooh',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Hash size={13} />
                    <span>Código OOH</span>
                </div>
            ),
            size: 110,
            cell: ({ row }) => <span className="font-mono text-[11px] bg-gray-50 px-1 py-0.5 rounded border border-gray-100 whitespace-nowrap text-gray-600">{row.original.codigo_ooh}</span>
        },
        {
            accessorKey: 'produto',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Box size={13} />
                    <span>Produto</span>
                </div>
            ),
            size: 110,
            cell: ({ row }) => (
                <span className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis block text-[13px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                    {row.original.tipo}
                </span>
            )
        },
        {
            accessorKey: 'medidas',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Ruler size={13} />
                    <span>Medidas</span>
                </div>
            ),
            size: 110,
            cell: ({ row }) => <span className="text-[12px] text-gray-500 whitespace-nowrap">{row.original.medidas}</span>
        },
        {
            id: 'periodo',
            accessorKey: 'periodo_wrapper',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <CalendarIcon size={13} />
                    <span>Período de Exibição</span>
                </div>
            ),
            size: 240,
            cell: ({ row }) => {
                const rowIndex = itens.findIndex(item => item.id === row.original.id);
                const moveToNextRow = () => {
                    const nextRow = itens[rowIndex + 1];
                    if (nextRow) {
                        const nextInput = document.querySelector(`input[data-row-id="${nextRow.id}"][data-column-id="periodo_inicio"]`) as HTMLInputElement;
                        nextInput?.focus();
                    }
                };

                return (
                    <div className="flex items-center gap-1 relative h-full group/cell hover:bg-gray-50 -m-2 p-2 transition-colors">
                        <input
                            type="date"
                            className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-[12px] text-gray-700 w-[95px] transition-colors"
                            defaultValue={row.original.periodo_inicio || ''}
                            key={`inicio-${row.original.id}-${row.original.periodo_inicio}`}
                            data-row-id={row.original.id}
                            data-column-id="periodo_inicio"
                            onBlur={(e) => {
                                if (e.target.value !== row.original.periodo_inicio) {
                                    updateItem(row.original.id, 'periodo_inicio', e.target.value);
                                }
                            }}
                            onKeyDown={(e) => handleKeyDown(e, moveToNextRow)}
                        />
                        <span className="text-gray-300 text-[10px] mx-0.5">→</span>
                        <input
                            type="date"
                            className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none text-[12px] text-gray-700 w-[95px] transition-colors"
                            defaultValue={row.original.periodo_fim || ''}
                            key={`fim-${row.original.id}-${row.original.periodo_fim}`}
                            data-row-id={row.original.id}
                            data-column-id="periodo_fim"
                            onBlur={(e) => {
                                if (e.target.value !== row.original.periodo_fim) {
                                    updateItem(row.original.id, 'periodo_fim', e.target.value);
                                }
                            }}
                            onKeyDown={(e) => handleKeyDown(e, moveToNextRow)}
                        />
                    </div>
                );
            }
        },
        {
            id: 'periodo_comercializado',
            accessorKey: 'periodo_comercializado',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Layers size={13} />
                    <span>Período da Locação</span>
                </div>
            ),
            size: 140,
            cell: ({ row }) => {
                const currentValue = row.original.periodo_comercializado || 'bissemanal';
                return (
                    <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors">
                        <select
                            className="w-full bg-transparent border-none text-[13px] text-gray-700 focus:ring-0 p-0 cursor-pointer"
                            value={currentValue}
                            onChange={(e) => {
                                updateItem(row.original.id, 'periodo_comercializado', e.target.value);
                                // Recalc logic...
                                if (row.original.periodo_inicio && row.original.periodo_fim) {
                                    const dataInicio = new Date(row.original.periodo_inicio);
                                    const dataFim = new Date(row.original.periodo_fim);
                                    const diffDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
                                    const qtd = e.target.value === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                                    updateItem(row.original.id, 'qtd_bi_mes', qtd);
                                }
                            }}
                        >
                            <option value="bissemanal">Bissemanal</option>
                            <option value="mensal">Mensal</option>
                        </select>
                    </div>
                )
            }
        },
        {
            id: 'valor_locacao',
            accessorKey: 'valor_locacao',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <DollarSign size={13} />
                    <span>Locação</span>
                </div>
            ),
            size: 120,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors flex items-center justify-end">
                    <input
                        type="text"
                        className="w-full bg-transparent border-none text-right focus:ring-0 p-0 text-[13px] text-gray-700 font-normal"
                        defaultValue={formatCurrency(row.original.valor_locacao || 0)}
                        onBlur={(e) => {
                            // Extract numbers
                            const valStr = e.target.value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                            const newValue = parseFloat(valStr);
                            if (!isNaN(newValue) && newValue !== row.original.valor_locacao) {
                                updateItem(row.original.id, 'valor_locacao', newValue);
                            }
                            // Reformat
                            e.target.value = formatCurrency(row.original.valor_locacao || 0);
                            if (!isNaN(newValue)) e.target.value = formatCurrency(newValue);
                        }}
                        onFocus={(e) => {
                            // On focus show raw number if needed or just select all
                            e.target.select();
                        }}
                    />
                </div>
            )
        },
        {
            id: 'valor_papel',
            accessorKey: 'valor_papel',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <DollarSign size={13} />
                    <span>Papel</span>
                </div>
            ),
            size: 110,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors flex items-center justify-end">
                    <input
                        type="text"
                        className="w-full bg-transparent border-none text-right focus:ring-0 p-0 text-[13px] text-gray-700"
                        defaultValue={formatCurrency(row.original.valor_papel || 0)}
                        onBlur={(e) => {
                            const valStr = e.target.value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                            const newValue = parseFloat(valStr);
                            if (!isNaN(newValue) && newValue !== row.original.valor_papel) {
                                updateItem(row.original.id, 'valor_papel', newValue);
                            }
                            if (!isNaN(newValue)) e.target.value = formatCurrency(newValue);
                            else e.target.value = formatCurrency(row.original.valor_papel || 0);
                        }}
                        onFocus={(e) => e.target.select()}
                    />
                </div>
            )
        },
        {
            id: 'valor_lona',
            accessorKey: 'valor_lona',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <DollarSign size={13} />
                    <span>Lona</span>
                </div>
            ),
            size: 110,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors flex items-center justify-end">
                    <input
                        type="text"
                        className="w-full bg-transparent border-none text-right focus:ring-0 p-0 text-[13px] text-gray-700"
                        defaultValue={formatCurrency(row.original.valor_lona || 0)}
                        onBlur={(e) => {
                            const valStr = e.target.value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                            const newValue = parseFloat(valStr);
                            if (!isNaN(newValue) && newValue !== row.original.valor_lona) {
                                updateItem(row.original.id, 'valor_lona', newValue);
                            }
                            if (!isNaN(newValue)) e.target.value = formatCurrency(newValue);
                            else e.target.value = formatCurrency(row.original.valor_lona || 0);
                        }}
                        onFocus={(e) => e.target.select()}
                    />
                </div>
            )
        },
        {
            id: 'qtd_bi_mes',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <Hash size={13} />
                    <span>Qtd.</span>
                </div>
            ),
            size: 70,
            cell: ({ row }) => {
                let qtd = 1;
                if (row.original.periodo_inicio && row.original.periodo_fim) {
                    const dataInicio = new Date(row.original.periodo_inicio);
                    const dataFim = new Date(row.original.periodo_fim);
                    const diffDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
                    qtd = row.original.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                }
                return <div className="text-right text-[13px] text-gray-700">{qtd}</div>;
            }
        },
        {
            id: 'total_investimento',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <DollarSign size={13} />
                    <span>Investimento por Praça</span>
                </div>
            ),
            size: 150,
            cell: ({ row }) => {
                let qtd = 1;
                if (row.original.periodo_inicio && row.original.periodo_fim) {
                    const dataInicio = new Date(row.original.periodo_inicio);
                    const dataFim = new Date(row.original.periodo_fim);
                    const diffDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
                    qtd = row.original.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                }
                const total = (row.original.valor_locacao || 0) * qtd;
                return <div className="text-right text-[13px] text-gray-900 font-medium">{formatCurrency(total)}</div>
            }
        },
        {
            accessorKey: 'ponto_referencia',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <MapPin size={13} />
                    <span>Ponto de Referência</span>
                </div>
            ),
            size: 200,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors">
                    <input
                        type="text"
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-700 placeholder-gray-300"
                        defaultValue={row.original.ponto_referencia || ''}
                        placeholder="Vazio"
                        onBlur={(e) => {
                            if (e.target.value !== row.original.ponto_referencia) {
                                updateItem(row.original.id, 'ponto_referencia', e.target.value);
                            }
                        }}
                    />
                </div>
            )
        },
        {
            id: 'observacoes',
            accessorKey: 'observacoes',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <StickyNote size={13} />
                    <span>Observações</span>
                </div>
            ),
            size: 200,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors">
                    <input
                        type="text"
                        className="w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-700 placeholder-gray-300"
                        defaultValue={row.original.observacoes || ''}
                        placeholder="Vazio"
                        onBlur={(e) => {
                            if (e.target.value !== row.original.observacoes) {
                                updateItem(row.original.id, 'observacoes', e.target.value);
                            }
                        }}
                    />
                </div>
            )
        },
        {
            id: 'actions',
            header: '',
            size: 40,
            enableResizing: false,
            cell: ({ row }) => (
                <button
                    onClick={() => removeItem(row.original.id)}
                    className="flex justify-center w-full opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                    title="Remover"
                >
                    <Trash2 size={14} />
                </button>
            )
        }
    ], [updateItem, removeItem, pontos, setSelectedPonto, itens, focusedCell]);


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

    if (!selectedProposta) return null;

    return (
        <div
            className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.15)] z-40 transition-all duration-300 ease-in-out flex flex-col`}
            style={{ height: isOpen ? `${tableHeight}px` : '50px' }}
        >
            {/* Resizer Handle */}
            {isOpen && (
                <div
                    className="absolute -top-1 left-0 right-0 h-3 bg-transparent cursor-row-resize z-50 hover:bg-blue-500/10 flex items-center justify-center group/resizer"
                    onMouseDown={startResizing}
                >
                    <div className="w-16 h-1 bg-gray-300 rounded-full group-hover/resizer:bg-blue-400 opacity-0 group-hover/resizer:opacity-100 transition-all" />
                </div>
            )}

            {/* Toolbar */}
            <div
                className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shadow-sm z-20 cursor-pointer flex-shrink-0"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => { e.stopPropagation(); onToggle(); }}
                        className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                    >
                        <ChevronDown size={20} className={`transform transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
                    </button>
                    <h3 className="font-semibold text-gray-800 text-sm">Carrinho ({itens.length})</h3>

                    {/* Bulk Actions */}
                    {Object.keys(rowSelection).length > 0 && (
                        <div
                            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md animate-in fade-in slide-in-from-left-2 shadow-sm border border-blue-100 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <span className="text-xs font-bold">{Object.keys(rowSelection).length}</span>
                            <div className="h-4 w-px bg-blue-200 mx-1" />

                            <button
                                onClick={() => {
                                    const selectedIds = Object.keys(rowSelection).map(Number);
                                    const updatedItens = itens.filter(item => !selectedIds.includes(item.id));
                                    setItens(updatedItens);
                                    setRowSelection({});
                                    refreshProposta({ ...selectedProposta!, itens: updatedItens });
                                    api.updateCart(selectedProposta!.id, updatedItens).catch(console.error);
                                }}
                                className="text-xs font-medium hover:text-red-700 flex items-center gap-1 text-red-600 transition-colors"
                            >
                                <Trash2 size={14} /> Remover Selecionados
                            </button>
                        </div>
                    )}
                </div>

                <div
                    className="flex items-center gap-4 relative"
                    onClick={e => e.stopPropagation()}
                >
                    {!isOpen && (
                        <div className="flex items-center gap-4 text-sm animate-fade-in">
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] text-gray-500">Total</span>
                                <span className="font-bold text-emerald-600">
                                    {formatCurrency(itens.reduce((sum, item) => sum + ((item.valor || 0) + (item.valor_papel || 0) + (item.valor_lona || 0)) * (item.qtd_bi_mes || 1), 0))}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Grouping Menu */}
                    <button
                        onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                        className={`p-1.5 rounded-md transition-all flex items-center gap-1 ${isGroupMenuOpen || groupBy !== 'none' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700 border border-transparent'}`}
                        title="Agrupar por"
                    >
                        <Layers size={16} />
                        {groupBy !== 'none' && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide">
                                {groupBy === 'pais' && 'País'}
                                {groupBy === 'uf' && 'UF'}
                                {groupBy === 'cidade' && 'Cidade'}
                                {groupBy === 'exibidora_nome' && 'Exibidora'}
                            </span>
                        )}
                    </button>

                    {/* Grouping Dropdown */}
                    {isGroupMenuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsGroupMenuOpen(false)} />
                            <div className="absolute right-28 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right cursor-default">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Agrupar Por</h4>
                                <div className="px-1">
                                    {[
                                        { value: 'none' as GroupByField, label: 'Sem agrupamento', icon: '—' },
                                        { value: 'pais' as GroupByField, label: 'País', icon: '🌍' },
                                        { value: 'uf' as GroupByField, label: 'UF', icon: '📍' },
                                        { value: 'cidade' as GroupByField, label: 'Cidade', icon: '🏙️' },
                                        { value: 'exibidora_nome' as GroupByField, label: 'Exibidora', icon: '🏢' },
                                    ].map((option) => (
                                        <div
                                            key={option.value}
                                            className={`px-2 py-2 flex items-center gap-3 hover:bg-gray-50 rounded cursor-pointer transition-colors ${groupBy === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}`}
                                            onClick={() => {
                                                setGroupBy(option.value);
                                                setIsGroupMenuOpen(false);
                                                setCollapsedGroups(new Set()); // Reset collapsed groups
                                            }}
                                        >
                                            <span className="text-base">{option.icon}</span>
                                            <span className="text-sm font-medium flex-1">{option.label}</span>
                                            {groupBy === option.value && (
                                                <Check size={14} className="text-blue-600" strokeWidth={3} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        className={`p-1.5 rounded-md transition-all ${isSettingsOpen ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        title="Configurações da tabela"
                    >
                        <Settings size={16} />
                    </button>

                    {isSettingsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right cursor-default">
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

            {/* Table Area - Hidden when collapsed */}
            <div className={`flex-1 overflow-auto relative bg-gray-50/50 ${!isOpen ? 'hidden' : ''}`}>
                <div
                    className="min-w-full inline-block align-top"
                    style={{ width: table.getTotalSize() }}
                >
                    {/* Head */}
                    <div className="sticky top-0 z-10 bg-white font-normal text-[13px] text-gray-500 text-left flex border-b border-gray-200 group/header">
                        {table.getHeaderGroups().map(headerGroup => (
                            <div key={headerGroup.id} className="flex flex-row w-full">
                                {headerGroup.headers.map(header => (
                                    <div
                                        key={header.id}
                                        className="relative group px-3 py-2 border-r border-gray-200 last:border-r-0 flex items-center justify-between select-none hover:bg-gray-50 transition-colors"
                                        style={{ width: header.getSize(), flex: `0 0 ${header.getSize()}px` }}
                                    >
                                        <div
                                            className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900 truncate w-full"
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                            {{
                                                asc: <ArrowUpDown size={12} className="text-gray-400 shrink-0" />,
                                                desc: <ArrowUpDown size={12} className="text-gray-400 rotate-180 shrink-0" />,
                                            }[header.column.getIsSorted() as string] ?? null}
                                        </div>

                                        {header.column.getCanResize() && (
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-gray-300 opacity-0 group-hover:opacity-100 transition-opacity z-20 ${header.column.getIsResizing() ? 'bg-blue-400 opacity-100' : ''}`}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    {/* Body */}
                    <div className="bg-white text-[13px]">
                        {/* Grouped View */}
                        {groupedData ? (
                            <>
                                {groupedData.map((group) => {
                                    const isCollapsed = collapsedGroups.has(group.name);
                                    const groupRows = table.getRowModel().rows.filter(row => {
                                        const groupKey = (row.original[groupBy as keyof PropostaItem] || 'Sem categoria') as string;
                                        return groupKey === group.name;
                                    });

                                    // Calculate group total
                                    const groupTotal = group.items.reduce((sum, item) =>
                                        sum + ((item.valor_locacao || 0) + (item.valor_papel || 0) + (item.valor_lona || 0)) * (item.qtd_bi_mes || 1), 0
                                    );

                                    return (
                                        <div key={group.name} className="border-b border-gray-200">
                                            {/* Group Header */}
                                            <div
                                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors sticky top-[37px] z-[5] border-b border-gray-200"
                                                onClick={() => toggleGroupCollapse(group.name)}
                                            >
                                                {isCollapsed ? (
                                                    <ChevronRight size={14} className="text-gray-400 flex-shrink-0" />
                                                ) : (
                                                    <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />
                                                )}
                                                <span className="font-medium text-sm text-gray-800">{group.name}</span>
                                                <span className="text-xs text-gray-400 bg-white px-1.5 rounded-sm border border-gray-200">
                                                    {group.count}
                                                </span>
                                                <span className="text-xs text-emerald-700 font-medium ml-auto">
                                                    {formatCurrency(groupTotal)}
                                                </span>
                                            </div>

                                            {/* Group Rows */}
                                            {!isCollapsed && groupRows.map(row => (
                                                <div
                                                    key={row.id}
                                                    data-row-id={row.original.id}
                                                    className={`flex items-center border-b border-gray-200 transition-colors group min-h-[44px] ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                                                >
                                                    {row.getVisibleCells().map(cell => {
                                                        const isEditable = ['periodo', 'periodo_comercializado', 'valor_locacao', 'valor_papel', 'valor_lona', 'fluxo_diario', 'ponto_referencia', 'observacoes'].includes(cell.column.id || '');
                                                        return (
                                                            <div
                                                                key={cell.id}
                                                                className={`px-3 py-1.5 border-r border-gray-200 last:border-r-0 flex items-center relative ${isEditable ? 'overflow-visible' : 'overflow-hidden'} ${isInDragRange(row.original.id) && dragState.columnKey === cell.column.id ? '!bg-blue-100 shadow-[inset_0_0_0_2px_rgb(96,165,250)]' : ''}`}
                                                                style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
                                                            >
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                {/* Drag handle for ONLY specified editable cells */}
                                                                {['periodo', 'periodo_comercializado', 'valor_locacao', 'valor_papel', 'valor_lona'].includes(cell.column.id || '') &&
                                                                    focusedCell.rowId === row.original.id &&
                                                                    (focusedCell.columnId === cell.column.id || (cell.column.id === 'periodo' && focusedCell.columnId === 'periodo')) && (
                                                                        <div
                                                                            className="absolute bottom-0.5 right-0.5 w-[6px] h-[6px] bg-blue-600 hover:bg-blue-700 hover:w-[8px] hover:h-[8px] border border-white cursor-crosshair transition-all z-50 shadow-md"
                                                                            style={{ borderRadius: '0 0 2px 0' }}
                                                                            title="Arrastar para preencher"
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault();
                                                                                e.stopPropagation();
                                                                                const columnId = cell.column.id!;

                                                                                // Get current value from itens state for real-time accuracy
                                                                                const currentItem = itens.find(item => item.id === row.original.id);
                                                                                let value = currentItem ? (currentItem as any)[columnId] : (row.original as any)[columnId];

                                                                                // For período, use both values
                                                                                if (columnId === 'periodo') {
                                                                                    value = {
                                                                                        periodo_inicio: currentItem?.periodo_inicio || row.original.periodo_inicio,
                                                                                        periodo_fim: currentItem?.periodo_fim || row.original.periodo_fim
                                                                                    };
                                                                                }

                                                                                console.log('🖱️ Drag started:', { rowId: row.original.id, columnId, value });
                                                                                startDragging(row.original.id, columnId, value);
                                                                            }}
                                                                        />
                                                                    )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </>
                        ) : (
                            /* Flat View */
                            <>
                                {table.getRowModel().rows.map(row => (
                                    <div
                                        key={row.id}
                                        data-row-id={row.original.id}
                                        className={`flex items-center border-b border-gray-200 transition-colors group min-h-[44px] ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                        {row.getVisibleCells().map(cell => {
                                            const isEditable = ['periodo', 'periodo_comercializado', 'valor_locacao', 'valor_papel', 'valor_lona', 'fluxo_diario', 'ponto_referencia', 'observacoes'].includes(cell.column.id || '');
                                            return (
                                                <div
                                                    key={cell.id}
                                                    className={`px-3 py-1.5 border-r border-gray-200 last:border-r-0 flex items-center relative ${isEditable ? 'overflow-visible' : 'overflow-hidden'} ${isInDragRange(row.original.id) && dragState.columnKey === cell.column.id ? '!bg-blue-100 shadow-[inset_0_0_0_2px_rgb(96,165,250)]' : ''}`}
                                                    style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                    {/* Drag handle for ONLY specified editable cells */}
                                                    {['periodo', 'periodo_comercializado', 'valor_locacao', 'valor_papel', 'valor_lona'].includes(cell.column.id || '') &&
                                                        focusedCell.rowId === row.original.id &&
                                                        (focusedCell.columnId === cell.column.id || (cell.column.id === 'periodo' && focusedCell.columnId === 'periodo')) && (
                                                            <div
                                                                className="absolute bottom-0.5 right-0.5 w-[6px] h-[6px] bg-blue-600 hover:bg-blue-700 hover:w-[8px] hover:h-[8px] border border-white cursor-crosshair transition-all z-50 shadow-md"
                                                                style={{ borderRadius: '0 0 2px 0' }}
                                                                title="Arrastar para preencher"
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    const columnId = cell.column.id!;

                                                                    // Get current value from itens state for real-time accuracy
                                                                    const currentItem = itens.find(item => item.id === row.original.id);
                                                                    let value = currentItem ? (currentItem as any)[columnId] : (row.original as any)[columnId];

                                                                    // For período, use both values
                                                                    if (columnId === 'periodo') {
                                                                        value = {
                                                                            periodo_inicio: currentItem?.periodo_inicio || row.original.periodo_inicio,
                                                                            periodo_fim: currentItem?.periodo_fim || row.original.periodo_fim
                                                                        };
                                                                    }

                                                                    console.log('🖱️ Drag started:', { rowId: row.original.id, columnId, value });
                                                                    startDragging(row.original.id, columnId, value);
                                                                }}
                                                            />
                                                        )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </>
                        )}

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

            {/* Footer Summary - Always visible if open */}
            {isOpen && (
                <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between text-sm shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20 flex-shrink-0">
                    <div className="text-gray-500 text-xs">
                        {itens.length} pontos listados
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Investimento Total</span>
                            <span className="font-bold text-lg text-emerald-600 leading-none">
                                {formatCurrency(itens.reduce((sum, item) => sum + ((item.valor || 0) + (item.valor_papel || 0) + (item.valor_lona || 0)) * (item.qtd_bi_mes || 1), 0))}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
