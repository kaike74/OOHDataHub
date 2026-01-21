'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface PluraFormProps {
    children: React.ReactNode;
    onSubmit?: (e: React.FormEvent) => void;
    className?: string;
    title?: string;
    description?: string;
    footer?: React.ReactNode;
    submitLabel?: string;
    cancelLabel?: string;
    onCancel?: () => void;
    isSubmitting?: boolean;
    submitDisabled?: boolean;
}

export function PluraForm({
    children,
    onSubmit,
    className,
    title,
    description,
    footer,
    submitLabel = 'Salvar',
    cancelLabel = 'Cancelar',
    onCancel,
    isSubmitting = false,
    submitDisabled = false
}: PluraFormProps) {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit?.(e);
    };

    return (
        <form onSubmit={handleSubmit} className={cn('space-y-6', className)}>
            {/* Header */}
            {(title || description) && (
                <div className="space-y-2">
                    {title && (
                        <h3 className="text-xl font-semibold text-plura-primary">
                            {title}
                        </h3>
                    )}
                    {description && (
                        <p className="text-sm text-plura-gray-600">
                            {description}
                        </p>
                    )}
                </div>
            )}

            {/* Form Fields */}
            <div className="space-y-4">
                {children}
            </div>

            {/* Footer */}
            {(footer || onCancel || onSubmit) && (
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-plura-gray-100">
                    {footer ? (
                        footer
                    ) : (
                        <>
                            {onCancel && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onCancel}
                                    disabled={isSubmitting}
                                    className="rounded-xl border-plura-gray-200"
                                >
                                    {cancelLabel}
                                </Button>
                            )}
                            {onSubmit && (
                                <Button
                                    type="submit"
                                    disabled={submitDisabled || isSubmitting}
                                    className="bg-plura-primary hover:bg-plura-primary-light text-white rounded-xl"
                                >
                                    {isSubmitting ? 'Salvando...' : submitLabel}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            )}
        </form>
    );
}

// Field Group Component for organizing related fields
interface PluraFormFieldGroupProps {
    children: React.ReactNode;
    title?: string;
    description?: string;
    className?: string;
}

export function PluraFormFieldGroup({
    children,
    title,
    description,
    className
}: PluraFormFieldGroupProps) {
    return (
        <div className={cn('space-y-4', className)}>
            {(title || description) && (
                <div className="space-y-1">
                    {title && (
                        <h4 className="text-sm font-semibold text-plura-gray-900">
                            {title}
                        </h4>
                    )}
                    {description && (
                        <p className="text-xs text-plura-gray-500">
                            {description}
                        </p>
                    )}
                </div>
            )}
            <div className="space-y-4">
                {children}
            </div>
        </div>
    );
}
