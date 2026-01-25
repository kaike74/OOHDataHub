'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActionIconButton, type ActionButton } from '@/components/ui/ActionIconButton';

export interface NavigationConfig {
    current: number;
    total: number;
    onPrevious: () => void;
    onNext: () => void;
    hasPrevious: boolean;
    hasNext: boolean;
}

interface UnifiedStandardModalProps {
    isOpen: boolean;
    onClose: () => void;

    // 1. Header
    title: string;

    // 2. Hero (Top Section) - Avatar, Main Info, Badges
    hero: React.ReactNode;

    // 3. Content Grid Slots
    // If a slot is not provided, the others will expand
    visualContent?: React.ReactNode; // Map, Chart, Image (Left/Top)
    infoContent?: React.ReactNode;   // Key Value Cards (Center/Middle)
    listContent?: React.ReactNode;   // Lists, History (Right/Bottom)

    // 4. Footer
    actions?: ActionButton[];
    navigation?: NavigationConfig;

    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
    zIndex?: number;
    className?: string;
}

/**
 * Unified Standard Modal
 * 
 * Layout Structure:
 * ┌─────────────────────────────────┐
 * │ Header: Title + Close           │
 * ├─────────────────────────────────┤
 * │ Hero: Avatar + Main Info        │
 * ├─────────────────────────────────┤
 * │ Content Grid (Auto-layout)      │
 * │ ┌────────┬────────┬────────┐    │
 * │ │ Visual │  Info  │  List  │    │
 * │ └────────┴────────┴────────┘    │
 * ├─────────────────────────────────┤
 * │ Footer: Actions & Nav           │
 * └─────────────────────────────────┘
 */
export function UnifiedStandardModal({
    isOpen,
    onClose,
    title,
    hero,
    visualContent,
    infoContent,
    listContent,
    actions = [],
    navigation,
    maxWidth = '7xl',
    zIndex = 2000,
    className
}: UnifiedStandardModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth={maxWidth}
            className={cn('p-0 overflow-hidden rounded-[1.5rem] bg-gray-50/50', className)}
            zIndex={zIndex}
            hideCloseButton={true}
        >
            <div className="flex flex-col h-[90vh] md:h-[700px] bg-white shadow-2xl overflow-hidden relative">

                {/* 1. HEADER (Fixed) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm z-20">
                    <h2 className="text-lg font-bold text-gray-900 truncate">{title}</h2>
                    <button
                        onClick={onClose}
                        className="h-8 w-8 rounded-lg bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 flex items-center justify-center transition-all border border-gray-100"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* SCROLLABLE CONTENT AREA */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gray-50/30">
                    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

                        {/* 2. HERO SECTION */}
                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden">
                            {hero}
                        </div>

                        {/* 3. CONTENT GRID */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                            {/* Visual Panel (Map/Image) */}
                            {visualContent && (
                                <div className={cn(
                                    "flex flex-col gap-4 min-h-[300px]",
                                    infoContent && listContent ? "lg:col-span-4" :
                                        infoContent ? "lg:col-span-5" : "lg:col-span-12"
                                )}>
                                    {visualContent}
                                </div>
                            )}

                            {/* Info Panel (Cards) */}
                            {infoContent && (
                                <div className={cn(
                                    "flex flex-col gap-4",
                                    visualContent && listContent ? "lg:col-span-4" :
                                        visualContent ? "lg:col-span-7" :
                                            listContent ? "lg:col-span-8" : "lg:col-span-12"
                                )}>
                                    {infoContent}
                                </div>
                            )}

                            {/* List Panel (Proposals/Contacts) */}
                            {listContent && (
                                <div className={cn(
                                    "flex flex-col gap-4",
                                    visualContent && infoContent ? "lg:col-span-4" :
                                        visualContent ? "lg:col-span-12" : // Wraps below if visual is too big
                                            infoContent ? "lg:col-span-4" : "lg:col-span-12"
                                )}>
                                    {listContent}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 4. FOOTER (Fixed) */}
                {(actions.length > 0 || navigation) && (
                    <div className="flex-shrink-0 px-6 py-4 border-t border-gray-100 bg-white/80 backdrop-blur-md z-20">
                        <div className="flex items-center justify-between max-w-[1600px] mx-auto">
                            {/* Navigation */}
                            <div className="flex items-center gap-2">
                                {navigation ? (
                                    <>
                                        <button
                                            onClick={navigation.onPrevious}
                                            disabled={!navigation.hasPrevious}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                        <span className="text-xs font-medium text-gray-400 min-w-[60px] text-center">
                                            {navigation.current} / {navigation.total}
                                        </span>
                                        <button
                                            onClick={navigation.onNext}
                                            disabled={!navigation.hasNext}
                                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </>
                                ) : <div className="w-10" /> /* Spacer */}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                {actions.map((action, index) => (
                                    <ActionIconButton
                                        key={index}
                                        {...action}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
