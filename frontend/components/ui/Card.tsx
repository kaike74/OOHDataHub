import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    hover?: boolean;
    glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, hover = false, glass = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "rounded-2xl border transition-all duration-300",
                    glass
                        ? "bg-white/80 backdrop-blur-sm border-emidias-gray-100 shadow-card"
                        : "bg-white border-emidias-gray-100 shadow-card",
                    hover && "hover:-translate-y-1 hover:shadow-emidias-lg",
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = "Card";
