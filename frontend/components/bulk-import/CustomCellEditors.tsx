'use client';

import { useState, useRef, useEffect } from 'react';
import { TIPOS_OOH, PERIODO_LOCACAO } from '@/constants/oohTypes';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';

// ============================================================================
// TIPOS MULTI-SELECT EDITOR
// ============================================================================

interface TiposEditorProps {
    value: string; // Comma-separated string
    onChange: (value: string) => void;
    onClose: () => void;
}

export function TiposEditor({ value, onChange, onClose }: TiposEditorProps) {
    const [selectedTipos, setSelectedTipos] = useState<string[]>(() => {
        if (!value) return [];
        return value.split(',').map(t => t.trim()).filter(Boolean);
    });
    const [isOpen, setIsOpen] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleSave();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedTipos]);

    const toggleTipo = (tipo: string) => {
        setSelectedTipos(prev =>
            prev.includes(tipo)
                ? prev.filter(t => t !== tipo)
                : [...prev, tipo]
        );
    };

    const handleSave = () => {
        onChange(selectedTipos.join(', '));
        onClose();
    };

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <div className="absolute top-0 left-0 right-0 z-50 bg-white border border-emidias-primary rounded-lg shadow-xl p-3 max-h-[300px] overflow-y-auto">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                    Selecione os tipos (clique fora para salvar)
                </div>
                <div className="space-y-1">
                    {TIPOS_OOH.map(tipo => (
                        <button
                            key={tipo}
                            type="button"
                            onClick={() => toggleTipo(tipo)}
                            className={cn(
                                'w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                                selectedTipos.includes(tipo)
                                    ? 'bg-emidias-primary text-white'
                                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                            )}
                        >
                            <div className={cn(
                                'w-4 h-4 rounded border-2 flex items-center justify-center',
                                selectedTipos.includes(tipo)
                                    ? 'border-white bg-white'
                                    : 'border-gray-300'
                            )}>
                                {selectedTipos.includes(tipo) && (
                                    <Check size={12} className="text-emidias-primary" />
                                )}
                            </div>
                            {tipo}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MEDIDAS SPLIT EDITOR (Largura x Altura + Unit)
// ============================================================================

interface MedidasEditorProps {
    value: string; // Format: "9 x 3 M" or "1920 x 1080 PX"
    onChange: (value: string) => void;
    onClose: () => void;
}

export function MedidasEditor({ value, onChange, onClose }: MedidasEditorProps) {
    const parseValue = (): { largura: string; altura: string; unidade: 'M' | 'PX' } => {
        if (!value) return { largura: '', altura: '', unidade: 'M' };

        const match = value.match(/([\d.]+)\s*[xX×]\s*([\d.]+)\s*(M|PX|Px)?/i);
        if (match) {
            const unit = match[3]?.toUpperCase();
            return {
                largura: match[1],
                altura: match[2],
                unidade: (unit === 'PX' ? 'PX' : 'M') as 'M' | 'PX'
            };
        }
        return { largura: '', altura: '', unidade: 'M' };
    };

    const [largura, setLargura] = useState(parseValue().largura);
    const [altura, setAltura] = useState(parseValue().altura);
    const [unidade, setUnidade] = useState<'M' | 'PX'>(parseValue().unidade);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                handleSave();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [largura, altura, unidade]);

    const handleSave = () => {
        if (largura && altura) {
            onChange(`${largura} x ${altura} ${unidade}`);
        } else {
            onChange('');
        }
        onClose();
    };

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <div className="absolute top-0 left-0 right-0 z-50 bg-white border border-emidias-primary rounded-lg shadow-xl p-3 min-w-[300px]">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                    Medidas
                </div>

                {/* Unit Toggle */}
                <div className="bg-gray-100 p-0.5 rounded-lg flex text-xs font-semibold mb-2">
                    <button
                        type="button"
                        onClick={() => setUnidade('M')}
                        className={cn(
                            'flex-1 px-3 py-1.5 rounded-md transition-all',
                            unidade === 'M' ? 'bg-white shadow-sm text-emidias-primary' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        Metros
                    </button>
                    <button
                        type="button"
                        onClick={() => setUnidade('PX')}
                        className={cn(
                            'flex-1 px-3 py-1.5 rounded-md transition-all',
                            unidade === 'PX' ? 'bg-white shadow-sm text-emidias-primary' : 'text-gray-500 hover:text-gray-700'
                        )}
                    >
                        Pixels
                    </button>
                </div>

                {/* Inputs */}
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <input
                            type="text"
                            value={largura}
                            onChange={(e) => setLargura(unidade === 'PX' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                            placeholder="Largura"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-primary/20 focus:border-emidias-primary"
                            autoFocus
                        />
                        <div className="text-xs text-gray-400 mt-1">L ({unidade})</div>
                    </div>
                    <div>
                        <input
                            type="text"
                            value={altura}
                            onChange={(e) => setAltura(unidade === 'PX' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                            placeholder="Altura"
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emidias-primary/20 focus:border-emidias-primary"
                        />
                        <div className="text-xs text-gray-400 mt-1">A ({unidade})</div>
                    </div>
                </div>

                <div className="text-xs text-gray-400 mt-2 text-center">
                    Enter para salvar • Esc para cancelar
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// PERÍODO SELECT EDITOR
// ============================================================================

interface PeriodoEditorProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

export function PeriodoEditor({ value, onChange, onClose }: PeriodoEditorProps) {
    const [isOpen, setIsOpen] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (periodo: string) => {
        onChange(periodo);
        onClose();
    };

    return (
        <div ref={containerRef} className="relative w-full h-full">
            <div className="absolute top-0 left-0 right-0 z-50 bg-white border border-emidias-primary rounded-lg shadow-xl overflow-hidden min-w-[180px]">
                <div className="text-xs font-semibold text-gray-500 px-3 py-2 border-b border-gray-100">
                    Período de Locação
                </div>
                {PERIODO_LOCACAO.map(periodo => (
                    <button
                        key={periodo}
                        type="button"
                        onClick={() => handleSelect(periodo)}
                        className={cn(
                            'w-full text-left px-3 py-2 text-sm font-medium transition-colors hover:bg-emidias-primary/5',
                            value === periodo && 'bg-emidias-primary/10 text-emidias-primary'
                        )}
                    >
                        {periodo}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => handleSelect('')}
                    className="w-full text-left px-3 py-2 text-sm font-medium text-gray-400 hover:bg-gray-50 border-t border-gray-100"
                >
                    (vazio)
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// COORDINATE EDITOR (with validation)
// ============================================================================

interface CoordinateEditorProps {
    value: number | string;
    onChange: (value: number | string) => void;
    onClose: () => void;
    type: 'latitude' | 'longitude';
}

export function CoordinateEditor({ value, onChange, onClose, type }: CoordinateEditorProps) {
    const [inputValue, setInputValue] = useState(String(value || ''));
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleSave();
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
                handleSave();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [inputValue]);

    const handleSave = () => {
        if (!inputValue.trim()) {
            onChange('');
            onClose();
            return;
        }

        // Normalize: replace comma with dot
        const normalized = inputValue.replace(/,/g, '.');
        const num = parseFloat(normalized);

        if (isNaN(num)) {
            setError('Número inválido');
            return;
        }

        if (num < -180 || num > 180) {
            setError('Fora do range (-180 a 180)');
            return;
        }

        onChange(num);
        onClose();
    };

    return (
        <div className="relative w-full h-full">
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setError('');
                }}
                className={cn(
                    'w-full h-full px-2 text-sm border-2 focus:outline-none',
                    error ? 'border-red-500 bg-red-50' : 'border-emidias-primary bg-white'
                )}
                placeholder={type === 'latitude' ? '-23.5505' : '-46.6333'}
            />
            {error && (
                <div className="absolute top-full left-0 mt-1 text-xs text-red-500 bg-white px-2 py-1 rounded shadow-lg z-50 whitespace-nowrap">
                    {error}
                </div>
            )}
        </div>
    );
}
