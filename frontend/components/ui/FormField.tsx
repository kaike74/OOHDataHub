'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormFieldProps {
    /** Field label */
    label: string;
    /** Whether the field is required */
    required?: boolean;
    /** Error message to display */
    error?: string;
    /** Help text to display below the field */
    helpText?: string;
    /** The input/select/textarea element */
    children: React.ReactNode;
    /** Optional className for the wrapper */
    className?: string;
    /** Optional ID for the field (used for label htmlFor) */
    htmlFor?: string;
}

/**
 * Standardized Form Field Component
 * 
 * Provides consistent styling for form fields including:
 * - Label with optional required indicator
 * - Error message display
 * - Help text
 * - Proper spacing and layout
 * 
 * @example
 * ```tsx
 * <FormField 
 *   label="Nome" 
 *   required 
 *   error={errors.name}
 *   helpText="Nome completo do cliente"
 * >
 *   <Input 
 *     value={name} 
 *     onChange={setName}
 *     placeholder="Digite o nome"
 *   />
 * </FormField>
 * ```
 */
export function FormField({
    label,
    required,
    error,
    helpText,
    children,
    className,
    htmlFor
}: FormFieldProps) {
    return (
        <div className={cn("space-y-2", className)}>
            {/* Label */}
            <label
                htmlFor={htmlFor}
                className="block text-sm font-semibold text-gray-700"
            >
                {label}
                {required && (
                    <span className="text-red-500 ml-1">*</span>
                )}
            </label>

            {/* Input/Select/Textarea */}
            <div>
                {children}
            </div>

            {/* Error Message */}
            {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                    <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                            clipRule="evenodd"
                        />
                    </svg>
                    {error}
                </p>
            )}

            {/* Help Text */}
            {helpText && !error && (
                <p className="text-sm text-gray-500">
                    {helpText}
                </p>
            )}
        </div>
    );
}
