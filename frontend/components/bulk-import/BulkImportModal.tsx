'use client';

import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import ExcelUploadStep from '@/components/bulk-import/ExcelUploadStep';
import ColumnMappingStep from '@/components/bulk-import/ColumnMappingStep';
import BulkPointReviewStep from '@/components/bulk-import/BulkPointReviewStep';
import BulkProcessingStep from '@/components/bulk-import/BulkProcessingStep';
import BulkSummaryStep from '@/components/bulk-import/BulkSummaryStep';

export default function BulkImportModal() {
    const session = useBulkImportStore((state) => state.session);
    const isModalOpen = useBulkImportStore((state) => state.isModalOpen);
    const setModalOpen = useBulkImportStore((state) => state.setModalOpen);
    const setCurrentStep = useBulkImportStore((state) => state.setCurrentStep);
    const clearSession = useBulkImportStore((state) => state.clearSession);

    if (!session) return null;

    const { currentStep, exibidoraNome } = session;

    const handleClose = () => {
        setModalOpen(false);
        // Don't clear session - allow "continue where you left off"
    };

    const handleCancel = () => {
        if (confirm('Deseja cancelar a importação? Os dados serão salvos para você continuar depois.')) {
            setModalOpen(false);
        }
    };

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep((currentStep + 1) as 1 | 2 | 3 | 4 | 5);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as 1 | 2 | 3 | 4 | 5);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                // Can proceed if Excel data is loaded
                return session.excelData.length > 0 && session.columnHeaders.length > 0;
            case 2:
                // Can proceed if all required columns are mapped and no errors
                const mapping = session.columnMapping || {};
                const mappedFields = Object.values(mapping);
                const requiredFields = ['codigo_ooh', 'endereco', 'latitude', 'longitude'];
                const allRequiredMapped = requiredFields.every(field => mappedFields.includes(field));

                // Check if there are any error-status points
                const hasErrors = session.pontos?.some(p => p.validationStatus === 'error') || false;

                return allRequiredMapped && !hasErrors;
            case 3:
                // Can proceed from any point (navigation handled internally)
                // User can click "Finalizar" on last point to move to step 4
                return true;
            case 4:
                // Processing step - no manual proceed
                return false;
            case 5:
                // Final step - can close
                return true;
            default:
                return false;
        }
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={handleClose}
            title={
                <div className="flex items-center justify-between w-full">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            Cadastro em Massa de Pontos
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {exibidoraNome}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>
            }
            maxWidth="6xl"
            hideCloseButton={true}
            zIndex={3000}
            footer={
                <div className="flex items-center justify-between w-full">
                    {/* Step Indicator */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                            Etapa {currentStep} de 5
                        </span>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4, 5].map((step) => (
                                <div
                                    key={step}
                                    className={cn(
                                        'w-2 h-2 rounded-full transition-all',
                                        step === currentStep
                                            ? 'bg-emidias-primary w-6'
                                            : step < currentStep
                                                ? 'bg-emidias-primary/50'
                                                : 'bg-gray-200'
                                    )}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex gap-3">
                        {currentStep === 1 ? (
                            <Button variant="ghost" onClick={handleCancel}>
                                Cancelar
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                onClick={handleBack}
                                leftIcon={<ArrowLeft size={16} />}
                            >
                                Voltar
                            </Button>
                        )}

                        {currentStep < 5 ? (
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                rightIcon={<ArrowRight size={16} />}
                            >
                                Próximo
                            </Button>
                        ) : (
                            <Button
                                onClick={handleClose}
                                variant="primary"
                                rightIcon={<Check size={16} />}
                            >
                                Concluir
                            </Button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Progress Bar */}
                <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="absolute left-0 top-0 h-full bg-gradient-to-r from-emidias-primary to-emidias-accent transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / 5) * 100}%` }}
                    />
                </div>

                {/* Step Content */}
                <div className="min-h-[500px]">
                    {currentStep === 1 && <ExcelUploadStep />}
                    {currentStep === 2 && <ColumnMappingStep />}
                    {currentStep === 3 && <BulkPointReviewStep />}
                    {currentStep === 4 && <BulkProcessingStep />}
                    {currentStep === 5 && <BulkSummaryStep />}
                </div>
            </div>
        </Modal>
    );
}
