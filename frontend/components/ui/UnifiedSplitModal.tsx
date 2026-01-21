'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionIconButton } from '@/components/ui/ActionIconButton';
import { LucideIcon } from 'lucide-react';

export interface ActionButton {
    icon: LucideIcon;
    label: string;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'danger';
    disabled?: boolean;
    isLoading?: boolean;
}

export interface NavigationConfig {
    current: number;
    total: number;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
}

interface UnifiedSplitModalProps {
    // Modal state
    isOpen: boolean;
    onClose: () => void;

    // Left panel (visuals)
    leftContent: React.ReactNode;
    leftBackground?: 'dark' | 'light';

    // Right panel (data)
    rightContent: React.ReactNode;

    // Footer actions
    actions?: ActionButton[];

    // Optional navigation
    navigation?: NavigationConfig;

    // Styling
    maxWidth?: string;
    zIndex?: number;
    className?: string;
}

/**
 * Unified Split Modal Component
 * 
 * Standard modal layout for ALL entity detail views:
 * - Points, Exhibitors, Clients, Accounts
 * 
 * Features:
 * - Split view (visual left, data right)
 * - Standardized footer with action buttons
 * - Optional navigation (previous/next)
 * - Reuses ActionIconButton with tab animation
 * 
 * @example
 * ```tsx
 * <UnifiedSplitModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 *   leftContent={<VisualPanel />}
 *   rightContent={<DataPanel />}
 *   actions={[
 *     { icon: Edit, label: "Editar", onClick: handleEdit, variant: 'primary' },
 *     { icon: Trash2, label: "Deletar", onClick: handleDelete, variant: 'danger' }
 *   ]}
 *   navigation={{
 *     current: 1,
 *     total: 10,
 *     onPrevious: handlePrev,
 *     onNext: handleNext,
 *     hasPrevious: true,
 *     hasNext: true
 *   }}
 * />
 * ```
 */
export function UnifiedSplitModal({
    isOpen,
    onClose,
    leftContent,
    leftBackground = 'dark',
    rightContent,
    actions = [],
    navigation,
    maxWidth = '6xl',
    zIndex = 2000,
    className
}: UnifiedSplitModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth={maxWidth}
            className={cn('p-0 overflow-hidden rounded-[2rem]', className)}
            zIndex={zIndex}
            hideCloseButton={true}
        >
            <div className="flex flex-col md:flex-row h-[85vh] md:h-[600px] bg-white overflow-hidden shadow-2xl">

                {/* LEFT PANEL (Visuals) */}
                <div className={cn(
                    'w-full md:w-[40%] h-[200px] md:h-full flex flex-col relative border-r border-gray-100/10',
                    leftBackground === 'dark' ? 'bg-plura-primary' : 'bg-gray-100'
                )}>
                    {leftContent}
                </div>

                {/* RIGHT PANEL (Data) */}
                <div className="w-full md:w-[60%] h-full flex flex-col bg-white relative">
                    {/* Close Button (Absolute in Corner) */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-50 h-9 w-9 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all border border-gray-100"
                    >
                        <X size={20} />
                    </button>

                    {/* Content */}
                    <div className="flex-1 overflow-hidden">
                        {rightContent}
                    </div>

                    {/* STANDARDIZED FOOTER */}
                    {(actions.length > 0 || navigation) && (
                        <div className="flex-shrink-0 px-4 py-3 border-t border-gray-100 bg-white/80 backdrop-blur-md">
                            <div className="flex items-center justify-between">
                                {/* Navigation (Left Side) */}
                                {navigation ? (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={navigation.onPrevious}
                                            disabled={!navigation.hasPrevious}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Anterior"
                                        >
                                            <ChevronLeft size={16} />
                                        </button>

                                        <span className="text-[10px] font-medium text-gray-400 min-w-[60px] text-center">
                                            {navigation.current} / {navigation.total}
                                        </span>

                                        <button
                                            onClick={navigation.onNext}
                                            disabled={!navigation.hasNext}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Próximo"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div /> // Spacer
                                )}

                                {/* Action Buttons (Right Side) */}
                                <div className="flex items-center gap-2">
                                    {actions.map((action, index) => (
                                        <ActionIconButton
                                            key={index}
                                            icon={action.icon}
                                            label={action.label}
                                            onClick={action.onClick}
                                            variant={action.variant}
                                            disabled={action.disabled}
                                            isLoading={action.isLoading}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
