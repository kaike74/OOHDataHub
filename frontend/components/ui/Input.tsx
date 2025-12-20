import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, icon, rightElement, id, ...props }, ref) => {
        const inputId = id || React.useId();

        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-semibold text-emidias-gray-700">
                        {label} {props.required && <span className="text-emidias-accent">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emidias-gray-400 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        id={inputId}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border border-emidias-gray-200 bg-white text-emidias-gray-900 placeholder:text-emidias-gray-400",
                            "transition-all duration-200 outline-none",
                            "focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10",
                            "disabled:opacity-60 disabled:bg-emidias-gray-50 disabled:cursor-not-allowed",
                            icon && "pl-10",
                            rightElement && "pr-10",
                            error && "border-emidias-danger focus:border-emidias-danger focus:ring-emidias-danger/10",
                            className
                        )}
                        {...props}
                    />
                    {rightElement && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emidias-gray-400">
                            {rightElement}
                        </div>
                    )}
                </div>
                {error && (
                    <div className="flex items-center gap-1 text-emidias-danger text-xs animate-fade-in-down">
                        <AlertCircle size={12} />
                        <span>{error}</span>
                    </div>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";
