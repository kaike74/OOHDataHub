'use client';

import React from 'react';
import { PluraModal } from './PluraModal';
import { X, Edit, Trash2, History, Share2 } from 'lucide-react';
import { Button } from './Button';

interface DetailAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
}

interface DetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;

    // Visual content (left side)
    visualContent?: React.ReactNode;

    // Detail content (right side or full if no visual)
    children: React.ReactNode;

    // Standard actions
    onEdit?: () => void;
    onDelete?: () => void;
    onHistory?: () => void;
    onShare?: () => void;

    // Custom actions
    customActions?: DetailAction[];

    // Disable standard actions
    readOnly?: boolean;
}

/**
 * Standardized detail modal for viewing/editing entities
 * Used for: Clients, Exhibitors, Points, Accounts, etc.
 * 
 * Features:
 * - Consistent layout (visual left, details right)
 * - Standard action buttons (edit, delete, history, share)
 * - Customizable actions
 * - Read-only mode
 */
export function DetailModal({
    isOpen,
    onClose,
    title,
    subtitle,
    visualContent,
    children,
    onEdit,
    onDelete,
    onHistory,
    onShare,
    customActions = [],
    readOnly = false
}: DetailModalProps) {

    // Build standard actions
    const standardActions: DetailAction[] = [];

    if (!readOnly) {
        if (onEdit) {
            standardActions.push({
                label: 'Editar',
                icon: <Edit size={18} />,
                onClick: onEdit,
                variant: 'secondary'
            });
        }

        if (onDelete) {
            standardActions.push({
                label: 'Excluir',
                icon: <Trash2 size={18} />,
                onClick: onDelete,
                variant: 'danger'
            });
        }
    }

    if (onHistory) {
        standardActions.push({
            label: 'Histórico',
            icon: <History size={18} />,
            onClick: onHistory,
            variant: 'secondary'
        });
    }

    if (onShare) {
        standardActions.push({
            label: 'Compartilhar',
            icon: <Share2 size={18} />,
            onClick: onShare,
            variant: 'secondary'
        });
    }

    const allActions = [...customActions, ...standardActions];

    // Footer with actions
    const footer = allActions.length > 0 ? (
        <div className="flex items-center justify-end gap-2">
            {allActions.map((action, index) => (
                <Button
                    key={index}
                    onClick={action.onClick}
                    variant={action.variant || 'secondary'}
                    size="sm"
                    leftIcon={action.icon}
                >
                    {action.label}
                </Button>
            ))}
        </div>
    ) : undefined;

    return (
        <PluraModal
            isOpen={isOpen}
            onClose={onClose}
            variant={visualContent ? 'detail' : 'simple'}
            title={title}
            subtitle={subtitle}
            leftContent={visualContent}
            rightContent={children}
            footer={footer}
        />
    );
}

/**
 * Simplified detail modal for entities without visual content
 */
export function SimpleDetailModal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    onEdit,
    onDelete,
    readOnly = false
}: Omit<DetailModalProps, 'visualContent' | 'customActions' | 'onHistory' | 'onShare'>) {
    return (
        <DetailModal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            subtitle={subtitle}
            onEdit={onEdit}
            onDelete={onDelete}
            readOnly={readOnly}
        >
            {children}
        </DetailModal>
    );
}
