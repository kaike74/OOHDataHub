'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionButtonProps {
    onClick: () => void;
    label: string;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary';
    className?: string;
}

/**
 * Standardized action button used across all views
 * Examples: "Novo Ponto", "Novo Cliente", "Nova Proposta", etc.
 */
export function ActionButton({
    onClick,
    label,
    icon = <Plus size={20} />,
    variant = 'primary',
    className
}: ActionButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-200',
                'hover:scale-[1.02] active:scale-[0.98]',
                variant === 'primary'
                    ? 'bg-plura-accent text-white shadow-lg shadow-plura-accent/20 hover:shadow-xl hover:shadow-plura-accent/30'
                    : 'bg-white text-plura-primary border-2 border-plura-primary/10 hover:border-plura-accent hover:text-plura-accent',
                className
            )}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    action?: {
        label: string;
        onClick: () => void;
        icon?: React.ReactNode;
    };
    children?: React.ReactNode;
}

/**
 * Standardized page header with optional action button
 * Used across all admin views for consistency
 */
export function PageHeader({ title, subtitle, action, children }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-6">
            <div>
                <h1 className="text-3xl font-bold text-plura-primary tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-plura-gray-600 mt-1">
                        {subtitle}
                    </p>
                )}
            </div>
            <div className="flex items-center gap-3">
                {children}
                {action && (
                    <ActionButton
                        onClick={action.onClick}
                        label={action.label}
                        icon={action.icon}
                    />
                )}
            </div>
        </div>
    );
}
