'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface FormSectionProps {
    /** Section title */
    title: string;
    /** Optional subtitle/description */
    subtitle?: string;
    /** Optional icon */
    icon?: React.ReactNode;
    /** Form fields within this section */
    children: React.ReactNode;
    /** Optional className for the wrapper */
    className?: string;
}

/**
 * Standardized Form Section Component
 * 
 * Groups related form fields together with a title and optional icon.
 * Provides consistent spacing and visual hierarchy.
 * 
 * @example
 * ```tsx
 * <FormSection 
 *   title="Informações Básicas" 
 *   icon={<Building2 size={20} />}
 *   subtitle="Dados principais do cliente"
 * >
 *   <FormField label="Nome" required>
 *     <Input value={name} onChange={setName} />
 *   </FormField>
 *   <FormField label="Email">
 *     <Input type="email" value={email} onChange={setEmail} />
 *   </FormField>
 * </FormSection>
 * ```
 */
export function FormSection({
    title,
    subtitle,
    icon,
    children,
    className
}: FormSectionProps) {
    return (
        <div className={cn("space-y-4", className)}>
            {/* Section Header */}
            <div className="border-b border-gray-200 pb-3">
                <div className="flex items-center gap-2">
                    {icon && (
                        <div className="text-plura-primary">
                            {icon}
                        </div>
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                        {title}
                    </h3>
                </div>
                {subtitle && (
                    <p className="text-sm text-gray-500 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}
