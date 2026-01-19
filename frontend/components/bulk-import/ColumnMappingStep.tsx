'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { CheckCircle2, AlertTriangle, XCircle, Filter, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { normalizeField } from '@/lib/dataNormalizers';

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
        'codigo': 'codigo_ooh',
        'código': 'codigo_ooh',
        'cod': 'codigo_ooh',
        'endereco': 'endereco',
        'endereço': 'endereco',
        'address': 'endereco',
        'lat': 'latitude',
        'latitude': 'latitude',
        'lng': 'longitude',
        'lon': 'longitude',
        'longitude': 'longitude',
        'cidade': 'cidade',
        'city': 'cidade',
        'uf': 'uf',
        'estado': 'uf',
        'pais': 'pais',
        'país': 'pais',
        'medida': 'medidas',
        'medidas': 'medidas',
        'tamanho': 'medidas',
        'fluxo': 'fluxo',
        'tipo': 'tipos',
        'tipos': 'tipos',
        'obs': 'observacoes',
        'observacao': 'observacoes',
        'observacoes': 'observacoes',
        'observações': 'observacoes',
        'referencia': 'ponto_referencia',
        'referência': 'ponto_referencia',
        'locacao': 'valor_locacao',
        'locação': 'valor_locacao',
        'aluguel': 'valor_locacao',
        'periodo': 'periodo_locacao',
        'período': 'periodo_locacao',
        'papel': 'valor_papel',
        'lona': 'valor_lona',
    };

    for (const [key, value] of Object.entries(mappings)) {
        if (normalized.includes(key)) return value;
    }

    return 'ignore';
}

