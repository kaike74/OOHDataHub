'use client';

import { useState, useEffect, useRef } from 'react';
import { TIPOS_OOH } from '@/constants/oohTypes';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TiposMultiSelectEditorProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

export function TiposMultiSelectEditor({ value, onChange, onClose }: TiposMultiSelectEditorProps) {
    // Parse comma-separated string to array
    const selectedTipos = value
        ? value.split(',').map(t => t.trim()).filter(Boolean)
        : [];

    const [selected, setSelected] = useState<string[]>(selectedTipos);
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
        // Save selected values as comma-separated string
        const newValue = selected.join(', ');
        onChange(newValue);
        setIsOpen(false);
        onClose();
    };

    const toggleTipo = (tipo: string) => {
        const newSelected = selected.includes(tipo)
            ? selected.filter(t => t !== tipo)
            : [...selected, tipo];

        setSelected(newSelected);
        onChange(newSelected.join(', '));
    };

    if (!isOpen) return null;

    return (
        <div className="relative w-full h-full">
            {/* Input display */}
            <div className="w-full h-full px-2 text-sm border-2 border-emidias-primary bg-white flex items-center">
                <span className="truncate text-gray-700">
                    {selected.length > 0 ? selected.join(', ') : 'Selecione...'}
                </span>
            </div>

            {/* Dropdown */}
            <div
                ref={dropdownRef}
                className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] max-h-80 overflow-y-auto"
                style={{ minWidth: '250px' }}
            >
                <div className="p-2 space-y-1">
                    {TIPOS_OOH.map(tipo => {
                        const isSelected = selected.includes(tipo);
                        return (
                            <button
                                key={tipo}
                                type="button"
                                onClick={() => toggleTipo(tipo)}
                                className={cn(
                                    'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors text-left',
                                    isSelected
                                        ? 'bg-emidias-primary/10 text-emidias-primary font-medium'
                                        : 'hover:bg-gray-50 text-gray-700'
                                )}
                            >
                                <div
                                    className={cn(
                                        'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                                        isSelected
                                            ? 'bg-emidias-primary border-emidias-primary'
                                            : 'border-gray-300'
                                    )}
                                >
                                    {isSelected && <Check size={12} className="text-white" />}
                                </div>
                                <span>{tipo}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Footer hint */}
                <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 text-xs text-gray-500">
                    {selected.length} selecionado{selected.length !== 1 ? 's' : ''} • Enter ou clique fora para fechar
                </div>
            </div>
        </div>
    );
}
