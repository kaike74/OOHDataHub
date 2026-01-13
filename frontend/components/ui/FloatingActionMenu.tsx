'use client';

import React, { useState } from 'react';
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
}

export default function FloatingActionMenu({ actions }: FloatingActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Calculate positions for radial expansion
    // Distribute buttons in a semi-circle around the main button
    const getButtonPosition = (index: number, total: number) => {
        if (!isOpen) return { x: 0, y: 0 };

        // Radius of the circle
        const radius = 70;

        // Angle calculation: distribute evenly in a semi-circle (180 degrees)
        // Starting from left (180°) to top-right (0°)
        const startAngle = Math.PI; // 180 degrees (left)
        const endAngle = 0; // 0 degrees (right)
        const angleStep = (startAngle - endAngle) / (total - 1);
        const angle = startAngle - (angleStep * index);

        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return { x, y };
    };

    return (
        <div
            className="relative w-12 h-12 flex items-center justify-center"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
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
                                    }}
                                    className={cn(
                                        "absolute w-10 h-10 rounded-full bg-white shadow-lg border border-gray-200",
                                        "flex items-center justify-center",
                                        "transition-all duration-300 ease-out",
                                        "text-gray-700 hover:text-blue-600 hover:border-blue-300 hover:shadow-xl hover:scale-110",
                                        !isOpen && "pointer-events-none"
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
                    "relative z-10 w-10 h-10 rounded-full flex items-center justify-center",
                    "transition-all duration-300",
                    "bg-white shadow-md border border-gray-200",
                    isOpen
                        ? "bg-blue-50 text-blue-600 border-blue-300 rotate-90 scale-110"
                        : "text-gray-500 hover:bg-gray-50 hover:border-gray-300"
                )}
            >
                <MoreVertical size={20} />
            </button>
        </div>
    );
}
