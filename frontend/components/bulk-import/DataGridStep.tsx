'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { DataGrid, Column, RenderHeaderCellProps, RenderCellProps } from 'react-data-grid';
import { Upload, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { normalizeField, analyzeColumnContent } from '@/lib/dataNormalizers';
import 'react-data-grid/lib/styles.css';

// Field options for column mapping
const FIELD_OPTIONS = [
    { value: 'codigo_ooh', label: 'Código OOH', required: true },
    { value: 'endereco', label: 'Endereço', required: true },
    { value: 'latitude', label: 'Latitude', required: true },
    { value: 'longitude', label: 'Longitude', required: true },
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

// Fields that should NOT be normalized (user-defined, keep as-is)
const NO_NORMALIZE_FIELDS = ['codigo_ooh', 'endereco', 'observacoes'];

// Auto-detect column mapping based on header name AND content
function detectColumnMapping(header: string, columnValues?: any[]): string {
    const normalized = header.toLowerCase().trim();

    const mappings: Record<string, string> = {
        'codigo': 'codigo_ooh', 'código': 'codigo_ooh', 'cod': 'codigo_ooh', 'code': 'codigo_ooh',
        'endereco': 'endereco', 'endereço': 'endereco', 'end': 'endereco', 'address': 'endereco', 'addr': 'endereco',
        'lat': 'latitude', 'latitude': 'latitude',
        'lng': 'longitude', 'lon': 'longitude', 'long': 'longitude', 'longitude': 'longitude',
        'cidade': 'cidade', 'city': 'cidade', 'cid': 'cidade',
        'uf': 'uf', 'estado': 'uf', 'state': 'uf',
        'pais': 'pais', 'país': 'pais', 'country': 'pais',
        'medida': 'medidas', 'medidas': 'medidas', 'tamanho': 'medidas', 'tam': 'medidas', 'size': 'medidas',
        'fluxo': 'fluxo', 'flux': 'fluxo', 'flow': 'fluxo',
        'tipo': 'tipos', 'tipos': 'tipos', 'tip': 'tipos', 'type': 'tipos',
        'obs': 'observacoes', 'observacao': 'observacoes', 'observacoes': 'observacoes', 'observações': 'observacoes',
        'referencia': 'ponto_referencia', 'referência': 'ponto_referencia', 'ref': 'ponto_referencia',
        'locacao': 'valor_locacao', 'locação': 'valor_locacao', 'loc': 'valor_locacao', 'aluguel': 'valor_locacao',
        'periodo': 'periodo_locacao', 'período': 'periodo_locacao', 'per': 'periodo_locacao',
        'papel': 'valor_papel', 'lona': 'valor_lona',
    };

    // First try header name matching
    let headerScore = 0;
    let headerMatch = 'ignore';

    for (const [key, value] of Object.entries(mappings)) {
        if (normalized.includes(key)) {
            headerScore = 0.8; // High confidence from header
            headerMatch = value;
            break;
        }
    }

    // If we have column values, analyze content
    if (columnValues && columnValues.length > 0) {
        const contentAnalysis = analyzeColumnContent(columnValues);

        // Combine scores: header (0.8 weight) + content (1.0 weight)
        // If both agree, very high confidence
        // If only one matches, use the one with higher confidence

        if (headerMatch !== 'ignore' && contentAnalysis.fieldType !== 'ignore') {
            // Both have suggestions
            if (headerMatch === contentAnalysis.fieldType) {
                // Perfect match - use it
                return headerMatch;
            } else if (contentAnalysis.confidence > 0.7) {
                // Content analysis is very confident, prefer it
                return contentAnalysis.fieldType;
            } else {
                // Header wins
                return headerMatch;
            }
        } else if (contentAnalysis.fieldType !== 'ignore' && contentAnalysis.confidence >= 0.5) {
            // Only content analysis has a suggestion
            return contentAnalysis.fieldType;
        } else if (headerMatch !== 'ignore') {
            // Only header has a suggestion
            return headerMatch;
        }
    } else if (headerMatch !== 'ignore') {
        // No content available, use header only
        return headerMatch;
    }

    return 'ignore';
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

    const headers = session?.columnHeaders || [];
    const rawRows = session?.excelData || [];

    // File upload handler with selective normalization
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

                // Auto-detect column mapping with content analysis
                const autoMapping: Record<string, string> = {};
                columnHeaders.forEach((header, idx) => {
                    // Extract column values for content analysis
                    const columnValues = rawData.map(row => row[idx]);
                    autoMapping[idx.toString()] = detectColumnMapping(header, columnValues);
                });

                // Normalize data SELECTIVELY (skip codigo_ooh, endereco, observacoes)
                const normalizedData: any[][] = [];
                const corrections: Record<string, { original: any; corrected: any; field: string }> = {};

                rawData.forEach((row, rowIdx) => {
                    const normalizedRow: any[] = [];

                    row.forEach((cell, colIdx) => {
                        const fieldName = autoMapping[colIdx.toString()];

                        if (fieldName && fieldName !== 'ignore') {
                            // Skip normalization for user-defined fields
                            if (NO_NORMALIZE_FIELDS.includes(fieldName)) {
                                const trimmed = cell ? String(cell).trim() : cell;
                                normalizedRow.push(trimmed);
                            } else {
                                // Normalize other fields
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
                            }
                        } else {
                            normalizedRow.push(cell);
                        }
                    });

                    normalizedData.push(normalizedRow);
                });

                // Store data
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
        maxSize: 5 * 1024 * 1024,
    });

    // Convert raw rows to grid rows (only on initial load)
    useEffect(() => {
        if (rawRows.length > 0 && headers.length > 0 && rows.length === 0) {
            const gridRows: GridRow[] = rawRows.map((row: any, idx: number) => {
                const gridRow: GridRow = {
                    id: idx,
                };

                headers.forEach((header, colIdx) => {
                    gridRow[`col_${colIdx}`] = row[colIdx];
                });

                return gridRow;
            });

            setRows(gridRows);
        }
    }, [rawRows, headers, rows.length]);

    // Auto-detect mappings with content analysis
    useEffect(() => {
        if (headers.length > 0 && Object.keys(mapping).length === 0 && rawRows.length > 0) {
            const autoMapping: Record<string, string> = {};
            headers.forEach((header, idx) => {
                const columnValues = rawRows.map(row => row[idx]);
                autoMapping[idx.toString()] = detectColumnMapping(header, columnValues);
            });
            setMapping(autoMapping);
        }
    }, [headers, rawRows]);

    // Update store mapping when local mapping changes
    useEffect(() => {
        if (Object.keys(mapping).length > 0) {
            setColumnMapping(mapping);
        }
    }, [mapping, setColumnMapping]);

    // Summary of mapping
    const summary = useMemo(() => {
        const total = rawRows.length;
        const mappedFields = Object.values(mapping).filter(v => v !== 'ignore');
        const requiredFields = ['codigo_ooh', 'endereco', 'latitude', 'longitude'];
        const allRequiredMapped = requiredFields.every(field => mappedFields.includes(field));
        return { total, mappedCount: mappedFields.length, allRequiredMapped };
    }, [rawRows.length, mapping]);

    // Handle mapping change
    const handleMappingChange = (colIndex: number, value: string) => {
        setMapping(prev => ({
            ...prev,
            [colIndex.toString()]: value,
        }));
    };

    // Header renderer - ORIGINAL NAME PROMINENT
    const HeaderRenderer = ({ column }: RenderHeaderCellProps<GridRow>) => {
        const colIdx = parseInt(column.key.replace('col_', ''));
        const mappedField = mapping[colIdx.toString()] || 'ignore';
        const fieldOption = FIELD_OPTIONS.find(f => f.value === mappedField);
        const originalHeader = headers[colIdx];

        return (
            <div className="flex flex-col gap-1.5 py-2 px-1 h-full justify-center">
                {/* Original header - PROMINENT */}
                <div className="text-sm font-bold text-gray-900 truncate leading-tight" title={originalHeader}>
                    {originalHeader || '(sem nome)'}
                </div>
                {/* Mapping dropdown - secondary */}
                <select
                    value={mappedField}
                    onChange={(e) => handleMappingChange(colIdx, e.target.value)}
                    className={cn(
                        'text-xs font-medium px-2 py-1 rounded border focus:outline-none focus:ring-1 focus:ring-emidias-primary/30',
                        fieldOption?.required
                            ? 'bg-pink-50 border-emidias-accent text-emidias-accent'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {FIELD_OPTIONS.map(opt => {
                        const isSelectedElsewhere = Object.entries(mapping).some(([key, val]) => {
                            return val === opt.value && key !== colIdx.toString();
                        });

                        return (
                            <option
                                key={opt.value}
                                value={opt.value}
                                disabled={isSelectedElsewhere && opt.value !== 'ignore'}
                            >
                                {opt.label} {isSelectedElsewhere && opt.value !== 'ignore' ? '(já selecionado)' : ''}
                            </option>
                        );
                    })}
                </select>
            </div>
        );
    };

    // Cell renderer - simple, read-only
    const CellRenderer = ({ row, column }: RenderCellProps<GridRow>) => {
        const value = row[column.key];

        return (
            <div className="w-full h-full flex items-center px-2">
                {value != null ? String(value) : <span className="text-gray-300 italic">vazio</span>}
            </div>
        );
    };

    // Create columns
    const columns: Column<GridRow>[] = useMemo(() => {
        const cols: Column<GridRow>[] = [];

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
    }, [headers, mapping]);

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
            {/* Summary */}
            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                    <CheckCircle2 size={16} />
                    {summary.total} linhas detectadas
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                    <CheckCircle2 size={16} />
                    {summary.mappedCount} colunas mapeadas
                </div>
                {summary.allRequiredMapped && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                        <CheckCircle2 size={16} />
                        Todos os campos obrigatórios mapeados
                    </div>
                )}
                {!summary.allRequiredMapped && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                        ⚠️ Campos obrigatórios: Código OOH, Endereço, Latitude, Longitude
                    </div>
                )}

                {/* Correction Summary */}
                {session?.cellCorrections && Object.keys(session.cellCorrections).length > 0 && (
                    <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        <CheckCircle2 size={16} />
                        {Object.keys(session.cellCorrections).length} normalizações automáticas
                    </div>
                )}
            </div>

            {/* Data Grid - READ ONLY */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <DataGrid
                    columns={columns}
                    rows={rows}
                    rowKeyGetter={(row) => row.id}
                    headerRowHeight={80}
                    rowHeight={35}
                    style={{ height: 500 }}
                    className="rdg-light"
                />
            </div>

            {/* Hint */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                    💡 <strong>Dica:</strong> Revise o mapeamento das colunas acima. Os dados foram normalizados automaticamente e serão validados completamente na próxima etapa, onde você poderá editar cada ponto individualmente.
                </p>
            </div>
        </div>
    );
}
