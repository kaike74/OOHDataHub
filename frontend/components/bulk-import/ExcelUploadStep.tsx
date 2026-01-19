'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

export default function ExcelUploadStep() {
    const session = useBulkImportStore((state) => state.session);
    const setExcelData = useBulkImportStore((state) => state.setExcelData);

    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const processFile = useCallback(async (file: File) => {
        setIsProcessing(true);
        setError(null);
        setFileName(file.name);

        try {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                throw new Error('Arquivo muito grande. Máximo: 5MB');
            }

            // Validate file type
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel', // .xls
                'text/csv', // .csv
            ];

            if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
                throw new Error('Formato inválido. Use apenas .xlsx, .xls ou .csv');
            }

            // Read file
            const data = await file.arrayBuffer();

            // Parse Excel/CSV
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            // Convert to JSON (array of arrays)
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                defval: '', // Default value for empty cells
                raw: false, // Convert all values to strings
            }) as any[][];

            // Validate data
            if (jsonData.length < 2) {
                throw new Error('O arquivo deve conter pelo menos uma linha de cabeçalho e uma linha de dados');
            }

            // Extract headers (first row) and data rows
            const headers = jsonData[0].map((h: any) => String(h).trim());
            const rows = jsonData.slice(1).filter(row => {
                // Filter out completely empty rows
                return row.some(cell => cell !== '' && cell !== null && cell !== undefined);
            });

            if (rows.length === 0) {
                throw new Error('O arquivo não contém dados válidos');
            }

            if (headers.length === 0) {
                throw new Error('O arquivo não contém colunas');
            }

            // Save to store
            setExcelData(rows, headers);

            setIsProcessing(false);
        } catch (err: any) {
            console.error('Error processing file:', err);
            setError(err.message || 'Erro ao processar arquivo');
            setIsProcessing(false);
        }
    }, [setExcelData]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            processFile(acceptedFiles[0]);
        }
    }, [processFile]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv'],
        },
        multiple: false,
        disabled: isProcessing,
    });

    const hasData = session && session.excelData.length > 0;
    const previewRows = session ? session.excelData.slice(0, 6) : [];
    const headers = session?.columnHeaders || [];

    return (
        <div className="space-y-6">
            {/* Help Message */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                    <strong>Dica:</strong> Não se preocupe com os nomes das colunas no Excel.
                    Na próxima etapa você poderá mapear cada coluna para o campo correspondente.
                </p>
            </div>

            {/* Upload Zone */}
            {!hasData && (
                <div
                    {...getRootProps()}
                    className={cn(
                        'border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
                        isDragActive
                            ? 'border-emidias-accent bg-pink-50/50 ring-4 ring-emidias-accent/20 scale-[1.02]'
                            : 'border-gray-200 hover:border-emidias-primary/50 hover:bg-gray-50/50',
                        isProcessing && 'opacity-50 cursor-not-allowed'
                    )}
                >
                    <input {...getInputProps()} />

                    <div className="flex flex-col items-center gap-4">
                        {isProcessing ? (
                            <>
                                <div className="w-16 h-16 bg-emidias-primary/10 rounded-2xl flex items-center justify-center">
                                    <Loader2 className="text-emidias-primary animate-spin" size={32} />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        Processando arquivo...
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {fileName}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 bg-gradient-to-br from-emidias-primary to-emidias-accent rounded-2xl flex items-center justify-center shadow-lg">
                                    <Upload className="text-white" size={32} />
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-gray-900">
                                        {isDragActive ? 'Solte o arquivo aqui' : 'Arraste o arquivo Excel ou CSV'}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        ou clique para selecionar
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                    <FileSpreadsheet size={14} />
                                    <span>Formatos aceitos: .xlsx, .xls, .csv (máx. 5MB)</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                    <div>
                        <p className="font-semibold text-red-900">Erro ao processar arquivo</p>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                </div>
            )}

            {/* Success + Preview */}
            {hasData && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                    {/* Success Message */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                        <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <p className="font-semibold text-green-900">Arquivo carregado com sucesso!</p>
                            <p className="text-sm text-green-700 mt-1">
                                {session.excelData.length} linha{session.excelData.length !== 1 ? 's' : ''} encontrada{session.excelData.length !== 1 ? 's' : ''} • {headers.length} coluna{headers.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setExcelData([], []);
                                setFileName(null);
                                setError(null);
                            }}
                            className="text-sm text-green-700 hover:text-green-900 font-medium underline"
                        >
                            Trocar arquivo
                        </button>
                    </div>

                    {/* Preview Table */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h3 className="font-semibold text-gray-900">Preview dos Dados</h3>
                            <p className="text-xs text-gray-500 mt-1">
                                Mostrando as primeiras {Math.min(6, previewRows.length)} linhas
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">
                                            #
                                        </th>
                                        {headers.map((header, idx) => (
                                            <th
                                                key={idx}
                                                className="px-4 py-2 text-left text-xs font-semibold text-gray-700 border-l border-gray-200"
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-gray-400">Coluna {String.fromCharCode(65 + idx)}</span>
                                                    <span className="font-medium text-gray-900">{header || '(vazio)'}</span>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {previewRows.map((row, rowIdx) => (
                                        <tr key={rowIdx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-2 text-gray-400 font-mono text-xs">
                                                {rowIdx + 1}
                                            </td>
                                            {headers.map((_, colIdx) => (
                                                <td
                                                    key={colIdx}
                                                    className="px-4 py-2 text-gray-700 border-l border-gray-100"
                                                >
                                                    {row[colIdx] || <span className="text-gray-300 italic">vazio</span>}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
