'use client';

import { useEffect, useState, useMemo } from 'react';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { CheckCircle2, AlertTriangle, XCircle, Filter, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Field options for column mapping
const FIELD_OPTIONS = [
    { value: 'codigo_ooh', label: 'Código OOH *', required: true },
    { value: 'endereco', label: 'Endereço *', required: true },
    { value: 'latitude', label: 'Latitude *', required: true },
    { value: 'longitude', label: 'Longitude *', required: true },
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
        'code': 'codigo_ooh',
        'endereco': 'endereco',
        'endereço': 'endereco',
        'address': 'endereco',
        'lat': 'latitude',
        'latitude': 'latitude',
        'lng': 'longitude',
        'lon': 'longitude',
        'long': 'longitude',
        'longitude': 'longitude',
        'cidade': 'cidade',
        'city': 'cidade',
        'uf': 'uf',
        'estado': 'uf',
        'state': 'uf',
        'pais': 'pais',
        'país': 'pais',
        'country': 'pais',
        'medida': 'medidas',
        'medidas': 'medidas',
        'tamanho': 'medidas',
        'fluxo': 'fluxo',
        'flow': 'fluxo',
        'tipo': 'tipos',
        'tipos': 'tipos',
        'type': 'tipos',
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

// Validate a single point
function validatePoint(
    row: any[],
    mapping: Record<string, string>,
    rowIndex: number,
    allCodes: string[],
    existingCodes: string[]
): { field: string; message: string; severity: 'error' | 'warning' }[] {
    const errors: { field: string; message: string; severity: 'error' | 'warning' }[] = [];

    // Helper to get value by field name
    const getValue = (fieldName: string): string => {
        const colIndex = Object.entries(mapping).find(([_, val]) => val === fieldName)?.[0];
        if (!colIndex) return '';
        return String(row[parseInt(colIndex)] || '').trim();
    };

    // Required fields validation
    const codigoOoh = getValue('codigo_ooh');
    const endereco = getValue('endereco');
    const latitude = getValue('latitude');
    const longitude = getValue('longitude');

    if (!codigoOoh) {
        errors.push({ field: 'codigo_ooh', message: 'Código OOH é obrigatório', severity: 'error' });
    }
    if (!endereco) {
        errors.push({ field: 'endereco', message: 'Endereço é obrigatório', severity: 'error' });
    }
    if (!latitude) {
        errors.push({ field: 'latitude', message: 'Latitude é obrigatória', severity: 'error' });
    }
    if (!longitude) {
        errors.push({ field: 'longitude', message: 'Longitude é obrigatória', severity: 'error' });
    }

    // Duplicate código in Excel
    if (codigoOoh) {
        const duplicateCount = allCodes.filter(c => c === codigoOoh).length;
        if (duplicateCount > 1) {
            errors.push({ field: 'codigo_ooh', message: 'Código duplicado no arquivo', severity: 'error' });
        }
    }

    // Código already exists in database
    if (codigoOoh && existingCodes.includes(codigoOoh)) {
        errors.push({ field: 'codigo_ooh', message: 'Código já existe no sistema', severity: 'error' });
    }

    // Coordinate validation
    if (latitude) {
        const lat = parseFloat(latitude.replace(',', '.'));
        if (isNaN(lat) || lat < -90 || lat > 90) {
            errors.push({ field: 'latitude', message: 'Latitude inválida (deve estar entre -90 e 90)', severity: 'error' });
        }
    }

    if (longitude) {
        const lng = parseFloat(longitude.replace(',', '.'));
        if (isNaN(lng) || lng < -180 || lng > 180) {
            errors.push({ field: 'longitude', message: 'Longitude inválida (deve estar entre -180 e 180)', severity: 'error' });
        }
    }

    // Warnings for optional fields
    if (!getValue('cidade')) {
        errors.push({ field: 'cidade', message: 'Cidade não informada', severity: 'warning' });
    }
    if (!getValue('uf')) {
        errors.push({ field: 'uf', message: 'UF não informada', severity: 'warning' });
    }

    return errors;
}

export default function ColumnMappingStep() {
    const session = useBulkImportStore((state) => state.session);
    const setColumnMapping = useBulkImportStore((state) => state.setColumnMapping);
    const setPontos = useBulkImportStore((state) => state.setPontos);

    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isValidating, setIsValidating] = useState(false);
    const [validationResults, setValidationResults] = useState<any[]>([]);
    const [filter, setFilter] = useState<'all' | 'valid' | 'errors' | 'warnings'>('all');

    const headers = session?.columnHeaders || [];
    const rows = session?.excelData || [];

    // Auto-detect mappings on mount
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
        if (Object.keys(mapping).length === 0) return;

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

                // Validate each row
                const results = rows.map((row, idx) => {
                    const errors = validatePoint(row, mapping, idx, allCodes, existingCodes);
                    const hasErrors = errors.some(e => e.severity === 'error');
                    const hasWarnings = errors.some(e => e.severity === 'warning');

                    return {
                        status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid',
                        errors,
                    };
                });

                setValidationResults(results);

                // Update store with column mapping
                setColumnMapping(mapping);
            } finally {
                setIsValidating(false);
            }
        };

        validateAll();
    }, [mapping, rows]);

    // Check if all required fields are mapped
    const requiredFieldsMapped = useMemo(() => {
        const requiredFields = FIELD_OPTIONS.filter(f => f.required).map(f => f.value);
        const mappedFields = Object.values(mapping);
        return requiredFields.every(field => mappedFields.includes(field));
    }, [mapping]);

    // Validation summary
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

    const StatusIcon = ({ status }: { status: 'valid' | 'warning' | 'error' }) => {
        if (status === 'valid') {
            return <CheckCircle2 size={16} className="text-green-500" />;
        }
        if (status === 'warning') {
            return <AlertTriangle size={16} className="text-yellow-500" />;
        }
        return <XCircle size={16} className="text-red-500" />;
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left: Preview Table (60%) */}
            <div className="lg:col-span-3 space-y-4">
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
                </div>

                {/* Preview Table */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-12">
                                        Status
                                    </th>
                                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase w-12">
                                        #
                                    </th>
                                    {headers.map((header, idx) => (
                                        <th
                                            key={idx}
                                            className="px-3 py-2 text-left text-xs font-semibold text-gray-700 border-l border-gray-200 min-w-[150px]"
                                        >
                                            <div className="flex flex-col gap-1">
                                                <span className="text-gray-400">Col {String.fromCharCode(65 + idx)}</span>
                                                <span className="font-medium text-gray-900">{header || '(vazio)'}</span>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {filteredRows.slice(0, 6).map(({ row, idx }) => {
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
                                            {row.map((cell: any, cellIdx: number) => (
                                                <td
                                                    key={cellIdx}
                                                    className="px-3 py-2 text-gray-700 border-l border-gray-100"
                                                >
                                                    {cell || <span className="text-gray-300 italic">vazio</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {filteredRows.length > 6 && (
                        <div className="bg-gray-50 px-4 py-2 text-xs text-gray-500 text-center border-t border-gray-200">
                            Mostrando 6 de {filteredRows.length} linhas
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Mapping Panel (40%) */}
            <div className="lg:col-span-2 space-y-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4 sticky top-4">
                    <h3 className="font-bold text-gray-900">Mapeamento de Colunas</h3>

                    {isValidating && (
                        <div className="flex items-center gap-2 text-sm text-emidias-primary">
                            <Loader2 size={14} className="animate-spin" />
                            Validando dados...
                        </div>
                    )}

                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {headers.map((header, idx) => {
                            const selectedValue = mapping[idx.toString()] || 'ignore';
                            const selectedOption = FIELD_OPTIONS.find(opt => opt.value === selectedValue);

                            return (
                                <div key={idx} className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">
                                        Coluna {String.fromCharCode(65 + idx)}: <span className="text-gray-900">{header}</span>
                                    </label>
                                    <select
                                        value={selectedValue}
                                        onChange={(e) => handleMappingChange(idx, e.target.value)}
                                        className={cn(
                                            'w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-primary/20',
                                            selectedOption?.required ? 'border-emidias-accent bg-pink-50' : 'border-gray-200'
                                        )}
                                    >
                                        {FIELD_OPTIONS.map(opt => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            );
                        })}
                    </div>

                    {/* Validation Summary */}
                    <div className="pt-4 border-t border-gray-200 space-y-3">
                        <h4 className="font-semibold text-sm text-gray-900">Resumo da Validação</h4>

                        {!requiredFieldsMapped && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-900">
                                <strong>⚠️ Campos obrigatórios faltando</strong>
                                <p className="text-xs mt-1">
                                    Mapeie: Código OOH, Endereço, Latitude e Longitude
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-gray-50 rounded-lg p-2">
                                <div className="text-gray-500 text-xs">Total</div>
                                <div className="font-bold text-gray-900">{summary.total}</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-2">
                                <div className="text-green-600 text-xs">Válidos</div>
                                <div className="font-bold text-green-700">{summary.valid}</div>
                            </div>
                            <div className="bg-yellow-50 rounded-lg p-2">
                                <div className="text-yellow-600 text-xs">Avisos</div>
                                <div className="font-bold text-yellow-700">{summary.warnings}</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-2">
                                <div className="text-red-600 text-xs">Erros</div>
                                <div className="font-bold text-red-700">{summary.errors}</div>
                            </div>
                        </div>

                        {summary.errors === 0 && requiredFieldsMapped && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-900">
                                <strong>✅ Pronto para continuar!</strong>
                                <p className="text-xs mt-1">
                                    Todos os pontos estão válidos ou com avisos apenas.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
