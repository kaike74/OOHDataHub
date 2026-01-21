'use client';

import React, { useEffect } from 'react';
import { X, LucideIcon } from 'lucide-react';
import { PluraModal } from './PluraModal';
import { cn } from '@/lib/utils';

/**
 * Section within the detail modal
 */
export interface DetailSection {
    /** Optional section title */
    title?: string;
    /** Optional icon for the section */
    icon?: React.ReactNode;
    /** Section content */
    content: React.ReactNode;
    /** Optional className for the section wrapper */
    className?: string;
}

/**
 * Action button configuration
 */
export interface DetailAction {
    /** Button label */
    label: string;
    /** Click handler */
    onClick: () => void;
    /** Optional icon */
    icon?: React.ReactNode;
    /** Button variant */
    variant?: 'primary' | 'secondary' | 'danger';
    /** Optional loading state */
    isLoading?: boolean;
}

/**
 * Props for UnifiedDetailModal
 */
export interface UnifiedDetailModalProps {
    /** Whether the modal is open */
    isOpen: boolean;
    /** Close handler */
    onClose: () => void;

    // Header
    /** Modal title */
    title: string;
    /** Optional subtitle (can be string or React node) */
    subtitle?: string | React.ReactNode;
    /** Optional logo/image (URL or React node) */
    logo?: string | React.ReactNode;

    // Content
    /** Array of sections to display */
    sections: DetailSection[];

    // Actions
    /** Optional action buttons */
    actions?: DetailAction[];

    // Footer
    /** Optional custom footer content */
    footer?: React.ReactNode;

    // Styling
    /** Optional className for the modal content */
    className?: string;
    /** Optional max width (default: 'max-w-4xl') */
    maxWidth?: string;
}

/**
 * Unified Detail Modal Component
 * 
 * Replaces all entity-specific sidebars/modals (ClientDetailsSidebar, 
 * AccountDetailsSidebar, ExibidoraSidebar) with a single, reusable component.
 * 
 * Features:
 * - Consistent modal UX across all entity types
 * - Flexible section-based content layout
 * - Configurable action buttons
 * - Support for logos/images
 * - Responsive design
 * 
 * @example
 * ```tsx
 * <UnifiedDetailModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   title={client.name}
 *   subtitle={client.email}
 *   logo={client.logo_url}
 *   sections={[
 *     {
 *       title: "Informações",
 *       icon: <Building2 size={16} />,
 *       content: <ClientInfo client={client} />
 *     },
 *     {
 *       title: "Propostas",
 *       icon: <FileText size={16} />,
 *       content: <ClientProposals clientId={client.id} />
 *     }
 *   ]}
 *   actions={[
 *     { 
 *       label: "Editar", 
 *       onClick: handleEdit, 
 *       icon: <Pencil size={16} />,
 *       variant: 'primary'
 *     },
 *     { 
 *       label: "Excluir", 
 *       onClick: handleDelete, 
 *       icon: <Trash size={16} />,
 *       variant: 'danger'
 *     }
 *   ]}
 * />
 * ```
 */
export function UnifiedDetailModal({
    isOpen,
    onClose,
    title,
    subtitle,
    logo,
    sections,
    actions,
    footer,
    className,
    maxWidth = 'max-w-4xl'
}: UnifiedDetailModalProps) {

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    return (
        <PluraModal
            isOpen={isOpen}
            onClose={onClose}
            title="" // We'll use custom header
            maxWidth={maxWidth}
        >
            <div className={cn("flex flex-col", className)}>
                {/* Header */}
                <div className="flex items-start gap-4 pb-6 border-b border-gray-100">
                    {/* Logo/Image */}
                    {logo && (
                        <div className="flex-shrink-0">
                            {typeof logo === 'string' ? (
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                    <img
                                        src={logo}
                                        alt={title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center">
                                    {logo}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Title & Subtitle */}
                    <div className="flex-1 min-w-0">
                        <h2 className="text-2xl font-bold text-gray-900 truncate">
                            {title}
                        </h2>
                        {subtitle && (
                            <div className="mt-1">
                                {typeof subtitle === 'string' ? (
                                    <p className="text-sm text-gray-500">{subtitle}</p>
                                ) : (
                                    subtitle
                                )}
                            </div>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="flex-shrink-0 p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                        aria-label="Fechar"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Sections */}
                <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className={cn("space-y-3", section.className)}
                        >
                            {/* Section Header */}
                            {(section.title || section.icon) && (
                                <div className="flex items-center gap-2">
                                    {section.icon && (
                                        <div className="text-plura-primary">
                                            {section.icon}
                                        </div>
                                    )}
                                    {section.title && (
                                        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                            {section.title}
                                        </h3>
                                    )}
                                </div>
                            )}

                            {/* Section Content */}
                            <div>
                                {section.content}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions or Footer */}
                {(actions && actions.length > 0) || footer ? (
                    <div className="pt-6 border-t border-gray-100">
                        {actions && actions.length > 0 && (
                            <div className="flex items-center gap-3 flex-wrap">
                                {actions.map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={action.onClick}
                                        disabled={action.isLoading}
                                        className={cn(
                                            "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all",
                                            "disabled:opacity-50 disabled:cursor-not-allowed",
                                            action.variant === 'danger'
                                                ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                                : action.variant === 'secondary'
                                                    ? "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                                                    : "bg-plura-accent text-white hover:bg-plura-accent-dark shadow-sm"
                                        )}
                                    >
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {footer && (
                            <div className="mt-4">
                                {footer}
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </PluraModal>
    );
}
