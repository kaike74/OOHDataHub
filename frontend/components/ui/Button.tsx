import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {

        const variants = {
            primary: "bg-gradient-to-r from-emidias-primary to-emidias-accent text-white shadow-accent hover:shadow-accent-lg border-transparent",
            secondary: "bg-white text-emidias-primary border-2 border-emidias-primary/10 hover:border-emidias-accent hover:text-emidias-accent hover:bg-white",
            outline: "bg-transparent border border-emidias-gray-300 text-emidias-gray-700 hover:border-emidias-primary hover:text-emidias-primary",
            ghost: "bg-transparent text-emidias-gray-600 hover:bg-emidias-gray-100 hover:text-emidias-primary shadow-none",
            danger: "bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 hover:border-red-200 shadow-sm",
            accent: "bg-emidias-accent text-white hover:bg-emidias-accent-dark shadow-accent hover:shadow-accent-lg border-transparent",
        };

        const sizes = {
            sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
            md: "px-6 py-3 text-base rounded-xl gap-2",
            lg: "px-8 py-4 text-lg rounded-xl gap-3",
            icon: "p-2 rounded-xl aspect-square flex items-center justify-center",
        };

        const baseStyles = "inline-flex items-center justify-center font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none";

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />}
                {!isLoading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
                {children}
                {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
            </button>
        );
    }
);

Button.displayName = "Button";
