'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface ActionIconButtonProps {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'danger';
    disabled?: boolean;
    isLoading?: boolean;
    className?: string;
}

/**
 * Action Icon Button with Tab-like Hover Animation
 * 
 * Reuses the same UX pattern from MainTabs:
 * - Shows only icon by default
 * - Expands on hover to show label
 * - Smooth animation with cubic-bezier easing
 * 
 * @example
 * ```tsx
 * <ActionIconButton
 *   icon={Edit}
 *   label="Editar"
 *   onClick={handleEdit}
 *   variant="primary"
 * />
 * ```
 */
export function ActionIconButton({
    icon: Icon,
    label,
    onClick,
    variant = 'default',
    disabled = false,
    isLoading = false,
    className
}: ActionIconButtonProps) {
    const variantClasses = {
        default: 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900',
        primary: 'bg-plura-accent/10 text-plura-accent hover:bg-plura-accent hover:text-white',
        danger: 'bg-red-50 text-red-600 hover:bg-red-500 hover:text-white'
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={cn(
                // Base styles (same as MainTabs)
                'group relative flex items-center gap-2 px-3 py-2.5 rounded-2xl',
                'transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]',
                'overflow-hidden whitespace-nowrap',

                // Width animation (collapsed by default, expands on hover)
                'max-w-[44px] hover:max-w-[160px]',

                // Variant colors
                variantClasses[variant],

                // Disabled state
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:max-w-[44px]',

                className
            )}
        >
            {/* Icon (always visible) */}
            <Icon
                size={20}
                className={cn(
                    'min-w-[20px] transition-colors',
                    isLoading && 'animate-spin'
                )}
            />

            {/* Label (hidden by default, shows on hover) */}
            <span
                className={cn(
                    'text-sm font-medium transition-opacity duration-300 delay-75',
                    'opacity-0 group-hover:opacity-100'
                )}
            >
                {label}
            </span>
        </button>
    );
}
