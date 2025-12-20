import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, icon, id, children, ...props }, ref) => {
        const selectId = id || React.useId();

        return (
            <div className="space-y-1.5 w-full">
                {label && (
                    <label htmlFor={selectId} className="block text-sm font-semibold text-emidias-gray-700">
                        {label} {props.required && <span className="text-emidias-accent">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-emidias-gray-400 pointer-events-none">
                            {icon}
                        </div>
                    )}
                    <select
                        ref={ref}
                        id={selectId}
                        className={cn(
                            "w-full px-4 py-3 rounded-xl border border-emidias-gray-200 bg-white text-emidias-gray-900 appearance-none",
                            "transition-all duration-200 outline-none cursor-pointer",
                            "focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10",
                            "disabled:opacity-60 disabled:bg-emidias-gray-50 disabled:cursor-not-allowed",
                            icon && "pl-10",
                            error && "border-emidias-danger focus:border-emidias-danger focus:ring-emidias-danger/10",
                            className
                        )}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emidias-gray-500">
                        <ChevronDown size={18} />
                    </div>
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

Select.displayName = "Select";
