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
    readOnly?: boolean;
}

export default function CartTable({ isOpen, onToggle, isClientView = false, readOnly = false, proposta }: CartTableProps) {
    const storeSelectedProposta = useStore((state) => state.selectedProposta);
    const selectedProposta = proposta || storeSelectedProposta;

    const refreshProposta = useStore((state) => state.refreshProposta);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const pontos = useStore((state) => state.pontos);

    const [itens, setItens] = useState<PropostaItem[]>([]);
    // Mini-Mode Toggle
    const [isCollapsed, setIsCollapsed] = useState(false);

    const [isSyncing, setIsSyncing] = useState(false);

    // Table State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
        latitude: false,
        longitude: false,
        observacoes: false
    });
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

    // Column Reordering State
    const [columnOrder, setColumnOrder] = useState<string[]>([]);
    const [draggingColumn, setDraggingColumn] = useState<string | null>(null);
    const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

    // State to inhibit dragging when interacting with resizer
    const [disableDrag, setDisableDrag] = useState(false);



    // Height Resizing State
    const [tableHeight, setTableHeight] = useState(500);
    const isResizingRef = useRef(false);
    const startYRef = useRef(0);
    const startHeightRef = useRef(0);

    const user = useStore(state => state.user);
    const isInternal = !!user && user.type === 'internal';
    // Only show status column if proposal is actually IN VALIDATION or APPROVED.
    // Draft proposals should not show this column, even for internal users.
    const showStatusColumn = selectedProposta?.status === 'em_validacao' || selectedProposta?.status === 'aprovado';

    const canEditValues = !readOnly && selectedProposta?.currentUserRole === 'admin';
    const canEditItems = !readOnly; // Editors can add/remove and change periods

    const handleApproveProposal = async () => {
        if (!selectedProposta) return;
        if (!confirm('Deseja enviar esta proposta para validaÃ§Ã£o?')) return;

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
            alert('Todos os itens devem estar Aprovados ou IndisponÃ­veis para concluir.');
            return;
        }

        if (!confirm('Deseja concluir a validaÃ§Ã£o desta proposta? O cliente serÃ¡ notificado.')) return;

        try {
            await api.updateProposalStatus(selectedProposta.id, 'aprovado');
            refreshProposta({ ...selectedProposta, status: 'aprovado' });
        } catch (error) {
            console.error('Failed to conclude validation', error);
            alert('Falha ao concluir validaÃ§Ã£o');
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
            // console.log('ðŸ›’ CartTable recebeu itens:', selectedProposta.itens);
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
        console.log(`ðŸ“ CartTable updateItem called:`, { id, updates });

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

                console.log(`âœ… Updated item:`, updatedItem);
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

                console.log('ðŸŽ¯ Drag-fill applying:', {
                    columnKey: dragState.columnKey,
                    value: dragState.startValue,
                    fromRow: minIdx,
                    toRow: maxIdx,
                    totalRows: maxIdx - minIdx + 1
                });

                // Apply the value to all rows in range
                for (let i = minIdx; i <= maxIdx; i++) {
                    // Handle perÃ­odo specially (it has two date fields)
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
                console.log('âœ… Drag-fill completed. Updated items:', updatedItens.slice(minIdx, maxIdx + 1).map(item => ({
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
        console.log('ðŸŽ¯ Starting drag from row:', rowId, 'column:', columnKey, 'value:', value);

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



    const handleColumnDragStart = (e: React.DragEvent, headerId: string) => {
        setDraggingColumn(headerId);
        e.dataTransfer.effectAllowed = 'move';
        // Create an invisible drag image or style it if needed
        // e.dataTransfer.setDragImage(img, 0, 0);
    };

    const handleColumnDragOver = (e: React.DragEvent, headerId: string) => {
        e.preventDefault(); // Allow drop
        if (draggingColumn && draggingColumn !== headerId) {
            setDragOverColumn(headerId);
        }
    };

    const handleColumnDragLeave = () => {
        setDragOverColumn(null);
    };

    const handleColumnDrop = (e: React.DragEvent, targetHeaderId: string) => {
        e.preventDefault();
        setDragOverColumn(null);

        if (!draggingColumn || draggingColumn === targetHeaderId) {
            setDraggingColumn(null);
            return;
        }

        const newOrder = [...columnOrder];
        const draggedIdx = newOrder.indexOf(draggingColumn);
        const targetIdx = newOrder.indexOf(targetHeaderId);

        if (draggedIdx !== -1 && targetIdx !== -1) {
            newOrder.splice(draggedIdx, 1);
            newOrder.splice(targetIdx, 0, draggingColumn);
            setColumnOrder(newOrder);
        }

        setDraggingColumn(null);
    };


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
                    'VALIDATION': { label: 'Em ValidaÃ§Ã£o', color: 'text-blue-600', bg: 'bg-blue-50' },
                    'APPROVED': { label: 'Aprovado', color: 'text-green-600', bg: 'bg-green-50' },
                    'UNAVAILABLE': { label: 'IndisponÃ­vel', color: 'text-red-600', bg: 'bg-red-50' }
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
                                disabled={!canEditValues}
                            >
                                <option value="PENDING">Pendente</option>
                                <option value="VALIDATION">Em ValidaÃ§Ã£o</option>
                                <option value="APPROVED">Aprovado</option>
                                <option value="UNAVAILABLE">IndisponÃ­vel</option>
                            </select>
                        )
                        }
                    </div >
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
            accessorKey: 'cidade', // "PraÃ§a" in user image seems to map to Cidade
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal">
                    <MapPin size={13} />
                    <span>PraÃ§a</span>
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
                    <span>EndereÃ§o</span>
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
                    <span>CÃ³digo OOH</span>
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
                    <span>PerÃ­odo de ExibiÃ§Ã£o</span>
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
                            disabled={readOnly}
                        />
                        <span className="text-gray-300 text-[10px] mx-0.5">â†’</span>
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
                            disabled={readOnly}
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
                    <span>PerÃ­odo comercializado</span>
                </div>
            ),
            size: 140,
            cell: ({ row }) => {
                const currentValue = row.original.periodo_comercializado || 'bissemanal';
                return (
                    <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors">
                        <select
                            className={`w-full bg-transparent border-none text-[13px] text-gray-700 focus:ring-0 p-0 cursor-pointer ${!isInternal ? 'cursor-default appearance-none' : ''}`}
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
                            disabled={readOnly || !isInternal}
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
                    <span>{isClientView ? 'Valor' : 'LocaÃ§Ã£o'}</span>
                </div>
            ),
            size: 120,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors flex items-center justify-end">
                    <input
                        type="text"
                        readOnly={!canEditValues || !isInternal}
                        disabled={!canEditValues || !isInternal}
                        className={`w-full bg-transparent border-none text-right focus:ring-0 p-0 text-[13px] text-gray-700 font-normal ${isClientView || !isInternal ? 'cursor-default' : ''}`}
                        defaultValue={formatCurrency(row.original.valor_locacao || 0)}
                        data-row-id={row.original.id}
                        data-column-id="valor_locacao"
                        onBlur={(e) => {
                            if (isClientView || !isInternal) return;
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
                            if (!isClientView && isInternal) e.target.select();
                        }}
                        onKeyDown={(e) => !isClientView && isInternal && !readOnly && handleKeyDown(e, row.original.id, 'valor_locacao', itens)}
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
                        readOnly={readOnly || !isInternal}
                        disabled={readOnly || !isInternal}
                        className={`w-full bg-transparent border-none text-right focus:ring-0 p-0 text-[13px] text-gray-700 ${!isInternal ? 'cursor-default' : ''}`}
                        defaultValue={formatCurrency(row.original.valor_papel || 0)}
                        data-row-id={row.original.id}
                        data-column-id="valor_papel"
                        onBlur={(e) => {
                            if (!isInternal) return;
                            const valStr = e.target.value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                            const newValue = parseFloat(valStr);
                            if (!isNaN(newValue) && newValue !== row.original.valor_papel) {
                                updateItem(row.original.id, 'valor_papel', newValue);
                            }
                            if (!isNaN(newValue)) e.target.value = formatCurrency(newValue);
                            else e.target.value = formatCurrency(row.original.valor_papel || 0);
                        }}
                        onFocus={(e) => !isInternal ? e.target.blur() : e.target.select()}
                        onKeyDown={(e) => !readOnly && isInternal && handleKeyDown(e, row.original.id, 'valor_papel', itens)}
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
                        readOnly={readOnly || !isInternal}
                        disabled={readOnly || !isInternal}
                        className={`w-full bg-transparent border-none text-right focus:ring-0 p-0 text-[13px] text-gray-700 ${!isInternal ? 'cursor-default' : ''}`}
                        defaultValue={formatCurrency(row.original.valor_lona || 0)}
                        data-row-id={row.original.id}
                        data-column-id="valor_lona"
                        onBlur={(e) => {
                            if (!isInternal) return;
                            const valStr = e.target.value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
                            const newValue = parseFloat(valStr);
                            if (!isNaN(newValue) && newValue !== row.original.valor_lona) {
                                updateItem(row.original.id, 'valor_lona', newValue);
                            }
                            if (!isNaN(newValue)) e.target.value = formatCurrency(newValue);
                            else e.target.value = formatCurrency(row.original.valor_lona || 0);
                        }}
                        onFocus={(e) => !isInternal ? e.target.blur() : e.target.select()}
                        onKeyDown={(e) => !readOnly && isInternal && handleKeyDown(e, row.original.id, 'valor_lona', itens)}
                    />
                </div>
            )
        },
        {
            id: 'qtd_bi_mes',
            header: () => (
                <div className="flex items-center gap-1.5 text-gray-500 font-normal justify-end w-full">
                    <Hash size={13} />
                    <span>Qtd. Bi/MÃªs</span>
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
                    <span>Ponto de ReferÃªncia</span>
                </div>
            ),
            size: 200,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors">
                    <input
                        type="text"
                        readOnly={readOnly || !isInternal}
                        disabled={readOnly || !isInternal}
                        className={`w-full bg-transparent border-none focus:ring-0 p-0 text-[13px] text-gray-700 placeholder-gray-300 ${!isInternal ? 'cursor-default' : ''}`}
                        defaultValue={row.original.ponto_referencia || ''}
                        placeholder={!isInternal ? (row.original.ponto_referencia || '-') : "Vazio"}
                        onBlur={(e) => {
                            if (!isInternal) return;
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
                    <span>ObservaÃ§Ãµes</span>
                </div>
            ),
            size: 200,
            cell: ({ row }) => (
                <div className="h-full -m-2 p-2 hover:bg-gray-50 transition-colors">
                    <input
                        type="text"
                        readOnly={readOnly}
                        disabled={readOnly}
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
                !readOnly && (
                    <button
                        onClick={() => removeItem(row.original.id)}
                        className="flex justify-center w-full opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        title="Remover"
                    >
                        <Trash2 size={14} />
                    </button>
                )
            )
        }
    ], [updateItem, removeItem, pontos, setSelectedPonto, itens, focusedCell, showStatusColumn, isClientView, readOnly]);

    // Initialize & Load Column Order
    useEffect(() => {
        // Try to load from localStorage first
        const savedOrder = localStorage.getItem('cartTable_columnOrder');
        if (savedOrder) {
            try {
                const parsed = JSON.parse(savedOrder);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setColumnOrder(parsed);
                    return;
                }
            } catch (e) {
                console.warn('Failed to parse saved column order', e);
            }
        }

        // Default initialization if no saved order
        if (columns.length > 0 && columnOrder.length === 0) {
            setColumnOrder(columns.map(c => c.id || (c as any).accessorKey as string).filter(Boolean));
        }
    }, [columns]); // Run once when columns are defined

    // Persist Column Order
    useEffect(() => {
        if (columnOrder.length > 0) {
            localStorage.setItem('cartTable_columnOrder', JSON.stringify(columnOrder));
        }
    }, [columnOrder]);

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
                'CÃ³digo OOH': item.codigo_ooh,
                'Exibidora': item.exibidora_nome || item.exibidora,
                'Cidade': item.cidade,
                'UF': item.uf,
                'EndereÃ§o': item.endereco,
                'Produto': item.tipo,
                'Medidas': item.medidas,
                'InÃ­cio': item.periodo_inicio,
                'Fim': item.periodo_fim,
                'PerÃ­odo': item.periodo_comercializado,
                'Investimento': total,
                // Only include other costs if NOT client view
                ...(!isClientView ? {
                    'LocaÃ§Ã£o Unit.': item.valor_locacao,
                    'Papel': item.valor_papel,
                    'Lona': item.valor_lona,
                } : {}),
                'Impactos': item.fluxo_diario, // Approximate
                'ObservaÃ§Ãµes': item.observacoes
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
        doc.text(selectedProposta?.nome || 'Proposta de MÃ­dia OOH', 14, 22);

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
            head: [['CÃ³digo', 'Cidade', 'EndereÃ§o', 'PerÃ­odo', 'Medidas', 'Investimento']],
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
            columnOrder,
        },
        columnResizeMode: 'onChange',
        enableRowSelection: !readOnly,
        getRowId: row => String(row.id),
        onSortingChange: setSorting,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onColumnSizingChange: setColumnSizing,
        onColumnOrderChange: setColumnOrder,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (!selectedProposta) return null;
    if (!isOpen) return null;

    // --- Mini-Mode View ---
    if (isCollapsed) {
        const totalItems = itens.length;
        const totalValue = itens.reduce((acc, item) => acc + (item.valor_locacao || 0), 0);

        return (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="bg-white/90 backdrop-blur-xl shadow-2xl shadow-black/20 border border-white/20 rounded-full px-6 py-3 flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100/50 flex items-center justify-center text-blue-600">
                            <Box size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Itens</span>
                            <span className="text-sm font-bold text-gray-900">{totalItems}</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-gray-200" />

                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100/50 flex items-center justify-center text-green-600">
                            <DollarSign size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total</span>
                            <span className="text-sm font-bold text-gray-900">{formatCurrency(totalValue)}</span>
                        </div>
                    </div>

                    <div className="w-px h-8 bg-gray-200" />

                    <Button
                        onClick={() => setIsCollapsed(false)}
                        variant="ghost"
                        size="sm"
                        className="rounded-full hover:bg-gray-100"
                    >
                        <ChevronUp size={20} className="text-gray-600" />
                        <span className="ml-2 font-medium">Expandir</span>
                    </Button>
                </div>
            </div>
        );
    }

    // --- Expanded View (Standard Table) ---
    return (
        <div
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] border-t border-gray-200/50 transition-all duration-300 ease-out flex flex-col"
            style={{ height: `${tableHeight}px` }}
        >
            {/* Resize Handle / Header */}
            <div
                className="h-9 w-full flex items-center justify-center cursor-row-resize hover:bg-gray-100/50 transition-colors border-b border-gray-100 group relative"
                onMouseDown={startResizing}
            >
                <div className="w-16 h-1 bg-gray-300 rounded-full group-hover:bg-blue-400 transition-colors" />

                {/* Collapse Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsCollapsed(true);
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-gray-600 transition-all"
                    title="Minimizar"
                >
                    <ChevronDown size={16} />
                </button>

                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Box size={12} />
                    {itens.length} itens
                    <span className="mx-1">â€¢</span>
                    <DollarSign size={12} />
                    {formatCurrency(itens.reduce((acc, i) => acc + (i.valor_locacao || 0), 0))}
                </div>
            </div>

            {/* Toolbar */}
            <div className="px-4 py-2 flex items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/30">
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    {/* Group By */}
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-gray-400 px-2">Agrupar:</span>
                        <div className="flex gap-1">
                            {['none', 'cidade', 'uf', 'exibidora_nome'].map((field) => (
                                <button
                                    key={field}
                                    onClick={() => setGroupBy(field as any)}
                                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all ${groupBy === field ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {field === 'none' ? 'Nenhum' : field === 'exibidora_nome' ? 'Exibidora' : field.charAt(0).toUpperCase() + field.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Column Visibility */}
                    <div className="relative">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                            className="h-8 text-xs gap-1.5 bg-white shadow-sm"
                        >
                            <Settings size={13} />
                            Colunas
                        </Button>

                        {isSettingsOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsSettingsOpen(false)} />
                                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 p-2 animate-in fade-in zoom-in-95">
                                    <p className="px-2 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Exibir Colunas</p>
                                    {Object.keys(columnVisibility).map((colId) => (
                                        <label key={colId} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-600">
                                            <input
                                                type="checkbox"
                                                checked={columnVisibility[colId]}
                                                onChange={(e) => setColumnVisibility(prev => ({ ...prev, [colId]: e.target.checked }))}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                                            />
                                            {colId === 'latitude' ? 'Latitude' : colId === 'longitude' ? 'Longitude' : colId === 'observacoes' ? 'ObservaÃ§Ãµes' : colId}
                                        </label>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {isClientView && (
                        <>
                            <Button
                                onClick={() => handleExportExcel()}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-white shadow-sm"
                            >
                                <FileSpreadsheet size={13} />
                                Excel
                            </Button>
                            <Button
                                onClick={() => handleExportPDF()}
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs gap-1.5 bg-white shadow-sm"
                            >
                                <FilePdfIcon size={13} />
                                PDF
                            </Button>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {user?.type === 'internal' && (
                        <Button
                            onClick={() => setIsShareModalOpen(true)}
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs gap-1.5 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                            <Share2 size={13} />
                            Compartilhar
                        </Button>
                    )}

                    {showStatusColumn && isInternal && (
                        <Button
                            onClick={handleConcludeValidation}
                            variant="secondary"
                            size="sm"
                            className="h-8 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                        >
                            <Check size={14} className="mr-1.5" />
                            Concluir ValidaÃ§Ã£o
                        </Button>
                    )}
                    {!showStatusColumn && isInternal && (
                        <Button
                            onClick={handleApproveProposal}
                            className="h-8 bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20"
                            size="sm"
                        >
                            <Check size={14} className="mr-1.5" />
                            Enviar p/ AprovaÃ§Ã£o
                        </Button>
                    )}

                    <Button
                        variant="primary"
                        size="sm"
                        className="h-8 shadow-blue-500/20"
                        onClick={() => onToggle()} // Hides the component
                    >
                        Fechar
                    </Button>
                </div>
            </div>

            {/* Table Content */}
            <div className="flex-1 overflow-auto bg-gray-50/30">
                <div className="min-w-[1200px] pb-24">
                    {/* Header Group */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm flex">
                        {table.getFlatHeaders().map(header => {
                            const isSortable = header.column.getCanSort();
                            return (
                                <div
                                    key={header.id}
                                    className={`px-3 py-2 text-left font-medium text-xs uppercase tracking-wider text-gray-500 flex items-center gap-2 group/header hover:bg-gray-50 transition-colors
                                        ${draggingColumn === header.id ? 'opacity-50' : ''}
                                        ${dragOverColumn === header.id ? 'border-l-2 border-blue-500 bg-blue-50' : ''}
                                        ${isSortable ? 'cursor-pointer' : ''}
                                    `}
                                    style={{ width: header.getSize(), flex: `0 0 ${header.getSize()}px` }}
                                    onClick={header.column.getToggleSortingHandler()}
                                    draggable={true}
                                    onDragStart={(e) => handleColumnDragStart(e, header.id)}
                                    onDragOver={(e) => handleColumnDragOver(e, header.id)}
                                    onDragLeave={handleColumnDragLeave}
                                    onDrop={(e) => handleColumnDrop(e, header.id)}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}

                                    {isSortable && (
                                        <div className="ml-auto opacity-0 group-hover/header:opacity-100 transition-opacity">
                                            {{
                                                asc: <ChevronDown size={14} className="text-blue-500 transform rotate-180" />,
                                                desc: <ChevronDown size={14} className="text-blue-500" />,
                                            }[header.column.getIsSorted() as string] ?? <ArrowUpDown size={12} className="text-gray-400" />}
                                        </div>
                                    )}

                                    {/* Resizer */}
                                    <div
                                        onMouseDown={header.getResizeHandler()}
                                        onTouchStart={header.getResizeHandler()}
                                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400 touch-none select-none ${header.column.getIsResizing() ? 'bg-blue-400 w-1' : 'bg-transparent'}`}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* Body */}
                    <div className="divide-y divide-gray-100 bg-white">
                        {/* Grouped View */}
                        {groupBy !== 'none' && groupedData ? (
                            <>
                                {groupedData.map(group => {
                                    /* Logic for group totals */
                                    const groupRows = table.getRowModel().rows.filter(row => {
                                        const rowVal = (row.original as any)[groupBy];
                                        return rowVal === group.name || (!rowVal && group.name === 'Sem categoria');
                                    });

                                    const totals = group.items.reduce((acc, item) => {
                                        const investimento = item.valor_locacao || 0;
                                        const imp = item.impactos || 0;
                                        const dias = (item.periodo_inicio && item.periodo_fim)
                                            ? Math.ceil((new Date(item.periodo_fim).getTime() - new Date(item.periodo_inicio).getTime()) / (1000 * 60 * 60 * 24))
                                            : 0;
                                        const impactos = imp * (dias > 0 ? dias : 1) || 0; // Simplified calculation for display
                                        return {
                                            investimento: acc.investimento + investimento,
                                            impactos: acc.impactos + impactos
                                        };
                                    }, { investimento: 0, impactos: 0 });

                                    return (
                                        <div key={group.name} className="border-b border-gray-200">
                                            {/* Group Header */}
                                            <div
                                                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors sticky top-[37px] z-[5] border-b border-gray-200"
                                                onClick={() => toggleGroupCollapse(group.name)}
                                            >
                                                {collapsedGroups.has(group.name) ? (
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
                                                        <span className="text-gray-400 uppercase tracking-wider text-[10px]">Total:</span>
                                                        <span className="font-medium text-emerald-700">{formatCurrency(totals.investimento)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Group Rows */}
                                            {!collapsedGroups.has(group.name) && groupRows.map(row => (
                                                <div
                                                    key={row.id}
                                                    data-row-id={row.original.id}
                                                    className={`flex items-center border-b border-gray-100 transition-colors group min-h-[44px] 
                                                        ${row.getIsSelected() ? 'bg-blue-50/50' : 'bg-white hover:bg-blue-50/20'}
                                                    `}
                                                >
                                                    {row.getVisibleCells().map(cell => {
                                                        const isEditable = ['periodo', 'periodo_comercializado', 'valor_locacao'].includes(cell.column.id || '');
                                                        return (
                                                            <div
                                                                key={cell.id}
                                                                className={`px-3 py-1.5 border-r border-gray-100 last:border-r-0 flex items-center relative ${isEditable ? 'overflow-visible' : 'overflow-hidden'} ${isInDragRange(row.original.id) && dragState.columnKey === cell.column.id ? '!bg-blue-100 shadow-[inset_0_0_0_2px_rgb(96,165,250)]' : ''}`}
                                                                style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
                                                            >
                                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                                {/* Drag handle */}
                                                                {['periodo', 'valor_locacao'].includes(cell.column.id || '') &&
                                                                    focusedCell.rowId === row.original.id &&
                                                                    (focusedCell.columnId === cell.column.id) && (
                                                                        <div
                                                                            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-600 cursor-crosshair z-10"
                                                                            onMouseDown={(e) => {
                                                                                e.preventDefault(); e.stopPropagation();
                                                                                startDragging(row.original.id, cell.column.id!, (row.original as any)[cell.column.id!]);
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
                                        className={`flex items-center border-b border-gray-100 transition-colors group min-h-[44px] 
                                            ${row.getIsSelected() ? 'bg-blue-50/50' : 'bg-white hover:bg-blue-50/20'}
                                        `}
                                    >
                                        {row.getVisibleCells().map(cell => {
                                            const isEditable = ['periodo', 'periodo_comercializado', 'valor_locacao'].includes(cell.column.id || '');
                                            return (
                                                <div
                                                    key={cell.id}
                                                    className={`px-3 py-1.5 border-r border-gray-100 last:border-r-0 flex items-center relative ${isEditable ? 'overflow-visible' : 'overflow-hidden'} ${isInDragRange(row.original.id) && dragState.columnKey === cell.column.id ? '!bg-blue-100 shadow-[inset_0_0_0_2px_rgb(96,165,250)]' : ''}`}
                                                    style={{ width: cell.column.getSize(), flex: `0 0 ${cell.column.getSize()}px` }}
                                                >
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

            <ShareModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                proposta={selectedProposta}
                onUpdate={handleShareUpdate}
            />
        </div >
    );
}
