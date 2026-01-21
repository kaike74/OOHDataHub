'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Check, ChevronDown, X } from 'lucide-react';

interface PluraSelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

interface PluraSelectProps {
    label?: string;
    error?: string;
    helperText?: string;
    options: PluraSelectOption[];
    value?: string | string[];
    onChange?: (value: string | string[]) => void;
    placeholder?: string;
    multiple?: boolean;
    searchable?: boolean;
    disabled?: boolean;
    className?: string;
}

export function PluraSelect({
    label,
    error,
    helperText,
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    multiple = false,
    searchable = false,
    disabled = false,
    className
}: PluraSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedValues = Array.isArray(value) ? value : value ? [value] : [];

    const filteredOptions = searchable
        ? options.filter(opt =>
            opt.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : options;

    const handleSelect = (optionValue: string) => {
        if (multiple) {
            const newValues = selectedValues.includes(optionValue)
                ? selectedValues.filter(v => v !== optionValue)
                : [...selectedValues, optionValue];
            onChange?.(newValues);
        } else {
            onChange?.(optionValue);
            setIsOpen(false);
        }
    };

    const getDisplayText = () => {
        if (selectedValues.length === 0) return placeholder;
        if (multiple) {
            return selectedValues
                .map(v => options.find(opt => opt.value === v)?.label)
                .filter(Boolean)
                .join(', ');
        }
        return options.find(opt => opt.value === selectedValues[0])?.label || placeholder;
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className={cn('w-full relative', className)}>
            {label && (
                <label className="block text-sm font-medium text-plura-gray-700 mb-2">
                    {label}
                </label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={cn(
                    'w-full px-4 py-2.5 rounded-xl border transition-all duration-200',
                    'bg-white text-left flex items-center justify-between',
                    'focus:outline-none focus:ring-2 focus:ring-plura-accent/20 focus:border-plura-accent',
                    'disabled:bg-plura-gray-50 disabled:text-plura-gray-500 disabled:cursor-not-allowed',
                    error
                        ? 'border-plura-danger focus:border-plura-danger focus:ring-plura-danger/20'
                        : 'border-plura-gray-200 hover:border-plura-gray-300',
                    selectedValues.length > 0 ? 'text-plura-gray-900' : 'text-plura-gray-400'
                )}
            >
                <span className="truncate">{getDisplayText()}</span>
                <ChevronDown
                    size={18}
                    className={cn(
                        'ml-2 transition-transform text-plura-gray-400',
                        isOpen && 'rotate-180'
                    )}
                />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-2 bg-white rounded-xl border border-plura-gray-200 shadow-plura-lg overflow-hidden">
                    {searchable && (
                        <div className="p-2 border-b border-plura-gray-100">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar..."
                                className="w-full px-3 py-2 text-sm rounded-lg border border-plura-gray-200 focus:outline-none focus:ring-2 focus:ring-plura-accent/20 focus:border-plura-accent"
                            />
                        </div>
                    )}

                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-plura-gray-400 text-center">
                                Nenhuma opção encontrada
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = selectedValues.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => !option.disabled && handleSelect(option.value)}
                                        disabled={option.disabled}
                                        className={cn(
                                            'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between',
                                            'hover:bg-plura-gray-50',
                                            isSelected && 'bg-plura-accent/5 text-plura-primary font-medium',
                                            option.disabled && 'opacity-50 cursor-not-allowed'
                                        )}
                                    >
                                        <span>{option.label}</span>
                                        {isSelected && (
                                            <Check size={16} className="text-plura-accent" />
                                        )}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {error && (
                <p className="mt-1.5 text-sm text-plura-danger">{error}</p>
            )}
            {helperText && !error && (
                <p className="mt-1.5 text-sm text-plura-gray-500">{helperText}</p>
            )}
        </div>
    );
}
