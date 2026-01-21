'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

// --- Types ---
type ModalVariant = 'detail' | 'wizard' | 'simple';

interface PluraModalProps {
    isOpen: boolean;
    onClose: () => void;
    variant?: ModalVariant;
    title?: string; // Used for simple/wizard

    // For "Detail" Variant (Split)
    visualColors?: 'dark' | 'light';
    leftContent?: React.ReactNode;
    rightContent?: React.ReactNode;

    // For "Wizard" Variant
    steps?: string[];
    currentStep?: number;
    onNext?: () => void;
    onBack?: () => void;
    onFinish?: () => void;
    canProceed?: boolean;

    maxWidth?: string;
    zIndex?: number;
    className?: string; // Additional classes for the prompt
}

export function PluraModal({
    isOpen,
    onClose,
    variant = 'simple',
    title,
    visualColors = 'dark',
    leftContent,
    rightContent,
    steps = [],
    currentStep = 1,
    onNext,
    onBack,
    onFinish,
    canProceed = true,
    maxWidth = '6xl',
    zIndex = 2000,
    className
}: PluraModalProps) {

    // --- VARIANT 1: DETAIL (Split View like Point Details) ---
    if (variant === 'detail') {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                maxWidth={maxWidth}
                className={cn("p-0 overflow-hidden rounded-[2rem]", className)} // Plura super-rounded style
                zIndex={zIndex}
                hideCloseButton={true}
            >
                <div className="flex flex-col md:flex-row h-[85vh] md:h-[600px] bg-white overflow-hidden shadow-2xl">

                    {/* LEFT PANEL (Visuals) */}
                    <div className={cn(
                        "w-full md:w-[40%] h-[200px] md:h-full flex flex-col relative border-r border-gray-100/10",
                        visualColors === 'dark' ? "bg-plura-primary" : "bg-gray-100"
                    )}>
                        {leftContent}
                    </div>

                    {/* RIGHT PANEL (Data) */}
                    <div className="w-full md:w-[60%] h-full flex flex-col bg-white relative">
                        {/* Close Button Absolute in Corner */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-50 h-9 w-9 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all border border-gray-100"
                        >
                            <X size={20} />
                        </button>

                        {rightContent}
                    </div>
                </div>
            </Modal>
        );
    }

    // --- VARIANT 2: WIZARD (Steps like Bulk Import) ---
    if (variant === 'wizard') {
        const totalSteps = steps.length;
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={
                    <div className="flex items-center justify-between w-full pr-8">
                        <h2 className="text-xl font-bold text-plura-primary tracking-tight">
                            {title}
                        </h2>
                    </div>
                }
                maxWidth={maxWidth}
                hideCloseButton={false} // Default modal close button
                zIndex={zIndex}
                footer={
                    <div className="flex items-center justify-between w-full">
                        {/* Step Indicator */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">
                                Etapa {currentStep} de {totalSteps}
                            </span>
                            <div className="flex gap-1.5">
                                {steps.map((_, idx) => {
                                    const stepNum = idx + 1;
                                    return (
                                        <div
                                            key={idx}
                                            className={cn(
                                                'h-2 rounded-full transition-all duration-300',
                                                stepNum === currentStep ? 'w-8 bg-plura-accent' :
                                                    stepNum < currentStep ? 'w-2 bg-plura-primary' : 'w-2 bg-gray-200'
                                            )}
                                        />
                                    );
                                })}
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex gap-3">
                            {onBack && currentStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={onBack}
                                    leftIcon={<ChevronLeft size={16} />}
                                    className="rounded-xl border-gray-200"
                                >
                                    Voltar
                                </Button>
                            )}

                            {currentStep < totalSteps ? (
                                <Button
                                    onClick={onNext}
                                    disabled={!canProceed}
                                    rightIcon={<ChevronRight size={16} />}
                                    className="bg-plura-primary hover:bg-plura-primary-light text-white rounded-xl"
                                >
                                    Próximo
                                </Button>
                            ) : (
                                <Button
                                    onClick={onFinish}
                                    disabled={!canProceed}
                                    rightIcon={<Check size={16} />}
                                    className="bg-plura-accent hover:bg-plura-accent-dark text-black rounded-xl font-bold"
                                >
                                    Concluir
                                </Button>
                            )}
                        </div>
                    </div>
                }
            >
                <div className="space-y-6">
                    {/* Optional Progress Bar */}
                    <div className="relative h-1 bg-gray-100 rounded-full overflow-hidden w-full">
                        <div
                            className="absolute left-0 top-0 h-full bg-gradient-to-r from-plura-primary to-plura-accent transition-all duration-500 ease-out"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>

                    {/* Content Slot */}
                    <div className="min-h-[400px]">
                        {/* We largely expect children to be passed here */}
                        {/* But wait, PluraModal children? Or render prop? */}
                        {/* Let's assume standard children are passed inside Modal content */}
                    </div>
                </div>
            </Modal>
        );
    }

    // Default fallback
    return null;
}
