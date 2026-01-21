import { ReactNode } from 'react';
import { cn } from '@/lib/utils'; // Assuming this utility exists

type CardPriority = 'low' | 'medium' | 'high';

interface PriorityCardProps {
    children: ReactNode;
    priority?: CardPriority;
    className?: string;
    onClick?: () => void;
}

export default function PriorityCard({
    children,
    priority = 'low',
    className,
    onClick
}: PriorityCardProps) {

    const priorityStyles = {
        low: "border-gray-200 bg-white hover:border-gray-300",
        medium: "border-plura-accent/20 bg-white shadow-sm hover:shadow-md hover:border-plura-accent/40",
        high: "border-transparent bg-gradient-to-br from-white to-gray-50 shadow-lg relative overflow-hidden group"
    };

    const highPriorityOverlay = priority === 'high' ? (
        <div className="absolute top-0 left-0 w-1 bg-gradient-to-b from-plura-accent to-plura-primary h-full" />
    ) : null;

    return (
        <div
            onClick={onClick}
            className={cn(
                "rounded-xl border transition-all duration-300 cursor-pointer p-4 md:p-6",
                priorityStyles[priority],
                className
            )}
        >
            {highPriorityOverlay}
            {children}
        </div>
    );
}
