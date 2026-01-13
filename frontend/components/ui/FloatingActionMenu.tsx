'use client';

import React, { useState, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface ActionItem {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string;
}

interface FloatingActionMenuProps {
    actions: ActionItem[];
    onOpenChange?: (isOpen: boolean) => void; // Callback for parent
}

export default function FloatingActionMenu({ actions, onOpenChange }: FloatingActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Notify parent when menu opens/closes
    useEffect(() => {
        onOpenChange?.(isOpen);
    }, [isOpen, onOpenChange]);

    // Calculate positions for radial expansion
    // Distribute buttons in a semi-circle around the main button
    const getButtonPosition = (index: number, total: number) => {
        if (!isOpen) return { x: 0, y: 0 };

        // Reduced radius for tighter spacing
        const radius = 55;

        // Angle calculation: semi-circle expanding to the LEFT
        // Starting from top (90°) going counter-clockwise to bottom-left (270°)
        const startAngle = Math.PI / 2; // 90 degrees (top)
        const endAngle = (3 * Math.PI) / 2; // 270 degrees (bottom)
        const angleStep = (endAngle - startAngle) / (total - 1);
        const angle = startAngle + (angleStep * index);

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return { x, y };
    };

    return (
        <div className="relative w-12 h-12 flex items-center justify-center">
            {/* Invisible expanded hover area - doesn't affect layout */}
            <div
                className="absolute pointer-events-auto"
                style={{
                    width: isOpen ? '320px' : '48px',
                    height: isOpen ? '320px' : '48px',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    transition: 'width 0.3s ease-out, height 0.3s ease-out',
                    zIndex: 20
                }}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            />
            {/* Radially Expanded Action Buttons */}
            {actions.map((action, index) => {
                const { x, y } = getButtonPosition(index, actions.length);

                return (
                    <TooltipProvider key={index}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    style={{
                                        transform: `translate(${x}px, ${y}px) scale(${isOpen ? 1 : 0})`,
                                        transitionDelay: isOpen ? `${index * 50}ms` : `${(actions.length - index - 1) * 30}ms`,
                                        zIndex: 30,
                                        pointerEvents: isOpen ? 'auto' : 'none'
                                    }}
                                    className={cn(
                                        "absolute w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200",
                                        "flex items-center justify-center",
                                        "transition-all duration-300 ease-out",
                                        "text-gray-700 hover:text-blue-600 hover:border-blue-300 hover:shadow-xl hover:scale-110"
                                    )}
                                >
                                    {action.icon}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{action.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                );
            })}

            {/* Main Trigger Button (3 Dots) */}
            <button
                className={cn(
                    "relative w-10 h-10 rounded-full flex items-center justify-center",
                    "transition-all duration-300",
                    "bg-white shadow-md border border-gray-200",
                    isOpen
                        ? "bg-blue-50 text-blue-600 border-blue-300 rotate-90 scale-110"
                        : "text-gray-500 hover:bg-gray-50 hover:border-gray-300"
                )}
                style={{ zIndex: 25 }}
                onMouseEnter={() => setIsOpen(true)}
            >
                <MoreVertical size={20} />
            </button>
        </div>
    );
}
