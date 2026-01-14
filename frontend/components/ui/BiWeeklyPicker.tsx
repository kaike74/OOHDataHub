'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface BiWeeklyPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectPeriods: (startDate: string, endDate: string) => void;
    onClose: () => void;
}

// Base date for bi-weekly calendar: 29/12/2025 (BI 02 of 2026)
const BI_WEEKLY_BASE = new Date(2025, 11, 29); // December 29, 2025

// Helper function to format date for input (YYYY-MM-DD)
const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to format date for display (DD/MM/YY)
const formatDisplayDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

export default function BiWeeklyPicker({
    startDate,
    endDate,
    onSelectPeriods,
    onClose
}: BiWeeklyPickerProps) {
    const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set());
    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Generate bi-weekly periods for multiple years (infinite scroll)
    const biWeeklyPeriods = useMemo(() => {
        const allPeriods: any[] = [];
        const totalPeriods = 26 * 5; // 26 bi-weeks per year * 5 years = 130 periods

        for (let i = 0; i < totalPeriods; i++) {
            const start = new Date(BI_WEEKLY_BASE);
            start.setDate(start.getDate() + (i * 14));

            const end = new Date(start);
            end.setDate(end.getDate() + 13);

            const startStr = formatDateForInput(start);
            const endStr = formatDateForInput(end);

            allPeriods.push({
                number: (i + 1) * 2, // BI 02, BI 04, BI 06, etc.
                year: start.getFullYear(),
                startDate: start,
                endDate: end,
                startStr,
                endStr,
                id: `${startStr}_${endStr}`
            });
        }

        return allPeriods;
    }, []);

    const togglePeriod = (period: typeof biWeeklyPeriods[0], index: number, event: React.MouseEvent) => {
        const newSelected = new Set(selectedPeriods);

        // Handle Shift+Click for range selection
        if (event.shiftKey && lastClickedIndex !== null) {
            const start = Math.min(lastClickedIndex, index);
            const end = Math.max(lastClickedIndex, index);

            for (let i = start; i <= end; i++) {
                newSelected.add(biWeeklyPeriods[i].id);
            }
        } else {
            // Normal click - toggle
            if (newSelected.has(period.id)) {
                newSelected.delete(period.id);
            } else {
                newSelected.add(period.id);
            }
        }

        setSelectedPeriods(newSelected);
        setLastClickedIndex(index);

        // Auto-apply: update dates immediately
        if (newSelected.size > 0) {
            const selectedPeriodsArray = Array.from(newSelected)
                .map(id => biWeeklyPeriods.find(p => p.id === id)!)
                .filter(Boolean)
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

            const firstPeriod = selectedPeriodsArray[0];
            const lastPeriod = selectedPeriodsArray[selectedPeriodsArray.length - 1];

            onSelectPeriods(firstPeriod.startStr, lastPeriod.endStr);
        }
    };

    // Scroll to current year on mount
    useEffect(() => {
        if (scrollRef.current) {
            const currentYear = new Date().getFullYear();
            const currentYearIndex = biWeeklyPeriods.findIndex(p => p.year === currentYear);
            if (currentYearIndex !== -1) {
                const itemHeight = 28; // Approximate height of each item
                scrollRef.current.scrollTop = currentYearIndex * itemHeight - 50;
            }
        }
    }, [biWeeklyPeriods]);

    return (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[300px]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xs font-semibold text-gray-900">Bissemanas</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Checkbox List - Reduced height */}
            <div ref={scrollRef} className="max-h-[160px] overflow-y-auto p-2">
                {biWeeklyPeriods.map((period, index) => {
                    const isSelected = selectedPeriods.has(period.id);

                    return (
                        <label
                            key={period.id}
                            className={`
                                flex items-center gap-2 px-2 py-1 rounded cursor-pointer
                                transition-colors text-[10px]
                                ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                            `}
                            onClick={(e) => togglePeriod(period, index, e)}
                        >
                            <div className={`
                                w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0
                                ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}
                            `}>
                                {isSelected && <Check size={10} className="text-white" />}
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={isSelected}
                                onChange={() => { }}
                            />
                            <span className={`font-mono ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                                BI {String(period.number).padStart(2, '0')}-{String(period.year).slice(-2)}
                            </span>
                            <span className={isSelected ? 'text-gray-900' : 'text-gray-600'}>
                                ({formatDisplayDate(period.startDate)}-{formatDisplayDate(period.endDate)})
                            </span>
                        </label>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[9px] text-gray-500">
                    {selectedPeriods.size} selecionado{selectedPeriods.size !== 1 ? 's' : ''}
                </span>
                <span className="text-[8px] text-gray-400">
                    Shift+Click para selecionar múltiplos
                </span>
            </div>
        </div>
    );
}
