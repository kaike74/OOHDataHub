'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FormActionsProps {
    /** Cancel button handler */
    onCancel: () => void;
    /** Submit button handler */
    onSubmit: () => void;
    /** Submit button label (default: "Salvar") */
    submitLabel?: string;
    /** Cancel button label (default: "Cancelar") */
    cancelLabel?: string;
    /** Whether the form is submitting */
    isLoading?: boolean;
    /** Whether the form is valid (disables submit if false) */
    isValid?: boolean;
    /** Optional className for the wrapper */
    className?: string;
    /** Alignment of buttons (default: 'right') */
    align?: 'left' | 'center' | 'right' | 'space-between';
}

/**
 * Standardized Form Actions Component
 * 
 * Provides consistent Cancel and Submit buttons for forms.
 * Handles loading states and validation.
 * 
 * @example
 * ```tsx
 * <FormActions
 *   onCancel={onClose}
 *   onSubmit={handleSubmit}
 *   submitLabel="Salvar Cliente"
 *   isLoading={isSubmitting}
 *   isValid={!Object.keys(errors).length}
 * />
 * ```
 */
export function FormActions({
    onCancel,
    onSubmit,
    submitLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    isLoading = false,
    isValid = true,
    className,
    align = 'right'
}: FormActionsProps) {
    const alignmentClasses = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end',
        'space-between': 'justify-between'
    };

    return (
        <div className={cn(
            "flex items-center gap-3 pt-6 border-t border-gray-200",
            alignmentClasses[align],
            className
        )}>
            {/* Cancel Button */}
            <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className={cn(
                    "px-6 py-3 rounded-xl font-semibold transition-all",
                    "bg-white text-gray-700 border-2 border-gray-200",
                    "hover:border-gray-300 hover:bg-gray-50",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
            >
                {cancelLabel}
            </button>

            {/* Submit Button */}
            <button
                type="button"
                onClick={onSubmit}
                disabled={isLoading || !isValid}
                className={cn(
                    "px-6 py-3 rounded-xl font-semibold transition-all",
                    "bg-plura-accent text-white",
                    "hover:bg-plura-accent-dark shadow-lg shadow-plura-accent/20",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "flex items-center gap-2"
                )}
            >
                {isLoading && (
                    <Loader2 size={18} className="animate-spin" />
                )}
                <span>{submitLabel}</span>
            </button>
        </div>
    );
}
