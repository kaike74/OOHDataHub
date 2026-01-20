'use client';

import { useState, useEffect, useRef } from 'react';
import { TIPOS_VALIDOS } from '@/lib/dataNormalizers';

// ============================================================================
// TIPOS EDITOR - Multiselect
// ============================================================================

interface TiposEditorProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

export function TiposEditor({ value, onChange, onClose }: TiposEditorProps) {
    const [selectedTipos, setSelectedTipos] = useState<string[]>(() => {
        if (!value) return [];
        return value.split(',').map(t => t.trim()).filter(Boolean);
    });
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handleSave();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [selectedTipos]);

    const handleToggle = (tipo: string) => {
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20" onClick={handleSave}>
            <div
                ref={ref}
                className="w-80 max-h-96 bg-white border-2 border-emidias-primary rounded-lg shadow-2xl overflow-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-3 space-y-2">
                    <div className="font-semibold text-sm text-gray-700 mb-2">
                        Selecione os tipos de mídia:
                    </div>
                    {TIPOS_VALIDOS.map(tipo => (
                        <label key={tipo} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedTipos.includes(tipo)}
                                onChange={() => handleToggle(tipo)}
                                className="w-4 h-4 text-emidias-primary rounded focus:ring-emidias-primary"
                            />
                            <span className="text-sm">{tipo}</span>
                        </label>
                    ))}
                    <button
                        onClick={handleSave}
                        className="w-full mt-3 px-3 py-2 bg-emidias-primary text-white rounded-lg text-sm font-medium hover:bg-emidias-primary/90"
                    >
                        Confirmar ({selectedTipos.length})
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MEDIDAS EDITOR - Largura x Altura + Unidade
// ============================================================================

interface MedidasEditorProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

export function MedidasEditor({ value, onChange, onClose }: MedidasEditorProps) {
    // Parse existing value "9 x 3 M" or "9x3"
    const parseValue = (val: string) => {
        if (!val) return { largura: '', altura: '', unidade: 'M' };

        const match = val.match(/([\d.]+)\s*[xX×]\s*([\d.]+)\s*(M|PX)?/);
        if (match) {
            return {
                largura: match[1],
                altura: match[2],
                unidade: match[3] || 'M'
            };
        }
        return { largura: '', altura: '', unidade: 'M' };
    };

    const parsed = parseValue(value);
    const [largura, setLargura] = useState(parsed.largura);
    const [altura, setAltura] = useState(parsed.altura);
    const [unidade, setUnidade] = useState<'M' | 'PX'>(parsed.unidade as 'M' | 'PX');
    const ref = useRef<HTMLDivElement>(null);

    const handleSave = () => {
        if (largura && altura) {
            onChange(`${largura} x ${altura} ${unidade}`);
        }
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                handleSave();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [largura, altura, unidade]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20" onClick={handleSave}>
            <div
                ref={ref}
                className="w-72 bg-white border-2 border-emidias-primary rounded-lg shadow-2xl p-3"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="space-y-3">
                    <div className="font-semibold text-sm text-gray-700">Medidas:</div>

                    <div className="flex gap-2 items-center">
                        <input
                            type="number"
                            value={largura}
                            onChange={(e) => setLargura(e.target.value)}
                            placeholder="Largura"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emidias-primary"
                            autoFocus
                        />
                        <span className="text-gray-400">×</span>
                        <input
                            type="number"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            placeholder="Altura"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emidias-primary"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setUnidade('M')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${unidade === 'M'
                                ? 'bg-emidias-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Metros (M)
                        </button>
                        <button
                            onClick={() => setUnidade('PX')}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${unidade === 'PX'
                                ? 'bg-emidias-primary text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            Pixels (PX)
                        </button>
                    </div>

                    <button
                        onClick={handleSave}
                        className="w-full px-3 py-2 bg-emidias-primary text-white rounded-lg text-sm font-medium hover:bg-emidias-primary/90"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// PERÍODO EDITOR - Select Bissemanal/Mensal
// ============================================================================

interface PeriodoEditorProps {
    value: string;
    onChange: (value: string) => void;
    onClose: () => void;
}

export function PeriodoEditor({ value, onChange, onClose }: PeriodoEditorProps) {
    const [selected, setSelected] = useState(value || 'Bissemanal');
    const ref = useRef<HTMLDivElement>(null);

    const handleSelect = (periodo: string) => {
        setSelected(periodo);
        onChange(periodo);
        onClose();
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/20" onClick={onClose}>
            <div
                ref={ref}
                className="w-48 bg-white border-2 border-emidias-primary rounded-lg shadow-2xl p-2"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={() => handleSelect('Bissemanal')}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${selected === 'Bissemanal'
                            ? 'bg-emidias-primary text-white'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    Bissemanal
                </button>
                <button
                    onClick={() => handleSelect('Mensal')}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium text-left transition-colors ${selected === 'Mensal'
                            ? 'bg-emidias-primary text-white'
                            : 'hover:bg-gray-100'
                        }`}
                >
                    Mensal
                </button>
            </div>
        </div>
    );
}

// ============================================================================
// COORDINATE EDITOR - Input with validation
// ============================================================================

interface CoordinateEditorProps {
    value: any;
    onChange: (value: any) => void;
    onClose: () => void;
    type: 'latitude' | 'longitude';
}

export function CoordinateEditor({ value, onChange, onClose, type }: CoordinateEditorProps) {
    const [inputValue, setInputValue] = useState(String(value || ''));
    const [error, setError] = useState('');
    const ref = useRef<HTMLInputElement>(null);

    const handleBlur = () => {
        // Normalize: accept -, comma, dot
        let normalized = inputValue.trim();

        // Replace comma with dot
        normalized = normalized.replace(/,/g, '.');

        // Remove thousand separators (dots followed by 3 digits)
        if (normalized.match(/\.\d{3}($|\.)/)) {
            normalized = normalized.replace(/\./g, '');
            // Add back decimal point if needed
            const parts = normalized.match(/^(-?\d+)(\d{6,})$/);
            if (parts) {
                normalized = `${parts[1]}.${parts[2]}`;
            }
        }

        const num = parseFloat(normalized);

        if (isNaN(num)) {
            setError('Coordenada inválida');
            return;
        }

        if (num < -180 || num > 180) {
            setError('Fora do range (-180 a 180)');
            return;
        }

        onChange(num);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="w-full h-full">
            <input
                ref={ref}
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    setError('');
                }}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={`w-full h-full px-2 text-sm border-2 focus:outline-none ${error
                    ? 'border-red-500'
                    : 'border-emidias-primary'
                    }`}
                placeholder={type === 'latitude' ? 'Ex: -23.5615' : 'Ex: -46.6558'}
                autoFocus
            />
            {error && (
                <div className="absolute top-full left-0 mt-1 px-2 py-1 bg-red-500 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
                    {error}
                </div>
            )}
        </div>
    );
}
