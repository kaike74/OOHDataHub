'use client';

import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import DataGridStep from '@/components/bulk-import/DataGridStep';
import BulkPointReviewStep from '@/components/bulk-import/BulkPointReviewStep';
import BulkProcessingStep from '@/components/bulk-import/BulkProcessingStep';
import BulkSummaryStep from '@/components/bulk-import/BulkSummaryStep';

const STEP_NAMES = [
    'Mapeamento e Upload',
    'Revisão de Pontos',
    'Processamento',
    'Resumo'
];

export default function BulkImportModal() {
    const session = useBulkImportStore((state) => state.session);
    const isModalOpen = useBulkImportStore((state) => state.isModalOpen);
    const setModalOpen = useBulkImportStore((state) => state.setModalOpen);
    const setCurrentStep = useBulkImportStore((state) => state.setCurrentStep);

    if (!session) return null;

    const { currentStep, exibidoraNome } = session;

    const handleClose = () => {
        setModalOpen(false);
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
                // Check DataGridStep validation status
                const canProceedFromGrid = (window as any).__bulkImportCanProceed;
                return canProceedFromGrid === true;
            case 2:
                // Can proceed from review step
                return true;
            case 3:
                // Processing step - no manual proceed
                return false;
            case 4:
                // Final step - can close
                return true;
            default:
                return false;
        }
    };

    // Map internal step (1-5) to display step (1-4)
    const displayStep = currentStep === 1 ? 1 : currentStep - 1;
    const totalSteps = 4;

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
                </div>
            }
            maxWidth="7xl"
            hideCloseButton={true}
            zIndex={3000}
            footer={
                <div className="flex items-center justify-between w-full">
                    {/* Step Indicator */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">
                            Etapa {displayStep} de {totalSteps}: {STEP_NAMES[displayStep - 1]}
                        </span>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map((step) => (
                                <div
                                    key={step}
                                    className={cn(
                                        'w-2 h-2 rounded-full transition-all',
                                        step === displayStep
                                            ? 'bg-emidias-primary w-6'
                                            : step < displayStep
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

                        {currentStep < 4 ? (
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
                        style={{ width: `${(displayStep / totalSteps) * 100}%` }}
                    />
                </div>

                {/* Step Content */}
                <div className="min-h-[600px]">
                    {currentStep === 1 && <DataGridStep />}
                    {currentStep === 2 && <BulkPointReviewStep />}
                    {currentStep === 3 && <BulkProcessingStep />}
                    {currentStep === 4 && <BulkSummaryStep />}
                </div>
            </div>
        </Modal>
    );
}
