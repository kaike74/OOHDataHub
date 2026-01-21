'use client';

import { useState, useEffect, useRef } from 'react';
import { PERIODO_LOCACAO } from '@/constants/oohTypes';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PeriodoSelectEditorProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

export function PeriodoSelectEditor({ value, onChange, onClose }: PeriodoSelectEditorProps) {
    const [selected, setSelected] = useState<string>(value || 'Bissemanal');
    const [isOpen, setIsOpen] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                handleClose();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleClose();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                handleClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selected]);

    const handleClose = () => {
        onChange(selected);
        setIsOpen(false);
        onClose();
    };

    const handleSelect = (periodo: string) => {
        setSelected(periodo);
        onChange(periodo);
        // Auto-close after selection
        setTimeout(() => {
            setIsOpen(false);
            onClose();
        }, 100);
    };

    if (!isOpen) return null;

    return (
        <div className="relative w-full h-full">
            {/* Input display */}
            <div className="w-full h-full px-2 text-sm border-2 border-plura-primary bg-white flex items-center">
                <span className="truncate text-gray-700">
                    {selected || 'Selecione...'}
                </span>
            </div>

            {/* Dropdown */}
            <div
                ref={dropdownRef}
                className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] overflow-hidden"
                style={{ minWidth: '150px' }}
            >
                <div className="py-1">
                    {PERIODO_LOCACAO.map(periodo => {
                        const isSelected = selected === periodo;
                        return (
                            <button
                                key={periodo}
                                type="button"
                                onClick={() => handleSelect(periodo)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors text-left',
                                    isSelected
                                        ? 'bg-plura-primary/10 text-plura-primary font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                )}
                            >
                                <div
                                    className={cn(
                                        'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                        isSelected
                                            ? 'bg-plura-primary border-plura-primary'
                                            : 'border-gray-300'
                                    )}
                                >
                                    {isSelected && <Check size={12} className="text-white" />}
                                </div>
                                <span>{periodo}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