export default function ColumnMappingStep() {
    const session = useBulkImportStore((state) => state.session);
    const setExcelData = useBulkImportStore((state) => state.setExcelData);
    const setColumnMapping = useBulkImportStore((state) => state.setColumnMapping);
    const updateCellValue = useBulkImportStore((state) => state.updateCellValue);

    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = useState(false);
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'valid' | 'errors' | 'warnings'>('all');
    const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
    const [editValue, setEditValue] = useState('');

    const headers = session?.columnHeaders || [];
    const rows = session?.excelData || [];

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
                const excelData = jsonData.slice(1);

                setExcelData(columnHeaders, excelData);
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
        if (Object.keys(mapping).length === 0 || rows.length === 0) return;

        const validateAll = async () => {
            setIsValidating(true);

            try {
                // Get all códigos for duplicate check
                const codigoColIndex = Object.entries(mapping).find(([_, val]) => val === 'codigo_ooh')?.[0];
                const allCodes = codigoColIndex
                    ? rows.map(row => String(row[parseInt(codigoColIndex)] || '').trim()).filter(Boolean)
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
                const results = rows.map((row, idx) => {
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
            } finally {
                setIsValidating(false);
            }
        };

        validateAll();
    }, [mapping, rows]);

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
        if (filter === 'all') return rows.map((row, idx) => ({ row, idx }));
        return rows
            .map((row, idx) => ({ row, idx }))
            .filter(({ idx }) => {
                const result = validationResults[idx];
                if (!result) return false;
                if (filter === 'valid') return result.status === 'valid';
                if (filter === 'errors') return result.status === 'error';
                if (filter === 'warnings') return result.status === 'warning';
                return true;
            });
    }, [rows, validationResults, filter]);

    const handleMappingChange = (colIndex: number, value: string) => {
        setMapping(prev => ({
            ...prev,
            [colIndex.toString()]: value,
        }));
    };

    const handleCellDoubleClick = (rowIdx: number, colIdx: number) => {
        setEditingCell({ row: rowIdx, col: colIdx });
        setEditValue(String(rows[rowIdx][colIdx] || ''));
    };

    const handleCellSave = () => {
        if (!editingCell) return;
        updateCellValue(editingCell.row, editingCell.col, editValue);
        setEditingCell(null);
    };

    const handleCellCancel = () => {
        setEditingCell(null);
    };

    const StatusIcon = ({ status }: { status: 'valid' | 'warning' | 'error' }) => {
        if (status === 'valid') return <CheckCircle2 size={16} className="text-green-500" />;
        if (status === 'warning') return <AlertTriangle size={16} className="text-yellow-500" />;
        return <XCircle size={16} className="text-red-500" />;
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

                {isValidating && (
                    <div className="ml-auto flex items-center gap-2 text-sm text-emidias-primary">
                        <Loader2 size={14} className="animate-spin" />
                        Validando...
                    </div>
                )}
            </div>

            {/* Table with inline mapping */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-12">
                                    Status
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-12">
                                    #
                                </th>
                                {headers.map((header, idx) => {
                                    const mappedField = mapping[idx.toString()] || 'ignore';
                                    const fieldOption = FIELD_OPTIONS.find(f => f.value === mappedField);

                                    return (
                                        <th
                                            key={idx}
                                            className="px-3 py-2 text-left border-l border-gray-200 min-w-[180px]"
                                        >
                                            <div className="flex flex-col gap-1.5">
                                                {/* Dropdown for mapping */}
                                                <select
                                                    value={mappedField}
                                                    onChange={(e) => handleMappingChange(idx, e.target.value)}
                                                    className={cn(
                                                        'text-xs font-semibold px-2 py-1 rounded border focus:outline-none focus:ring-2 focus:ring-emidias-primary/20',
                                                        fieldOption?.required
                                                            ? 'bg-pink-50 border-emidias-accent text-emidias-accent'
                                                            : 'bg-white border-gray-300 text-gray-700'
                                                    )}
                                                >
                                                    {FIELD_OPTIONS.map(opt => (
                                                        <option key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {/* Excel column name */}
                                                <span className="text-xs text-gray-400 truncate">
                                                    ↓ {header || '(vazio)'}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredRows.map(({ row, idx }) => {
                                const result = validationResults[idx];
                                const status = result?.status || 'valid';

                                return (
                                    <tr
                                        key={idx}
                                        className={cn(
                                            'hover:bg-gray-50 transition-colors',
                                            status === 'error' && 'bg-red-50/50',
                                            status === 'warning' && 'bg-yellow-50/50',
                                            status === 'valid' && 'bg-green-50/30'
                                        )}
                                    >
                                        <td className="px-3 py-2">
                                            <div className="group relative">
                                                <StatusIcon status={status} />
                                                {result?.errors.length > 0 && (
                                                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block z-20 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                                                        {result.errors.map((err: any, errIdx: number) => (
                                                            <div key={errIdx} className="mb-1 last:mb-0">
                                                                <span className={cn(
                                                                    'font-semibold',
                                                                    err.severity === 'error' ? 'text-red-300' : 'text-yellow-300'
                                                                )}>
                                                                    {err.severity === 'error' ? '❌' : '⚠️'}
                                                                </span> {err.message}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-400 font-mono text-xs">
                                            {idx + 1}
                                        </td>
                                        {row.map((cell: any, cellIdx: number) => {
                                            const isEditing = editingCell?.row === idx && editingCell?.col === cellIdx;

                                            return (
                                                <td
                                                    key={cellIdx}
                                                    className="px-3 py-2 text-gray-700 border-l border-gray-100 cursor-pointer hover:bg-blue-50/50"
                                                    onDoubleClick={() => handleCellDoubleClick(idx, cellIdx)}
                                                >
                                                    {isEditing ? (
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onBlur={handleCellSave}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') handleCellSave();
                                                                if (e.key === 'Escape') handleCellCancel();
                                                            }}
                                                            className="w-full px-2 py-1 border border-emidias-primary rounded focus:outline-none"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        cell || <span className="text-gray-300 italic">vazio</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {filteredRows.length > 10 && (
                    <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-200">
                        Mostrando {Math.min(filteredRows.length, 10)} de {filteredRows.length} linhas
                    </div>
                )}
            </div>

            {/* Hint */}
            <p className="text-xs text-gray-500 text-center">
                💡 Dica: Clique duplo em uma célula para editar
            </p>
        </div>
    );
}
