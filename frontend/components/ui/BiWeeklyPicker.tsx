'use client';

import React, { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { getValidBiWeeklyStartDates, formatDateForInput } from '@/lib/periodUtils';

interface BiWeeklyPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectPeriods: (startDate: string, endDate: string) => void;
    onClose: () => void;
}

export default function BiWeeklyPicker({
    startDate,
    endDate,
    onSelectPeriods,
    onClose
}: BiWeeklyPickerProps) {
    const [year, setYear] = useState(new Date().getFullYear());
    const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set());

    // Generate bi-weekly periods for the selected year
    const biWeeklyPeriods = useMemo(() => {
        const yearStart = new Date(year, 0, 1);
        const startDates = getValidBiWeeklyStartDates(yearStart, 60);

        return startDates
            .filter(date => date.getFullYear() === year)
            .map((start, index) => {
                const end = new Date(start);
                end.setDate(end.getDate() + 13);

                const startStr = formatDateForInput(start);
                const endStr = formatDateForInput(end);

                return {
                    number: (index + 1) * 2,
                    startDate: start,
                    endDate: end,
                    startStr,
                    endStr,
                    id: `${startStr}_${endStr}`
                };
            });
    }, [year]);

    const formatDisplayDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    };

    const togglePeriod = (period: typeof biWeeklyPeriods[0]) => {
        const newSelected = new Set(selectedPeriods);
        if (newSelected.has(period.id)) {
            newSelected.delete(period.id);
        } else {
            newSelected.add(period.id);
        }
        setSelectedPeriods(newSelected);
    };

    const handleConfirm = () => {
        if (selectedPeriods.size === 0) {
            onClose();
            return;
        }

        // Find first and last selected periods
        const selectedPeriodsArray = Array.from(selectedPeriods)
            .map(id => biWeeklyPeriods.find(p => p.id === id)!)
            .filter(Boolean)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

        const firstPeriod = selectedPeriodsArray[0];
        const lastPeriod = selectedPeriodsArray[selectedPeriodsArray.length - 1];

        onSelectPeriods(firstPeriod.startStr, lastPeriod.endStr);
        onClose();
    };

    return (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-gray-900">Bissemanas {year}</h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setYear(year - 1)}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => setYear(year + 1)}
                            className="px-1.5 py-0.5 text-[10px] bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                            →
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Checkbox List */}
            <div className="max-h-[320px] overflow-y-auto p-2">
                {biWeeklyPeriods.map((period) => {
                    const isSelected = selectedPeriods.has(period.id);

                    return (
                        <label
                            key={period.id}
                            className={`
                                flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer
                                transition-colors text-[11px]
                                ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                            `}
                        >
                            <div className={`
                                w-4 h-4 rounded border flex items-center justify-center flex-shrink-0
                                ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                            `}>
                                {isSelected && <Check size={12} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => togglePeriod(period)}
                            />
                            <span className={`font-mono ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                                BI {String(period.number).padStart(2, '0')}
                            </span>
                            <span className={isSelected ? 'text-gray-900' : 'text-gray-600'}>
                                ({formatDisplayDate(period.startDate)}-{formatDisplayDate(period.endDate)})
                            </span>
                        </label>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[10px] text-gray-500">
                    {selectedPeriods.size} selecionado{selectedPeriods.size !== 1 ? 's' : ''}
                </span>
                <button
                    onClick={handleConfirm}
                    className="px-3 py-1 text-[11px] bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
                    disabled={selectedPeriods.size === 0}
                >
                    Confirmar
                </button>
            </div>
        </div>
    );
}
