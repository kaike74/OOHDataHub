'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PluraInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    helperText?: string;
}

export const PluraInput = React.forwardRef<HTMLInputElement, PluraInputProps>(
    ({ className, label, error, leftIcon, rightIcon, helperText, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-plura-gray-700 mb-2">
                        {label}
                    </label>
                )}
                <div className="relative">
                    {leftIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-plura-gray-400">
                            {leftIcon}
                        </div>
                    )}
                    <input
                        ref={ref}
                        className={cn(
                            'w-full px-4 py-2.5 rounded-xl border transition-all duration-200',
                            'bg-white text-plura-gray-900 placeholder:text-plura-gray-400',
                            'focus:outline-none focus:ring-2 focus:ring-plura-accent/20 focus:border-plura-accent',
                            'disabled:bg-plura-gray-50 disabled:text-plura-gray-500 disabled:cursor-not-allowed',
                            error
                                ? 'border-plura-danger focus:border-plura-danger focus:ring-plura-danger/20'
                                : 'border-plura-gray-200 hover:border-plura-gray-300',
                            leftIcon && 'pl-10',
                            rightIcon && 'pr-10',
                            className
                        )}
                        {...props}
                    />
                    {rightIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-plura-gray-400">
                            {rightIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <p className="mt-1.5 text-sm text-plura-danger">{error}</p>
                )}
                {helperText && !error && (
                    <p className="mt-1.5 text-sm text-plura-gray-500">{helperText}</p>
                )}
            </div>
        );
    }
);

PluraInput.displayName = 'PluraInput';
