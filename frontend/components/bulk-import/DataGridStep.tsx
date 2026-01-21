'use client';

import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { DataGrid, Column, RenderHeaderCellProps, RenderCellProps, RenderEditCellProps } from 'react-data-grid';
import { Upload, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { normalizeField } from '@/lib/dataNormalizers';
import { TiposMultiSelectEditor } from './TiposMultiSelectEditor';
import { PeriodoEditor } from './CustomCellEditors';
import { PERIODO_LOCACAO } from '@/constants/oohTypes';
import 'react-data-grid/lib/styles.css';

// Field options for column mapping
const FIELD_OPTIONS = [
    { value: 'ignore', label: '--- Não usar ---', required: false },
    { value: 'codigo_ooh', label: 'Código OOH', required: true },
    { value: 'endereco', label: 'Endereço', required: true },
    { value: 'latitude', label: 'Latitude', required: true },
    { value: 'longitude', label: 'Longitude', required: true },
    { value: 'medidas', label: 'Medidas', required: false },
    { value: 'fluxo', label: 'Fluxo', required: false },
    { value: 'tipos', label: 'Tipos', required: false },
    { value: 'observacoes', label: 'Observações', required: false },
    { value: 'ponto_referencia', label: 'Ponto de Referência', required: false },
    { value: 'valor_locacao', label: 'Valor Locação', required: false },
    { value: 'periodo_locacao', label: 'Período Locação', required: false },
    { value: 'valor_papel', label: 'Valor Papel', required: false },
    { value: 'valor_lona', label: 'Valor Lona', required: false },
];

interface CellValidation {
    severity: 'valid' | 'warning' | 'error';
    message?: string;
}

interface GridRow {
    id: number;
    [key: string]: any;
}

export default function DataGridStep() {
    const session = useBulkImportStore((state) => state.session);
    const setExcelData = useBulkImportStore((state) => state.setExcelData);
    const setColumnMapping = useBulkImportStore((state) => state.setColumnMapping);

    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [rows, setRows] = useState<GridRow[]>([]);
    const [cellValidations, setCellValidations] = useState<Record<string, CellValidation>>({});
    const [originalData, setOriginalData] = useState<any[][]>([]);

    const headers = session?.columnHeaders || [];
    const rawRows = session?.excelData || [];

    // File upload handler - NO NORMALIZATION
    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length === 0) {
                    alert('Arquivo vazio');
                    return;
                }

                const columnHeaders = jsonData[0].map(h => String(h || ''));
                const rawData = jsonData.slice(1);

                // Store RAW data (no normalization)
                setOriginalData(rawData);

                const { session } = useBulkImportStore.getState();
                if (session) {
                    useBulkImportStore.setState({
                        session: {
                            ...session,
                            columnHeaders,
                            excelData: rawData, // RAW data
                            originalExcelData: rawData,
                            columnMapping: {},
                            cellCorrections: {}
                        }
                    });
                } else {
                    setExcelData(columnHeaders, rawData);
                }

                // Initialize mapping as all 'ignore'
                const initialMapping: Record<string, string> = {};
                columnHeaders.forEach((_, idx) => {
                    initialMapping[idx.toString()] = 'ignore';
                });
                setMapping(initialMapping);
                setCellValidations({});
            } catch (error) {
                console.error('Error parsing file:', error);
                alert('Erro ao ler arquivo');
            }
        };
        reader.readAsBinaryString(file);
    }, [setExcelData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.ms-excel': ['.xls'],
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        },
        maxFiles: 1,
        maxSize: 5 * 1024 * 1024,
    });

    // Convert raw rows to grid rows
    useEffect(() => {
        if (rawRows.length > 0 && headers.length > 0) {
            const gridRows: GridRow[] = rawRows.map((row: any, idx: number) => {
                const gridRow: GridRow = { id: idx };
                headers.forEach((header, colIdx) => {
                    gridRow[`col_${colIdx}`] = row[colIdx];
                });
                return gridRow;
            });
            setRows(gridRows);
        }
    }, [rawRows, headers]);

    // Normalize and validate column when mapping changes
    const normalizeColumn = useCallback((colIdx: number, fieldName: string) => {
        if (fieldName === 'ignore' || rawRows.length === 0) {
            // Clear validations for this column
            const newValidations = { ...cellValidations };
            rawRows.forEach((_, rowIdx) => {
                delete newValidations[`${rowIdx}-${colIdx}`];
            });
            setCellValidations(newValidations);
            return;
        }

        const newValidations: Record<string, CellValidation> = { ...cellValidations };
        const updatedData = [...rawRows];

        rawRows.forEach((row, rowIdx) => {
            const cellKey = `${rowIdx}-${colIdx}`;
            const originalValue = originalData[rowIdx]?.[colIdx];

            // Skip normalization for codigo_ooh - keep as-is
            if (fieldName === 'codigo_ooh') {
                const trimmed = originalValue ? String(originalValue).trim() : originalValue;
                updatedData[rowIdx] = [...updatedData[rowIdx]];
                updatedData[rowIdx][colIdx] = trimmed;

                if (!trimmed) {
                    newValidations[cellKey] = {
                        severity: 'error',
                        message: 'Código OOH é obrigatório'
                    };
                } else {
                    newValidations[cellKey] = {
                        severity: 'valid'
                    };
                }
                return;
            }

            // Normalize and validate other fields
            const result = normalizeField(fieldName, originalValue);

            if (result.success) {
                // Update data with normalized value
                updatedData[rowIdx] = [...updatedData[rowIdx]];
                updatedData[rowIdx][colIdx] = result.value;

                // Only show warning for EMPTY optional fields, not for normalized values
                const isOptionalField = !['codigo_ooh', 'endereco', 'latitude', 'longitude'].includes(fieldName);
                const isEmpty = !originalValue || String(originalValue).trim() === '';

                if (isEmpty && isOptionalField) {
                    newValidations[cellKey] = {
                        severity: 'warning',
                        message: 'Campo opcional vazio'
                    };
                } else {
                    newValidations[cellKey] = {
                        severity: 'valid'
                    };
                }
            } else {
                // Keep original value but mark as error
                updatedData[rowIdx] = [...updatedData[rowIdx]];
                updatedData[rowIdx][colIdx] = originalValue;

                newValidations[cellKey] = {
                    severity: 'error',
                    message: result.error || 'Valor inválido'
                };
            }
        });

        // Update store
        const { session } = useBulkImportStore.getState();
        if (session) {
            useBulkImportStore.setState({
                session: {
                    ...session,
                    excelData: updatedData
                }
            });
        }

        setCellValidations(newValidations);
    }, [rawRows, originalData, cellValidations]);

    // Handle mapping change
    const handleMappingChange = (colIndex: number, value: string) => {
        const newMapping = {
            ...mapping,
            [colIndex.toString()]: value,
        };
        setMapping(newMapping);
        setColumnMapping(newMapping);

        // Normalize column immediately
        normalizeColumn(colIndex, value);
    };

    // Handle cell edit
    const handleRowsChange = (newRows: GridRow[]) => {
        setRows(newRows);

        // Convert back to array format
        const updatedData = newRows.map(row => {
            return headers.map((_, colIdx) => row[`col_${colIdx}`]);
        });

        // Update store
        const { session } = useBulkImportStore.getState();
        if (session) {
            useBulkImportStore.setState({
                session: {
                    ...session,
                    excelData: updatedData
                }
            });
        }
    };

    // Re-validate cell after edit
    const revalidateCell = (rowIdx: number, colIdx: number, value: any) => {
        const fieldName = mapping[colIdx.toString()];
        if (!fieldName || fieldName === 'ignore') return;

        const cellKey = `${rowIdx}-${colIdx}`;

        // Skip normalization for codigo_ooh
        if (fieldName === 'codigo_ooh') {
            const trimmed = value ? String(value).trim() : value;
            const newValidations = { ...cellValidations };

            if (!trimmed) {
                newValidations[cellKey] = {
                    severity: 'error',
                    message: 'Código OOH é obrigatório'
                };
            } else {
                newValidations[cellKey] = {
                    severity: 'valid'
                };
            }

            const updatedRows = [...rows];
            updatedRows[rowIdx] = {
                ...updatedRows[rowIdx],
                [`col_${colIdx}`]: trimmed
            };
            setRows(updatedRows);
            setCellValidations(newValidations);
            return;
        }

        const result = normalizeField(fieldName, value);
        const newValidations = { ...cellValidations };

        if (result.success) {
            // Only show warning for empty optional fields
            const isOptionalField = !['codigo_ooh', 'endereco', 'latitude', 'longitude'].includes(fieldName);
            const isEmpty = !value || String(value).trim() === '';

            if (isEmpty && isOptionalField) {
                newValidations[cellKey] = {
                    severity: 'warning',
                    message: 'Campo opcional vazio'
                };
            } else {
                newValidations[cellKey] = {
                    severity: 'valid'
                };
            }

            // Update with normalized value
            const updatedRows = [...rows];
            updatedRows[rowIdx] = {
                ...updatedRows[rowIdx],
                [`col_${colIdx}`]: result.value
            };
            setRows(updatedRows);
        } else {
            newValidations[cellKey] = {
                severity: 'error',
                message: result.error || 'Valor inválido'
            };
        }

        setCellValidations(newValidations);
    };

    // Header renderer
    const HeaderRenderer = ({ column }: RenderHeaderCellProps<GridRow>) => {
        const colIdx = parseInt(column.key.replace('col_', ''));
        const mappedField = mapping[colIdx.toString()] || 'ignore';
        const fieldOption = FIELD_OPTIONS.find(f => f.value === mappedField);
        const originalHeader = headers[colIdx];

        return (
            <div className="flex flex-col gap-1.5 py-2 px-1 h-full justify-center">
                <div className="text-sm font-bold text-gray-900 truncate leading-tight" title={originalHeader}>
                    {originalHeader || '(sem nome)'}
                </div>
                <select
                    value={mappedField}
                    onChange={(e) => handleMappingChange(colIdx, e.target.value)}
                    className={cn(
                        'text-xs font-medium px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-emidias-primary/30 transition-colors',
                        fieldOption?.required
                            ? 'bg-pink-50 border-emidias-accent text-emidias-accent'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                    )}
                    onClick={(e) => e.stopPropagation()}
                    title={mappedField !== 'ignore' ? `Mapeado como: ${fieldOption?.label}` : 'Selecione um campo'}
                >
                    {FIELD_OPTIONS.map(opt => {
                        const isSelectedElsewhere = Object.entries(mapping).some(([key, val]) => {
                            return val === opt.value && key !== colIdx.toString();
                        });
                        const isDisabled = isSelectedElsewhere && opt.value !== 'ignore';

                        return (
                            <option
                                key={opt.value}
                                value={opt.value}
                                disabled={isDisabled}
                                style={isDisabled ? { color: '#ef4444', fontWeight: 'bold' } : {}}
                            >
                                {opt.label}{isDisabled ? ' ⛔' : ''}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    };

    // Cell renderer with validation colors
    const CellRenderer = ({ row, column }: RenderCellProps<GridRow>) => {
        const colIdx = parseInt(column.key.replace('col_', ''));
        const fieldName = mapping[colIdx.toString()];
        const value = row[column.key];
        const cellKey = `${row.id}-${colIdx}`;
        const validation = cellValidations[cellKey];

        // Format display based on field type
        let displayValue = value != null ? String(value) : null;

        if (displayValue && fieldName) {
            // Format monetary values with R$
            if (['valor_locacao', 'valor_papel', 'valor_lona'].includes(fieldName)) {
                const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                if (!isNaN(numValue)) {
                    displayValue = numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                }
            }
            // Format fluxo with thousand separator
            else if (fieldName === 'fluxo') {
                const numValue = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''));
                if (!isNaN(numValue)) {
                    displayValue = numValue.toLocaleString('pt-BR');
                }
            }
        }

        // Determine cell styling based on validation
        let cellClassName = "w-full h-full flex items-center px-2";
        let icon = null;

        if (validation) {
            if (validation.severity === 'error') {
                cellClassName += " bg-red-100 border-l-4 border-red-500";
                icon = <AlertCircle size={14} className="text-red-600 ml-auto flex-shrink-0" />;
            } else if (validation.severity === 'warning') {
                cellClassName += " bg-yellow-50 border-l-4 border-yellow-400";
                icon = <Info size={14} className="text-yellow-600 ml-auto flex-shrink-0" />;
            } else if (validation.severity === 'valid') {
                cellClassName += " bg-green-50 border-l-4 border-green-400";
                icon = <CheckCircle2 size={14} className="text-green-600 ml-auto flex-shrink-0" />;
            }
        }

        return (
            <div className={cellClassName} title={validation?.message}>
                <span className="truncate">
                    {displayValue != null ? displayValue : <span className="text-gray-300 italic">vazio</span>}
                </span>
                {icon}
            </div>
        );
    };

    // Edit cell renderer
    const EditCellRenderer = ({ row, column, onRowChange, onClose }: RenderEditCellProps<GridRow>) => {
        const colIdx = parseInt(column.key.replace('col_', ''));
        const fieldName = mapping[colIdx.toString()];
        const initialValue = row[column.key];
        const currentValueRef = useRef(initialValue);
        const [localValue, setLocalValue] = useState(initialValue);

        const handleChange = (newValue: any) => {
            currentValueRef.current = newValue;
            setLocalValue(newValue);
            onRowChange({ ...row, [column.key]: newValue });
        };

        const handleBlur = () => {
            const valueToValidate = currentValueRef.current;

            // Re-validate
            revalidateCell(row.id, colIdx, valueToValidate);

            onClose(true);
        };

        const handleKeyDown = (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                handleBlur();
            } else if (e.key === 'Escape') {
                onClose(false);
            }
        };

        // Custom editors for specific field types
        switch (fieldName) {
            case 'tipos':
                return (
                    <TiposMultiSelectEditor
                        value={String(localValue || '')}
                        onChange={handleChange}
                        onClose={() => {
                            revalidateCell(row.id, colIdx, currentValueRef.current);
                            onClose(true);
                        }}
                    />
                );

            case 'periodo_locacao':
                return (
                    <PeriodoEditor
                        value={String(localValue || '')}
                        onChange={handleChange}
                        onClose={() => {
                            revalidateCell(row.id, colIdx, currentValueRef.current);
                            onClose(true);
                        }}
                    />
                );

            default:
                return (
                    <input
                        className="w-full h-full px-2 text-sm border-2 border-emidias-primary focus:outline-none"
                        value={String(localValue || '')}
                        onChange={(e) => handleChange(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                );
        }
    };

    // Create columns
    const columns: Column<GridRow>[] = useMemo(() => {
        return headers.map((header, idx) => ({
            key: `col_${idx}`,
            name: header,
            width: 180,
            resizable: true,
            editable: true,
            renderHeaderCell: HeaderRenderer,
            renderCell: CellRenderer,
            renderEditCell: EditCellRenderer,
        }));
    }, [headers, mapping, cellValidations]);

    // Count errors
    const errorCount = useMemo(() => {
        return Object.values(cellValidations).filter(v => v.severity === 'error').length;
    }, [cellValidations]);

    const warningCount = useMemo(() => {
        return Object.values(cellValidations).filter(v => v.severity === 'warning').length;
    }, [cellValidations]);

    const validCount = useMemo(() => {
        return Object.values(cellValidations).filter(v => v.severity === 'valid').length;
    }, [cellValidations]);

    // Check if can proceed
    const canProceed = useMemo(() => {
        const mappedFields = Object.values(mapping).filter(v => v !== 'ignore');
        const requiredFields = ['codigo_ooh', 'endereco', 'latitude', 'longitude'];
        const allRequiredMapped = requiredFields.every(field => mappedFields.includes(field));

        return allRequiredMapped && errorCount === 0;
    }, [mapping, errorCount]);

    // Update store canProceed
    useEffect(() => {
        const { session } = useBulkImportStore.getState();
        if (session) {
            // Store validation status for modal to check
            (window as any).__bulkImportCanProceed = canProceed;
        }
    }, [canProceed]);

    // Show upload if no data
    if (headers.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[500px]">
                <div
                    {...getRootProps()}
                    className={cn(
                        'w-full max-w-2xl p-12 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                        isDragActive
                            ? 'border-emidias-primary bg-emidias-primary/5'
                            : 'border-gray-300 hover:border-emidias-primary hover:bg-gray-50'
                    )}
                >
                    <input {...getInputProps()} />
                    <div className="text-center space-y-4">
                        <Upload size={48} className="mx-auto text-gray-400" />
                        <div>
                            <p className="text-lg font-semibold text-gray-900">
                                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo Excel/CSV'}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                ou clique para selecionar
                            </p>
                        </div>
                        <p className="text-xs text-gray-400">
                            Formatos aceitos: .xlsx, .xls, .csv (máx. 5MB)
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Validation Summary */}
            {(errorCount > 0 || warningCount > 0 || validCount > 0) && (
                <div className="flex items-center gap-3 flex-wrap">
                    {validCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                            <CheckCircle2 size={14} />
                            {validCount} válidas
                        </div>
                    )}
                    {warningCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm font-medium border border-yellow-200">
                            <Info size={14} />
                            {warningCount} avisos
                        </div>
                    )}
                    {errorCount > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm font-medium border border-red-200">
                            <AlertCircle size={14} />
                            {errorCount} erros (corrija para prosseguir)
                        </div>
                    )}
                </div>
            )}

            {/* Data Grid - EDITABLE */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <DataGrid
                    columns={columns}
                    rows={rows}
                    onRowsChange={handleRowsChange}
                    rowKeyGetter={(row) => row.id}
                    headerRowHeight={80}
                    rowHeight={35}
                    style={{ height: 500 }}
                    className="rdg-light"
                />
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-50 border-l-2 border-green-400 rounded-sm"></div>
                    <span>Válido</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-yellow-50 border-l-2 border-yellow-400 rounded-sm"></div>
                    <span>Aviso</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-red-100 border-l-2 border-red-500 rounded-sm"></div>
                    <span>Erro (corrija)</span>
                </div>
            </div>
        </div>
    );
}
