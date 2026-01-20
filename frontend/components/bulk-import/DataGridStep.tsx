'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { DataGrid, Column, RenderCellProps, RenderHeaderCellProps, FillEvent } from 'react-data-grid';
import { CheckCircle2, AlertTriangle, XCircle, Filter, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { normalizeField } from '@/lib/dataNormalizers';
import { CellDiff } from './CorrectionDiff';
import 'react-data-grid/lib/styles.css';

// Field options for column mapping
const FIELD_OPTIONS = [
    { value: 'codigo_ooh', label: 'Código OOH', required: true },
    { value: 'endereco', label: 'Endereço', required: true },
    { value: 'latitude', label: 'Latitude', required: true },
    { value: 'longitude', label: 'Longitude', required: true },
    { value: 'cidade', label: 'Cidade', required: false },
    { value: 'uf', label: 'UF', required: false },
    { value: 'pais', label: 'País', required: false },
    { value: 'medidas', label: 'Medidas', required: false },
    { value: 'fluxo', label: 'Fluxo', required: false },
    { value: 'tipos', label: 'Tipos', required: false },
    { value: 'observacoes', label: 'Observações', required: false },
    { value: 'ponto_referencia', label: 'Ponto de Referência', required: false },
    { value: 'valor_locacao', label: 'Valor Locação', required: false },
    { value: 'periodo_locacao', label: 'Período Locação', required: false },
    { value: 'valor_papel', label: 'Valor Papel', required: false },
    { value: 'valor_lona', label: 'Valor Lona', required: false },
    { value: 'ignore', label: '--- Não usar ---', required: false },
];

// Auto-detect column mapping based on header name
function detectColumnMapping(header: string): string {
    const normalized = header.toLowerCase().trim();

    const mappings: Record<string, string> = {
        // Código
        'codigo': 'codigo_ooh',
        'código': 'codigo_ooh',
        'cod': 'codigo_ooh',
        'code': 'codigo_ooh',

        // Endereço
        'endereco': 'endereco',
        'endereço': 'endereco',
        'end': 'endereco',
        'address': 'endereco',
        'addr': 'endereco',

        // Coordenadas
        'lat': 'latitude',
        'latitude': 'latitude',
        'lng': 'longitude',
        'lon': 'longitude',
        'long': 'longitude',
        'longitude': 'longitude',

        // Cidade
        'cidade': 'cidade',
        'city': 'cidade',
        'cid': 'cidade',

        // UF/Estado
        'uf': 'uf',
        'estado': 'uf',
        'state': 'uf',

        // País
        'pais': 'pais',
        'país': 'pais',
        'country': 'pais',

        // Medidas/Tamanho
        'medida': 'medidas',
        'medidas': 'medidas',
        'tamanho': 'medidas',
        'tam': 'medidas',
        'size': 'medidas',
        'dimensao': 'medidas',
        'dimensão': 'medidas',

        // Fluxo
        'fluxo': 'fluxo',
        'flux': 'fluxo',
        'flow': 'fluxo',
        'trafego': 'fluxo',
        'tráfego': 'fluxo',

        // Tipos
        'tipo': 'tipos',
        'tipos': 'tipos',
        'tip': 'tipos',
        'type': 'tipos',
        'midia': 'tipos',
        'mídia': 'tipos',

        // Observações
        'obs': 'observacoes',
        'observacao': 'observacoes',
        'observacoes': 'observacoes',
        'observações': 'observacoes',
        'notes': 'observacoes',

        // Ponto de Referência
        'referencia': 'ponto_referencia',
        'referência': 'ponto_referencia',
        'ref': 'ponto_referencia',
        'reference': 'ponto_referencia',

        // Locação
        'locacao': 'valor_locacao',
        'locação': 'valor_locacao',
        'loc': 'valor_locacao',
        'aluguel': 'valor_locacao',
        'rent': 'valor_locacao',
        'valor locacao': 'valor_locacao',
        'valor locação': 'valor_locacao',

        // Período
        'periodo': 'periodo_locacao',
        'período': 'periodo_locacao',
        'per': 'periodo_locacao',
        'period': 'periodo_locacao',

        // Papel
        'papel': 'valor_papel',
        'paper': 'valor_papel',

        // Lona
        'lona': 'valor_lona',
        'canvas': 'valor_lona',
    };

    for (const [key, value] of Object.entries(mappings)) {
        if (normalized.includes(key)) return value;
    }

    return 'ignore';
}

interface GridRow {
    id: number;
    status: 'valid' | 'warning' | 'error';
    [key: string]: any;
}

export default function DataGridStep() {
    const session = useBulkImportStore((state) => state.session);
    const setExcelData = useBulkImportStore((state) => state.setExcelData);
    const setColumnMapping = useBulkImportStore((state) => state.setColumnMapping);

    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = useState(false);
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'valid' | 'errors' | 'warnings'>('all');
    const [rows, setRows] = useState<GridRow[]>([]);

    const headers = session?.columnHeaders || [];
    const rawRows = session?.excelData || [];

    // File upload handler
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

                // Auto-detect column mapping
                const autoMapping: Record<string, string> = {};
                columnHeaders.forEach((header, idx) => {
                    autoMapping[idx.toString()] = detectColumnMapping(header);
                });

                // Normalize all data automatically
                const normalizedData: any[][] = [];
                const corrections: Record<string, { original: any; corrected: any; field: string }> = {};

                rawData.forEach((row, rowIdx) => {
                    const normalizedRow: any[] = [];

                    row.forEach((cell, colIdx) => {
                        const fieldName = autoMapping[colIdx.toString()];

                        if (fieldName && fieldName !== 'ignore') {
                            // Normalize the cell value
                            const result = normalizeField(fieldName, cell);
                            const normalizedValue = result.value;

                            normalizedRow.push(normalizedValue);

                            // Track corrections for diff display
                            if (cell != null && normalizedValue != null && String(cell).trim() !== String(normalizedValue)) {
                                const key = `${rowIdx}-${colIdx}`;
                                corrections[key] = {
                                    original: cell,
                                    corrected: normalizedValue,
                                    field: fieldName
                                };
                            }
                        } else {
                            // Keep original value for ignored columns
                            normalizedRow.push(cell);
                        }
                    });

                    normalizedData.push(normalizedRow);
                });

                // Store both original and normalized data
                const { session } = useBulkImportStore.getState();
                if (session) {
                    useBulkImportStore.setState({
                        session: {
                            ...session,
                            columnHeaders,
                            excelData: normalizedData,
                            originalExcelData: rawData,
                            columnMapping: autoMapping,
                            cellCorrections: corrections
                        }
                    });
                } else {
                    setExcelData(columnHeaders, normalizedData);
                }

                // Set initial mapping
                setMapping(autoMapping);
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
        maxSize: 5 * 1024 * 1024, // 5MB
    });

    // Convert raw rows to grid rows
    useEffect(() => {
        if (rawRows.length > 0 && headers.length > 0) {
            const gridRows: GridRow[] = rawRows.map((row: any, idx: number) => {
                const gridRow: GridRow = {
                    id: idx,
                    status: 'valid', // Will be updated by validation
                };

                headers.forEach((header, colIdx) => {
                    gridRow[`col_${colIdx}`] = row[colIdx];
                });

                return gridRow;
            });

            setRows(gridRows);
        }
    }, [rawRows, headers]);

    // Auto-detect mappings on mount or when headers change
    useEffect(() => {
        if (headers.length > 0 && Object.keys(mapping).length === 0) {
            const autoMapping: Record<string, string> = {};
            headers.forEach((header, idx) => {
                autoMapping[idx.toString()] = detectColumnMapping(header);
            });
            setMapping(autoMapping);
        }
    }, [headers]);

    // Validate all points when mapping changes
    useEffect(() => {
        if (Object.keys(mapping).length === 0 || rawRows.length === 0) return;

        const validateAll = async () => {
            setIsValidating(true);

            try {
                // Get all códigos for duplicate check
                const codigoColIndex = Object.entries(mapping).find(([_, val]) => val === 'codigo_ooh')?.[0];
                const allCodes = codigoColIndex
                    ? rawRows.map(row => String(row[parseInt(codigoColIndex)] || '').trim()).filter(Boolean)
                    : [];

                // Check database for existing códigos
                let existingCodes: string[] = [];
                if (allCodes.length > 0) {
                    try {
                        const result = await api.validateBulkCodes(allCodes);
                        existingCodes = result.existingCodes || [];
                    } catch (error) {
                        console.error('Error validating codes:', error);
                    }
                }

                // Validate each row with normalization
                const results = rawRows.map((row, idx) => {
                    const errors: { field: string; message: string; severity: 'error' | 'warning' }[] = [];
                    const normalizedRow: any = {};

                    // Process each mapped column
                    Object.entries(mapping).forEach(([colIdx, fieldName]) => {
                        if (fieldName === 'ignore') return;

                        const value = row[parseInt(colIdx)];
                        const result = normalizeField(fieldName, value);

                        normalizedRow[fieldName] = result.value;

                        if (!result.success && result.error) {
                            errors.push({ field: fieldName, message: result.error, severity: 'error' });
                        } else if (result.warning) {
                            errors.push({ field: fieldName, message: result.warning, severity: 'warning' });
                        }
                    });

                    // Check required fields
                    const requiredFields = ['codigo_ooh', 'endereco', 'latitude', 'longitude'];
                    requiredFields.forEach(field => {
                        if (!normalizedRow[field]) {
                            errors.push({ field, message: `${field} é obrigatório`, severity: 'error' });
                        }
                    });

                    // Check duplicates
                    const codigo = normalizedRow.codigo_ooh;
                    if (codigo) {
                        const duplicateCount = allCodes.filter(c => c === codigo).length;
                        if (duplicateCount > 1) {
                            errors.push({ field: 'codigo_ooh', message: 'Código duplicado no arquivo', severity: 'error' });
                        }
                        if (existingCodes.includes(codigo)) {
                            errors.push({ field: 'codigo_ooh', message: 'Código já existe no sistema', severity: 'error' });
                        }
                    }

                    const hasErrors = errors.some(e => e.severity === 'error');
                    const hasWarnings = errors.some(e => e.severity === 'warning');

                    return {
                        status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid',
                        errors,
                        normalizedRow
                    };
                });

                setValidationResults(results);
                setColumnMapping(mapping);

                // Update row statuses
                setRows(prevRows => prevRows.map((row, idx) => ({
                    ...row,
                    status: (results[idx]?.status || 'valid') as 'valid' | 'warning' | 'error'
                })));
            } finally {
                setIsValidating(false);
            }
        };

        validateAll();
    }, [mapping, rawRows, setColumnMapping]);

    // Summary
    const summary = useMemo(() => {
        const total = validationResults.length;
        const valid = validationResults.filter(r => r.status === 'valid').length;
        const warnings = validationResults.filter(r => r.status === 'warning').length;
        const errors = validationResults.filter(r => r.status === 'error').length;
        return { total, valid, warnings, errors };
    }, [validationResults]);

    // Filtered rows
    const filteredRows = useMemo(() => {
        if (filter === 'all') return rows;
        return rows.filter(row => {
            if (filter === 'valid') return row.status === 'valid';
            if (filter === 'errors') return row.status === 'error';
            if (filter === 'warnings') return row.status === 'warning';
            return true;
        });
    }, [rows, filter]);

    // Handle cell edit
    const handleRowsChange = (newRows: GridRow[]) => {
        setRows(newRows);

        // Update store
        const updatedData = newRows.map(row => {
            return headers.map((_, colIdx) => row[`col_${colIdx}`]);
        });

        if (session) {
            useBulkImportStore.setState({
                session: {
                    ...session,
                    excelData: updatedData
                }
            });
        }
    };

    // Handle fill (drag-fill)
    const handleFill = ({ columnKey, sourceRow, targetRow }: FillEvent<GridRow>): GridRow => {
        const colIdx = parseInt(columnKey.replace('col_', ''));
        const fieldName = mapping[colIdx.toString()];

        if (fieldName && fieldName !== 'ignore') {
            // Normalize the filled value
            const sourceValue = sourceRow[columnKey];
            const result = normalizeField(fieldName, sourceValue);

            return {
                ...targetRow,
                [columnKey]: result.value
            };
        }

        return {
            ...targetRow,
            [columnKey]: sourceRow[columnKey]
        };
    };

    // Handle mapping change
    const handleMappingChange = (colIndex: number, value: string) => {
        setMapping(prev => ({
            ...prev,
            [colIndex.toString()]: value,
        }));
    };

    // Custom header renderer with mapping dropdown
    const HeaderRenderer = ({ column }: RenderHeaderCellProps<GridRow>) => {
        const colIdx = parseInt(column.key.replace('col_', ''));
        const mappedField = mapping[colIdx.toString()] || 'ignore';
        const fieldOption = FIELD_OPTIONS.find(f => f.value === mappedField);
        const originalHeader = headers[colIdx];

        return (
            <div className="flex flex-col gap-1 py-1">
                <select
                    value={mappedField}
                    onChange={(e) => handleMappingChange(colIdx, e.target.value)}
                    className={cn(
                        'text-xs font-semibold px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-emidias-primary/20',
                        fieldOption?.required
                            ? 'bg-pink-50 border-emidias-accent text-emidias-accent'
                            : 'bg-white border-gray-300 text-gray-700'
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {FIELD_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <span className="text-xs text-gray-400 truncate">
                    ↓ {originalHeader || '(vazio)'}
                </span>
            </div>
        );
    };

    // Custom cell renderer with diff
    const CellRenderer = ({ row, column }: RenderCellProps<GridRow>) => {
        const colIdx = parseInt(column.key.replace('col_', ''));
        const correctionKey = `${row.id}-${colIdx}`;
        const correction = session?.cellCorrections?.[correctionKey];
        const value = row[column.key];

        if (correction) {
            return (
                <div className="w-full h-full flex items-center px-2">
                    <CellDiff
                        original={correction.original}
                        corrected={correction.corrected}
                        isEditing={false}
                    />
                </div>
            );
        }

        return (
            <div className="w-full h-full flex items-center px-2">
                {value != null ? String(value) : <span className="text-gray-300 italic">vazio</span>}
            </div>
        );
    };

    // Status icon renderer
    const StatusIcon = ({ status }: { status: 'valid' | 'warning' | 'error' }) => {
        if (status === 'valid') return <CheckCircle2 size={16} className="text-green-500" />;
        if (status === 'warning') return <AlertTriangle size={16} className="text-yellow-500" />;
        return <XCircle size={16} className="text-red-500" />;
    };

    // Create columns
    const columns: Column<GridRow>[] = useMemo(() => {
        const cols: Column<GridRow>[] = [
            {
                key: 'status',
                name: 'Status',
                width: 60,
                frozen: true,
                renderCell: ({ row }) => (
                    <div className="flex items-center justify-center h-full">
                        <StatusIcon status={row.status} />
                    </div>
                ),
            },
            {
                key: 'id',
                name: '#',
                width: 50,
                frozen: true,
                renderCell: ({ row }) => (
                    <div className="flex items-center justify-center h-full text-gray-400 font-mono text-xs">
                        {row.id + 1}
                    </div>
                ),
            },
        ];

        headers.forEach((header, idx) => {
            cols.push({
                key: `col_${idx}`,
                name: header,
                width: 180,
                resizable: true,
                renderHeaderCell: HeaderRenderer,
                renderCell: CellRenderer,
            });
        });

        return cols;
    }, [headers, mapping, session?.cellCorrections]);

    // Row class name for styling
    const rowClassName = (row: GridRow) => {
        if (row.status === 'error') return 'bg-red-50/50';
        if (row.status === 'warning') return 'bg-yellow-50/50';
        return 'bg-green-50/30';
    };

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
            {/* Filter Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter size={16} className="text-gray-400" />
                <button
                    onClick={() => setFilter('all')}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filter === 'all'
                            ? 'bg-emidias-primary text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                >
                    Todos ({summary.total})
                </button>
                <button
                    onClick={() => setFilter('valid')}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filter === 'valid'
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                >
                    Válidos ({summary.valid})
                </button>
                <button
                    onClick={() => setFilter('warnings')}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filter === 'warnings'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                >
                    Avisos ({summary.warnings})
                </button>
                <button
                    onClick={() => setFilter('errors')}
                    className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filter === 'errors'
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    )}
                >
                    Erros ({summary.errors})
                </button>

                {/* Correction Summary */}
                {session?.cellCorrections && Object.keys(session.cellCorrections).length > 0 && (
                    <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        <CheckCircle2 size={14} />
                        {Object.keys(session.cellCorrections).length} correções automáticas
                    </div>
                )}

                {isValidating && (
                    <div className="ml-auto flex items-center gap-2 text-sm text-emidias-primary">
                        <Loader2 size={14} className="animate-spin" />
                        Validando...
                    </div>
                )}
            </div>

            {/* Data Grid */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <DataGrid
                    columns={columns}
                    rows={filteredRows}
                    onRowsChange={handleRowsChange}
                    rowKeyGetter={(row) => row.id}
                    rowClass={rowClassName}
                    style={{ height: 500 }}
                    className="rdg-light"
                    fillHandle={{
                        onFill: handleFill,
                    }}
                />
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-500 text-center">
                💡 Dica: Clique duplo para editar | Arraste o canto da célula para preencher | Use setas para navegar
            </p>
        </div>
    );
}
