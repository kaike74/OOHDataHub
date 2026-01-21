'use client';

import { useEffect, useState } from 'react';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';

interface PointStatus {
    codigo_ooh: string;
    endereco: string;
    status: 'queue' | 'processing' | 'success' | 'error';
    error?: string;
}

export default function BulkProcessingStep() {
    const session = useBulkImportStore((state) => state.session);
    const setCurrentStep = useBulkImportStore((state) => state.setCurrentStep);
    const clearSession = useBulkImportStore((state) => state.clearSession);

    const [pointStatuses, setPointStatuses] = useState<PointStatus[]>([]);
    const [isProcessing, setIsProcessing] = useState(true);
    const [processed, setProcessed] = useState(0);
    const [errors, setErrors] = useState<any[]>([]);

    const total = session?.pontos?.length || 0;

    useEffect(() => {
        if (!session || !session.pontos) return;

        // Initialize statuses
        const initialStatuses: PointStatus[] = session.pontos.map(p => ({
            codigo_ooh: p.codigo_ooh,
            endereco: p.endereco,
            status: 'queue'
        }));
        setPointStatuses(initialStatuses);

        // Start processing
        processBulkImport();
    }, []);

    const processBulkImport = async () => {
        if (!session) return;

        setIsProcessing(true);

        try {
            // Prepare data for backend
            const pointsToSave = session.pontos.map(p => ({
                codigo_ooh: p.codigo_ooh,
                endereco: p.endereco,
                latitude: p.latitude,
                longitude: p.longitude,
                cidade: p.cidade || null,
                uf: p.uf || null,
                pais: p.pais || 'Brasil',
                medidas: p.medidas || null,
                fluxo: p.fluxo || null,
                tipos: p.tipos || null,
                observacoes: p.observacoes || null,
                ponto_referencia: p.ponto_referencia || null,
                produtos: p.produtos || [],
                imagens: p.imagens?.map(img => ({
                    data: img.preview, // base64
                    ordem: img.ordem,
                    eh_capa: img.eh_capa
                })) || []
            }));

            // Update all to processing
            setPointStatuses(prev => prev.map(p => ({ ...p, status: 'processing' })));

            // Call backend
            const response = await api.saveBulkImport({
                id_exibidora: session.idExibidora,
                pontos: pointsToSave
            });

            if (response.success) {
                // Mark all as success
                setPointStatuses(prev => prev.map(p => ({ ...p, status: 'success' })));
                setProcessed(response.saved.length);
                setErrors([]);

                // Wait a bit then move to step 5
                setTimeout(() => {
                    setCurrentStep(5);
                }, 1500);
            } else {
                // Handle errors
                setErrors(response.errors || []);
                setPointStatuses(prev => prev.map((p, idx) => {
                    const hasError = response.errors?.some((e: any) => e.codigo_ooh === p.codigo_ooh);
                    return {
                        ...p,
                        status: hasError ? 'error' : 'success',
                        error: hasError ? response.errors.find((e: any) => e.codigo_ooh === p.codigo_ooh)?.error : undefined
                    };
                }));
            }
        } catch (error: any) {
            console.error('Error saving bulk import:', error);
            setErrors([{ message: error.message || 'Erro ao salvar pontos' }]);
            setPointStatuses(prev => prev.map(p => ({ ...p, status: 'error', error: 'Erro ao salvar' })));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRetry = () => {
        setErrors([]);
        setProcessed(0);
        processBulkImport();
    };

    const handleFinish = () => {
        clearSession();
        setCurrentStep(5);
    };

    const StatusIcon = ({ status }: { status: PointStatus['status'] }) => {
        if (status === 'success') {
            return <CheckCircle2 size={20} className="text-green-500" />;
        }
        if (status === 'error') {
            return <XCircle size={20} className="text-red-500" />;
        }
        if (status === 'processing') {
            return <Loader2 size={20} className="text-plura-primary animate-spin" />;
        }
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    };

    const successCount = pointStatuses.filter(p => p.status === 'success').length;
    const errorCount = pointStatuses.filter(p => p.status === 'error').length;
    const progressPercent = total > 0 ? (successCount / total) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Progress Bar */}
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-plura-primary to-plura-accent transition-all duration-500 ease-out"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Status Text */}
            <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                    {successCount} de {total} pontos salvos
                </p>
                <p className="text-sm text-gray-500 mt-1">
                    {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 size={14} className="animate-spin" />
                            Salvando dados no banco...
                        </span>
                    ) : errorCount > 0 ? (
                        'Processamento concluído com erros'
                    ) : (
                        '✅ Processamento concluído com sucesso!'
                    )}
                </p>
            </div>

            {/* Point List */}
            <div className="max-h-[400px] overflow-y-auto space-y-2 custom-scrollbar">
                {pointStatuses.map((point, idx) => (
                    <div
                        key={idx}
                        className={cn(
                            'flex items-center gap-3 p-3 rounded-lg transition-all',
                            point.status === 'success' && 'bg-green-50 border border-green-200',
                            point.status === 'error' && 'bg-red-50 border border-red-200',
                            point.status === 'processing' && 'bg-blue-50 border border-blue-200',
                            point.status === 'queue' && 'bg-gray-50 border border-gray-200'
                        )}
                    >
                        <StatusIcon status={point.status} />
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{point.codigo_ooh}</p>
                            <p className="text-xs text-gray-500 truncate">{point.endereco}</p>
                        </div>
                        {point.error && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                                <AlertCircle size={14} />
                                <span>{point.error}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Error Summary */}
            {errors.length > 0 && !isProcessing && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-2">
                        <XCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <p className="font-semibold text-red-900">
                                Erro ao salvar {errorCount} ponto(s)
                            </p>
                            <p className="text-sm text-red-700 mt-1">
                                {errors[0]?.message || 'Ocorreu um erro durante o processamento. Tente novamente.'}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleRetry}
                        variant="danger"
                        className="w-full"
                    >
                        Tentar Novamente
                    </Button>
                </div>
            )}

            {/* Success Actions */}
            {!isProcessing && errorCount === 0 && successCount === total && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <CheckCircle2 className="mx-auto mb-2 text-green-500" size={48} />
                    <p className="font-bold text-green-900 text-lg">
                        Importação concluída com sucesso!
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                        {total} ponto(s) foram cadastrados na exibidora {session?.exibidoraNome}
                    </p>
                </div>
            )}
        </div>
    );
}
