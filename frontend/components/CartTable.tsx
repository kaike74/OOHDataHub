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
    StickyNote,
    Eye,
    Target,
    BarChart3,
    Share2,
    FileSpreadsheet,
    FileText as FilePdfIcon
} from 'lucide-react';
import ShareModal from './ShareModal';
import { Button } from '@/components/ui/Button';
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
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/Tooltip';

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
// Helper to handle Enter to move to next row, Tab for regular behavior
const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    rowId: number,
    columnId: string,
    itens: PropostaItem[]
) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();

        const currentIndex = itens.findIndex(item => item.id === rowId);
        const nextItem = itens[currentIndex + 1];

        if (nextItem) {
            // Find the input in the next row with the same column id
            const nextInput = document.querySelector(`[data-row-id="${nextItem.id}"][data-column-id="${columnId}"]`) as HTMLElement;
            if (nextInput) {
                setTimeout(() => nextInput.focus(), 10);
            }
        }
    }
}

interface CartTableProps {
    proposta?: Proposta;
    isOpen: boolean;
    onToggle: () => void;
    isClientView?: boolean;
}

export default function CartTable({ isOpen, onToggle, isClientView = false, proposta }: CartTableProps) {
    const storeSelectedProposta = useStore((state) => state.selectedProposta);
    const selectedProposta = proposta || storeSelectedProposta;

    const refreshProposta = useStore((state) => state.refreshProposta);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const pontos = useStore((state) => state.pontos);

    const [itens, setItens] = useState<PropostaItem[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
    const [columnSizing, setColumnSizing] = useState({});

    // UI State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

    const user = useStore(state => state.user);
    const isInternal = !!user && user.role !== 'client';
    // Only show status column if proposal is actually IN VALIDATION or APPROVED.
    // Draft proposals should not show this column, even for internal users.
    const showStatusColumn = selectedProposta?.status === 'em_validacao' || selectedProposta?.status === 'aprovado';

    const handleApproveProposal = async () => {
        if (!selectedProposta) return;
        if (!confirm('Deseja enviar esta proposta para validação?')) return;

        try {
            await api.updateProposalStatus(selectedProposta.id, 'em_validacao');
            refreshProposta({ ...selectedProposta, status: 'em_validacao' });
        } catch (error) {
            console.error('Failed to approve proposal', error);
            alert('Falha ao aprovar proposta');
        }
    };

    const handleConcludeValidation = async () => {
        if (!selectedProposta) return;
        // Validate all items are final
        const pendingItems = itens.filter(i => !['APPROVED', 'UNAVAILABLE'].includes(i.status_validacao || 'PENDING'));
        if (pendingItems.length > 0) {
            alert('Todos os itens devem estar Aprovados ou Indisponíveis para concluir.');
            return;
        }

        if (!confirm('Deseja concluir a validação desta proposta? O cliente será notificado.')) return;

        try {
            await api.updateProposalStatus(selectedProposta.id, 'aprovado');
            refreshProposta({ ...selectedProposta, status: 'aprovado' });
        } catch (error) {
            console.error('Failed to conclude validation', error);
            alert('Falha ao concluir validação');
        }
    };

    const handleShareUpdate = async () => {
        if (!selectedProposta) return;
        try {
            const updated = await api.getProposta(selectedProposta.id);
            // Verify structure matches expected Proposta type (with sharedUsers)
            refreshProposta(updated);
        } catch (error) {
            console.error('Failed to refresh proposal after share update', error);
        }
    };

    // Initial Load
    useEffect(() => {
        if (selectedProposta) {
            setItens(selectedProposta.itens || []);
            console.log('🛒 CartTable recebeu itens:', selectedProposta.itens);
        } else {
            setItens([]);
        }

        if (isClientView) {
            setColumnVisibility(prev => ({
                ...prev,
                valor_papel: false,
                valor_lona: false,
                periodo_comercializado: false
            }));
        }
    }, [selectedProposta, isClientView]);

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
    const updateItem = useCallback(async (id: number, fieldOrUpdates: string | Record<string, any>, value?: any) => {
        const updates = typeof fieldOrUpdates === 'string' ? { [fieldOrUpdates]: value } : fieldOrUpdates;
        console.log(`📝 CartTable updateItem called:`, { id, updates });

        const updatedItens = itens.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, ...updates };

                // Handle specific field logic
                if ('fluxo_diario' in updates || 'periodo_inicio' in updates || 'periodo_fim' in updates) {
                    const fluxo = updates.fluxo_diario !== undefined ? updates.fluxo_diario : (item.fluxo_diario || 0);
                    const inicio = updates.periodo_inicio || item.periodo_inicio;
                    const fim = updates.periodo_fim || item.periodo_fim;

                    if (inicio && fim) {
                        const dataInicio = new Date(inicio);
                        const dataFim = new Date(fim);
                        const diffDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
                        updatedItem.impactos = fluxo * diffDays;
                    } else {
                        updatedItem.impactos = 0;
                    }
                }

                console.log(`✅ Updated item:`, updatedItem);
                return updatedItem;
            }
            return item;
        });

        setItens(updatedItens);
        setIsSyncing(true);

        try {
            if (updatedItens.length === 0 && (!selectedProposta?.itens || selectedProposta.itens.length === 0)) {
                return;
            }

            if (!selectedProposta || !selectedProposta.id) return;

            if (isClientView) {
                await api.updatePortalProposalItems(selectedProposta.id, updatedItens);
            } else {
                await api.updateCart(selectedProposta.id, updatedItens);
            }

            refreshProposta({ ...selectedProposta!, itens: updatedItens });

            // Re-fetch to sync (clean)
            if (selectedProposta && !isClientView) {
                const res = await api.getProposta(selectedProposta.id);
                if (res) refreshProposta(res);
            }
        } catch (error) {
            console.error('Falha ao atualizar carrinho', error);
        } finally {
            setIsSyncing(false);
        }
    }, [itens, refreshProposta, selectedProposta, isClientView]);

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
        ...(showStatusColumn ? [{
            id: 'status_validacao',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Target size={13} />
                    <span>Status</span>
                </div>
            ),
            size: 130,
            cell: ({ row }: any) => {
                const status = row.original.status_validacao || 'PENDING';
                const statusMap: Record<string, { label: string; color: string; bg: string }> = {
                    'PENDING': { label: 'Pendente', color: 'text-gray-600', bg: 'bg-gray-100' },
                    'VALIDATION': { label: 'Em Validação', color: 'text-blue-600', bg: 'bg-blue-50' },
                    'APPROVED': { label: 'Aprovado', color: 'text-green-600', bg: 'bg-green-50' },
                    'UNAVAILABLE': { label: 'Indisponível', color: 'text-red-600', bg: 'bg-red-50' }
                };
                const config = statusMap[status] || statusMap['PENDING'];

                const StatusBadge = (
                    <div className={`h-full -m-2 p-2 hover:bg-gray-50 transition-colors flex items-center`}>
                        {isClientView || !isInternal ? (
                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border border-transparent ${config.bg} ${config.color}`}>
                                {config.label}
                            </div>
                        ) : (
                            <select
                                className={`w-full bg-transparent border-none text-[11px] font-medium focus:ring-0 p-0 cursor-pointer ${config.color}`}
                                value={status}
                                onChange={(e) => {
                                    const newStatus = e.target.value;
                                    const updates: any = { status_validacao: newStatus };
                                    if (newStatus === 'APPROVED' && row.original.periodo_fim) {
                                        updates.approved_until = row.original.periodo_fim;
                                    }
                                    updateItem(row.original.id, updates);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <option value="PENDING">Pendente</option>
                                <option value="VALIDATION">Em Validação</option>
                                <option value="APPROVED">Aprovado</option>
                                <option value="UNAVAILABLE">Indisponível</option>
                            </select>
                        )}
                    </div>
                );

                if (!row.original.validator_name) return StatusBadge;

                return (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                {StatusBadge}
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="text-xs">
                                    <p className="font-semibold">{config.label}</p>
                                    <p className="opacity-90">{row.original.validator_name}</p>
                                    <p className="opacity-75 text-[10px]">
                                        {row.original.last_validated_at ? new Date(row.original.last_validated_at).toLocaleString() : ''}
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            }
        }] : []),
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
            cell: ({ row }) => (
                <div className="flex flex-col">
                    <span className="font-mono text-[11px] bg-gray-50 px-1 py-0.5 rounded border border-gray-100 whitespace-nowrap text-gray-600">
                        {row.original.codigo_ooh}
                    </span>
                </div>
            )
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
                            onKeyDown={(e) => handleKeyDown(e, row.original.id, 'periodo_inicio', itens)}
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
                            onKeyDown={(e) => handleKeyDown(e, row.original.id, 'periodo_fim', itens)}
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
                    <span>Período comercializado</span>
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
                                const newValue = e.target.value;
                                let qtd = 1;

                                if (row.original.periodo_inicio && row.original.periodo_fim) {
                                    const dataInicio = new Date(row.original.periodo_inicio);
                                    const dataFim = new Date(row.original.periodo_fim);
                                    const diffDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
                                    qtd = newValue === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                                }

                                updateItem(row.original.id, {
                                    periodo_comercializado: newValue,
                                    qtd_bi_mes: qtd
                                });
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
                    <span>{isClientView ? 'Valor' : 'Locação'}</span>
                </div>
            ),
            size: 120,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors flex items-center justify-end">
                    <input
                        type="text"
                        readOnly={isClientView}
                        className={`w-full bg-transparent border-none text-right focus:ring-0 p-0 text-[13px] text-gray-700 font-normal ${isClientView ? 'cursor-default' : ''}`}
                        defaultValue={formatCurrency(row.original.valor_locacao || 0)}
                        data-row-id={row.original.id}
                        data-column-id="valor_locacao"
                        onBlur={(e) => {
                            if (isClientView) return;
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
                            if (!isClientView) e.target.select();
                        }}
                        onKeyDown={(e) => !isClientView && handleKeyDown(e, row.original.id, 'valor_locacao', itens)}
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
                        data-row-id={row.original.id}
                        data-column-id="valor_papel"
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
                        onKeyDown={(e) => handleKeyDown(e, row.original.id, 'valor_papel', itens)}
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
                        data-row-id={row.original.id}
                        data-column-id="valor_lona"
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
                        onKeyDown={(e) => handleKeyDown(e, row.original.id, 'valor_lona', itens)}
                    />
                </div>
            )
        },
        {
            id: 'qtd_bi_mes',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <Hash size={13} />
                    <span>Qtd. Bi/Mês</span>
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
                    <span>Investimento</span>
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
            id: 'cpm',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <BarChart3 size={13} />
                    <span>CPM</span>
                </div>
            ),
            size: 80,
            cell: ({ row }) => {
                let qtd = 1;
                let diffDays = 0;
                if (row.original.periodo_inicio && row.original.periodo_fim) {
                    const dataInicio = new Date(row.original.periodo_inicio);
                    const dataFim = new Date(row.original.periodo_fim);
                    diffDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
                    qtd = row.original.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                }
                const totalInvestimento = (row.original.valor_locacao || 0) * qtd;
                const impactos = (row.original.fluxo_diario || 0) * diffDays;
                const cpm = impactos > 0 ? (totalInvestimento / impactos) * 1000 : 0;
                return <div className="text-right text-[13px] text-gray-700">{formatCurrency(cpm)}</div>;
            }
        },
        {
            id: 'impactos',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <Target size={13} />
                    <span>Impactos</span>
                </div>
            ),
            size: 100,
            cell: ({ row }) => {
                let diffDays = 0;
                if (row.original.periodo_inicio && row.original.periodo_fim) {
                    const dataInicio = new Date(row.original.periodo_inicio);
                    const dataFim = new Date(row.original.periodo_fim);
                    diffDays = Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
                }
                const impactos = (row.original.fluxo_diario || 0) * diffDays;
                return <div className="text-right text-[13px] text-gray-700">{formatNumber(impactos)}</div>;
            }
        },
        {
            accessorKey: 'latitude',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Globe size={13} />
                    <span>Lat</span>
                </div>
            ),
            size: 90,
            cell: ({ row }) => <span className="text-gray-500 text-[11px] font-mono">{row.original.latitude ?? '-'}</span>
        },
        {
            accessorKey: 'longitude',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <Globe size={13} />
                    <span>Lon</span>
                </div>
            ),
            size: 90,
            cell: ({ row }) => <span className="text-gray-500 text-[11px] font-mono">{row.original.longitude ?? '-'}</span>
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
    ], [updateItem, removeItem, pontos, setSelectedPonto, itens, focusedCell, showStatusColumn, isClientView]);

    // Export Handlers
    const handleExportExcel = () => {
        if (!itens.length) return;

        const dataToExport = itens.map(item => {
            // Calculate item totals
            let qtd = 1;
            if (item.periodo_inicio && item.periodo_fim) {
                const start = new Date(item.periodo_inicio);
                const end = new Date(item.periodo_fim);
                const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
            }
            const total = (item.valor_locacao || 0) * qtd;

            return {
                'Código OOH': item.codigo_ooh,
                'Exibidora': item.exibidora_nome || item.exibidora,
                'Cidade': item.cidade,
                'UF': item.uf,
                'Endereço': item.endereco,
                'Produto': item.tipo,
                'Medidas': item.medidas,
                'Início': item.periodo_inicio,
                'Fim': item.periodo_fim,
                'Período': item.periodo_comercializado,
                'Investimento': total,
                // Only include other costs if NOT client view
                ...(!isClientView ? {
                    'Locação Unit.': item.valor_locacao,
                    'Papel': item.valor_papel,
                    'Lona': item.valor_lona,
                } : {}),
                'Impactos': item.fluxo_diario, // Approximate
                'Observações': item.observacoes
            };
        });

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Proposta");
        XLSX.writeFile(wb, `${selectedProposta?.nome || 'Proposta'}.xlsx`);
    };

    const handleExportPDF = () => {
        if (!itens.length) return;

        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(selectedProposta?.nome || 'Proposta de Mídia OOH', 14, 22);

        doc.setFontSize(11);
        doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 14, 30);
        if (selectedProposta?.nome) {
            // Add client info if available
        }

        const tableBody = itens.map(item => {
            let qtd = 1;
            if (item.periodo_inicio && item.periodo_fim) {
                const start = new Date(item.periodo_inicio);
                const end = new Date(item.periodo_fim);
                const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
            }
            const total = (item.valor_locacao || 0) * qtd;

            const row = [
                item.codigo_ooh || '',
                item.cidade || '',
                item.endereco || '',
                `${item.periodo_inicio ? new Date(item.periodo_inicio).toLocaleDateString() : ''} - ${item.periodo_fim ? new Date(item.periodo_fim).toLocaleDateString() : ''}`,
                item.medidas || '',
                formatCurrency(total)
            ];
            return row;
        });

        autoTable(doc, {
            head: [['Código', 'Cidade', 'Endereço', 'Período', 'Medidas', 'Investimento']],
            body: tableBody,
            startY: 40,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [66, 133, 244] } // Blue
        });

        // Add Summary
        const totalInvest = itens.reduce((acc, item) => {
            let qtd = 1;
            if (item.periodo_inicio && item.periodo_fim) {
                const start = new Date(item.periodo_inicio);
                const end = new Date(item.periodo_fim);
                const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
            }
            return acc + (item.valor_locacao || 0) * qtd;
        }, 0);

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text(`Total Investimento: ${formatCurrency(totalInvest)}`, 14, finalY);

        doc.save(`${selectedProposta?.nome || 'Proposta'}.pdf`);
    };


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
                    <div className="flex items-center gap-2">
                        <div
                            onClick={(e) => { e.stopPropagation(); onToggle(); }}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors cursor-pointer"
                        >
                            <ChevronDown size={20} className={`transform transition-transform duration-300 ${isOpen ? '' : 'rotate-180'}`} />
                        </div>
                        <h3 className="font-semibold text-gray-800 text-sm">Carrinho ({itens.length})</h3>
                        {selectedProposta && selectedProposta.status === 'rascunho' && (
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleApproveProposal(); }}
                                variant="outline"
                                size="sm"
                                className="ml-2 h-7 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50"
                            >
                                Aprovar Proposta
                            </Button>
                        )}
                        {selectedProposta && selectedProposta.status === 'em_validacao' && isInternal && (
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleConcludeValidation(); }}
                                variant="primary"
                                size="sm"
                                className="ml-2 h-7 px-2 text-xs bg-green-600 hover:bg-green-700 border-transparent text-white"
                            >
                                Concluir Validação
                            </Button>
                        )}
                    </div>

                    <Button
                        onClick={(e) => { e.stopPropagation(); setIsShareModalOpen(true); }}
                        variant="primary"
                        size="sm"
                        className="ml-4 shadow-sm"
                        leftIcon={<Share2 size={14} />}
                    >
                        Compartilhar
                    </Button>

                    {isClientView && (
                        <div className="flex items-center gap-2 ml-4 border-l border-gray-200 pl-4">
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleExportExcel(); }}
                                variant="outline"
                                size="sm"
                                className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300"
                                leftIcon={<FileSpreadsheet size={14} />}
                            >
                                Excel
                            </Button>
                            <Button
                                onClick={(e) => { e.stopPropagation(); handleExportPDF(); }}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                leftIcon={<FilePdfIcon size={14} />}
                            >
                                PDF
                            </Button>
                        </div>
                    )}

                    {/* Bulk Actions */}
                    {Object.keys(rowSelection).length > 0 && (
                        <div
                            className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md animate-in fade-in slide-in-from-left-2 shadow-sm border border-blue-100 relative"
                            onClick={e => e.stopPropagation()}
                        >
                            <span className="text-xs font-bold">{Object.keys(rowSelection).length}</span>
                            <div className="h-4 w-px bg-blue-200 mx-1" />

                            <Button
                                onClick={() => {
                                    const selectedIds = Object.keys(rowSelection).map(Number);
                                    const updatedItens = itens.filter(item => !selectedIds.includes(item.id));
                                    setItens(updatedItens);
                                    setRowSelection({});
                                    refreshProposta({ ...selectedProposta!, itens: updatedItens });
                                    api.updateCart(selectedProposta!.id, updatedItens).catch(console.error);
                                }}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 h-6 px-2 text-xs"
                                leftIcon={<Trash2 size={14} />}
                            >
                                Remover Selecionados
                            </Button>
                        </div>
                    )}
                </div>

                <div
                    className="flex items-center gap-4 relative"
                    onClick={e => e.stopPropagation()}
                >

                    <div className="flex items-center gap-4 text-sm animate-fade-in divide-x divide-gray-200">
                        {/* Impactos Totais */}
                        <div className="flex flex-col items-end px-4 first:pl-0">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Impactos Totais</span>
                            <span className="font-bold text-gray-700">
                                {formatNumber(itens.reduce((sum, item) => {
                                    let diffDays = 0;
                                    if (item.periodo_inicio && item.periodo_fim) {
                                        const start = new Date(item.periodo_inicio);
                                        const end = new Date(item.periodo_fim);
                                        diffDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                    }
                                    return sum + ((item.fluxo_diario || 0) * diffDays);
                                }, 0))}
                            </span>
                        </div>

                        {/* Investimento Total */}
                        <div className="flex flex-col items-end px-4">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Investimento Total</span>
                            <span className="font-bold text-emerald-600">
                                {formatCurrency(itens.reduce((sum, item) => {
                                    let qtd = 1;
                                    if (item.periodo_inicio && item.periodo_fim) {
                                        const start = new Date(item.periodo_inicio);
                                        const end = new Date(item.periodo_fim);
                                        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                        qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                                    }
                                    return sum + ((item.valor_locacao || 0) * qtd);
                                }, 0))}
                            </span>
                        </div>

                        {/* CPM Total */}
                        <div className="flex flex-col items-end px-4 last:pr-0">
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">CPM Total</span>
                            <span className="font-bold text-blue-600">
                                {(() => {
                                    const totalInvest = itens.reduce((sum, item) => {
                                        let qtd = 1;
                                        if (item.periodo_inicio && item.periodo_fim) {
                                            const start = new Date(item.periodo_inicio);
                                            const end = new Date(item.periodo_fim);
                                            const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                            qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                                        }
                                        return sum + ((item.valor_locacao || 0) * qtd);
                                    }, 0);

                                    const totalImpactos = itens.reduce((sum, item) => {
                                        let diffDays = 0;
                                        if (item.periodo_inicio && item.periodo_fim) {
                                            const start = new Date(item.periodo_inicio);
                                            const end = new Date(item.periodo_fim);
                                            diffDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                                        }
                                        return sum + ((item.fluxo_diario || 0) * diffDays);
                                    }, 0);

                                    return formatCurrency(totalImpactos > 0 ? (totalInvest / totalImpactos) * 1000 : 0);
                                })()}
                            </span>
                        </div>
                    </div>


                    {/* Grouping Menu */}
                    <Button
                        onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
                        variant="ghost"
                        size="sm"
                        className={`gap-1 ${isGroupMenuOpen || groupBy !== 'none' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                        title="Agrupar por"
                    >
                        <Layers size={16} />
                        {groupBy !== 'none' && (
                            <span className="text-[10px] font-semibold uppercase tracking-wide ml-1">
                                {groupBy === 'pais' && 'País'}
                                {groupBy === 'uf' && 'UF'}
                                {groupBy === 'cidade' && 'Cidade'}
                                {groupBy === 'exibidora_nome' && 'Exibidora'}
                            </span>
                        )}
                    </Button>

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

                    <Button
                        onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                        variant="ghost"
                        size="icon"
                        className={`${isSettingsOpen ? 'bg-gray-100 text-gray-900 shadow-inner' : 'text-gray-500 hover:bg-gray-50'}`}
                        title="Configurações da tabela"
                    >
                        <Eye size={16} />
                    </Button>

                    <Button
                        onClick={() => {
                            handleShareUpdate();
                            setIsShareModalOpen(true);
                        }}
                        variant="secondary"
                        size="sm"
                        className="gap-2 bg-green-50 text-green-700 hover:bg-green-100 border-green-200 shadow-sm"
                        title="Compartilhar Proposta"
                        leftIcon={<Share2 size={16} />}
                    >
                        Compartilhar
                    </Button>

                    {isSettingsOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsSettingsOpen(false)} />
                            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2 animate-in fade-in zoom-in-95 duration-100 origin-top-right cursor-default">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-2">Colunas Visíveis</h4>
                                <div className="max-h-60 overflow-y-auto px-1">
                                    {table.getAllLeafColumns()
                                        .filter(col => col.id !== 'select' && col.id !== 'actions')
                                        .map(column => {
                                            if (!column.id) return null;

                                            // Map column IDs to readable labels
                                            const columnLabels: Record<string, string> = {
                                                'uf': 'UF',
                                                'exibidora_nome': 'Exibidora',
                                                'codigo_ooh': 'Código OOH',
                                                'produto': 'Produto',
                                                'medidas': 'Medidas',
                                                'latitude': 'Latitude',
                                                'longitude': 'Longitude',
                                                'periodo': 'Período de Exibição',
                                                'periodo_comercializado': 'Período comercializado',
                                                'valor_locacao': 'Locação',
                                                'valor_papel': 'Papel',
                                                'valor_lona': 'Lona',
                                                'qtd_bi_mes': 'Qtd. Bi/Mês',
                                                'total_investimento': 'Investimento',
                                                'cpm': 'CPM',
                                                'impactos': 'Impactos',
                                                'ponto_referencia': 'Ponto de Referência',
                                                'observacoes': 'Observações'
                                            };

                                            const label = columnLabels[column.id] || column.id;

                                            return (
                                                <div
                                                    key={column.id}
                                                    className="px-2 py-1.5 flex items-center gap-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
                                                    onClick={column.getToggleVisibilityHandler()}
                                                >
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${column.getIsVisible() ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                                                        {column.getIsVisible() && <Check size={10} strokeWidth={3} />}
                                                    </div>
                                                    <span className="text-sm text-gray-700 truncate select-none">
                                                        {label}
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
                                    const totals = group.items.reduce((acc, item) => {
                                        // Investimento
                                        let qtd = 1;
                                        let diffDays = 0;

                                        if (item.periodo_inicio && item.periodo_fim) {
                                            const start = new Date(item.periodo_inicio);
                                            const end = new Date(item.periodo_fim);
                                            const diffMs = end.getTime() - start.getTime();
                                            diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                                            qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                                        }

                                        const investimento = (item.valor_locacao || 0) * qtd;
                                        const impactos = (item.fluxo_diario || 0) * diffDays;

                                        return {
                                            investimento: acc.investimento + investimento,
                                            impactos: acc.impactos + impactos
                                        };
                                    }, { investimento: 0, impactos: 0 });

                                    const cpm = totals.impactos > 0 ? (totals.investimento / totals.impactos) * 1000 : 0;

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
                                                <div className="ml-auto flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-gray-400 uppercase tracking-wider text-[10px]">Impactos:</span>
                                                        <span className="font-medium text-gray-700">{formatNumber(totals.impactos)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-gray-400 uppercase tracking-wider text-[10px]">CPM:</span>
                                                        <span className="font-medium text-blue-600">{formatCurrency(cpm)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs">
                                                        <span className="text-gray-400 uppercase tracking-wider text-[10px]">Investimento:</span>
                                                        <span className="font-medium text-emerald-700">{formatCurrency(totals.investimento)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Group Rows */}
                                            {!isCollapsed && groupRows.map(row => (
                                                <div
                                                    key={row.id}
                                                    data-row-id={row.original.id}
                                                    className={`flex items-center border-b border-gray-200 transition-colors group min-h-[44px] 
                                                        ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
                                                        ${row.original.status === 'pendente_validacao' ? 'opacity-70 bg-orange-50/30' : ''}
                                                    `}
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
                                                                                const currentItem = itens.find(item => item.id === row.original.id);
                                                                                let value = currentItem ? (currentItem as any)[columnId] : (row.original as any)[columnId];
                                                                                if (columnId === 'periodo') {
                                                                                    value = {
                                                                                        periodo_inicio: currentItem?.periodo_inicio || row.original.periodo_inicio,
                                                                                        periodo_fim: currentItem?.periodo_fim || row.original.periodo_fim
                                                                                    };
                                                                                }
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
                                        className={`flex items-center border-b border-gray-200 transition-colors group min-h-[44px] 
                                            ${row.getIsSelected() ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'}
                                            ${row.original.status === 'pendente_validacao' ? 'opacity-70 bg-orange-50/30' : ''}
                                        `}
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

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                proposta={selectedProposta}
                onUpdate={handleShareUpdate}
            />
        </div >
    );
}
