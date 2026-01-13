'use client';

import React, { useState } from 'react';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

interface ActionItem {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    color?: string; // Hex or Tailwind class prefix
}

interface FloatingActionMenuProps {
    actions: ActionItem[];
}

export default function FloatingActionMenu({ actions }: FloatingActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div
            className="flex items-center gap-2 relative h-10"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Expanded Actions */}
            <div className={cn(
                "flex items-center gap-2 transition-all duration-300 ease-out origin-right absolute right-0 top-0 h-full pr-10",
                isOpen ? "opacity-100 scale-100 translate-x-0 pointer-events-auto" : "opacity-0 scale-90 translate-x-4 pointer-events-none"
            )}>
                {actions.map((action, index) => (
                    <TooltipProvider key={index}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    style={{ transitionDelay: `${index * 50}ms` }}
                                    className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 flex items-center justify-center hover:scale-110 hover:-translate-y-1 transition-all duration-300 text-gray-700 hover:text-blue-600 hover:border-blue-200 animate-in zoom-in-50 fade-in slide-in-from-right-4 fill-mode-backwards"
                                >
                                    {action.icon}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{action.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ))}
            </div>

            {/* Trigger Button (3 Dots) */}
            <div className="relative z-10 bg-white rounded-full">
                <button
                    className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isOpen ? "bg-gray-100 text-gray-900 rotate-90" : "bg-white text-gray-500 hover:bg-gray-50 shadow-sm border border-gray-200"
                    )}
                >
                    <MoreVertical size={20} />
                </button>
            </div>

        </div>
    );
}
