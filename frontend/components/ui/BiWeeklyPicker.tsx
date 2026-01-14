'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';

interface BiWeeklyPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectPeriods: (startDate: string, endDate: string, selectedPeriods: string[]) => void;
    onClose: (shouldSave: boolean) => void;
    saveOnClickOutside?: boolean;
    initialSelectedPeriods?: string[];
}


// Base date for bi-weekly calendar: 29/12/2025 (BI 02 of 2026)
// Adjust check to ensure we use local time or specific date logic if needed
const BI_WEEKLY_BASE = new Date(2025, 11, 29);

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatDisplayDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
};

const generateBiWeeklyPeriods = (startYear: number, endYear: number) => {
    const allPeriods: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let year = startYear; year <= endYear; year++) {
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
        const maxBiWeeks = isLeapYear ? 27 : 26;

        for (let biWeekIndex = 0; biWeekIndex < maxBiWeeks; biWeekIndex++) {
            const yearOffset = year - 2026;
            const totalBiWeeksFromBase = (yearOffset * 26) + biWeekIndex;

            const start = new Date(BI_WEEKLY_BASE);
            start.setDate(start.getDate() + (totalBiWeeksFromBase * 14));

            const end = new Date(start);
            end.setDate(end.getDate() + 13);

            const biWeekYear = end.getFullYear();

            if (biWeekYear === year && end >= today) {
                const startStr = formatDateForInput(start);
                const endStr = formatDateForInput(end);

                allPeriods.push({
                    number: (biWeekIndex + 1) * 2,
                    year: biWeekYear,
                    startDate: start,
                    endDate: end,
                    startStr,
                    endStr,
                    id: `${startStr}_${endStr}`
                });
            }
        }
    }

    return allPeriods;
};

export default function BiWeeklyPicker({
    startDate,
    endDate,
    onSelectPeriods,
    onClose,
    saveOnClickOutside,
    initialSelectedPeriods
}: BiWeeklyPickerProps) {
    const currentYear = new Date().getFullYear();
    const biWeeklyPeriods = generateBiWeeklyPeriods(currentYear, currentYear + 4);

    const getInitialSelection = (): Set<string> => {
        if (initialSelectedPeriods && initialSelectedPeriods.length > 0) {
            return new Set(initialSelectedPeriods);
        }

        if (!startDate) return new Set();

        // Only select the period that contains the start date
        const selected = new Set<string>();
        const start = new Date(startDate);

        biWeeklyPeriods.forEach(period => {
            const periodStart = new Date(period.startStr);
            const periodEnd = new Date(period.endStr);

            // Check if start date falls within this period
            if (start >= periodStart && start <= periodEnd) {
                selected.add(period.id);
            }
        });

        return selected;
    };

    const initialSelection = getInitialSelection();
    const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(initialSelection);

    // Initialize lastClickedIndex with the first selected period
    const getInitialLastClickedIndex = (): number | null => {
        if (initialSelection.size === 0) return null;

        // Find the index of the first selected period
        const firstSelectedId = Array.from(initialSelection)[0];
        const index = biWeeklyPeriods.findIndex(p => p.id === firstSelectedId);
        return index !== -1 ? index : null;
    };

    const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(getInitialLastClickedIndex());
    const scrollRef = useRef<HTMLDivElement>(null);

    const handlePeriodClick = (period: typeof biWeeklyPeriods[0], index: number, event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();

        setSelectedPeriods(prevSelected => {
            const newSelected = new Set(prevSelected);

            if (event.shiftKey && lastClickedIndex !== null) {
                // Shift-select: ALWAYS SELECT the range between last clicked and current
                const start = Math.min(lastClickedIndex, index);
                const end = Math.max(lastClickedIndex, index);

                // Select all periods in the range
                for (let i = start; i <= end; i++) {
                    newSelected.add(biWeeklyPeriods[i].id);
                }
            } else {
                // Regular click: Toggle single selection
                if (newSelected.has(period.id)) {
                    newSelected.delete(period.id);
                } else {
                    newSelected.add(period.id);
                }
            }

            return newSelected;
        });

        // Always update last clicked index
        setLastClickedIndex(index);
    };

    const handleApply = () => {
        if (selectedPeriods.size > 0) {
            const selectedPeriodsArray = Array.from(selectedPeriods)
                .map(id => biWeeklyPeriods.find(p => p.id === id)!)
                .filter(Boolean)
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

            const firstPeriod = selectedPeriodsArray[0];
            const lastPeriod = selectedPeriodsArray[selectedPeriodsArray.length - 1];

            onSelectPeriods(firstPeriod.startStr, lastPeriod.endStr, Array.from(selectedPeriods));
        }
        onClose(true); // Save
    };

    const handleCancel = () => {
        onClose(false); // Don't save
    };

    // Handle save on click outside
    useEffect(() => {
        if (saveOnClickOutside && selectedPeriods.size > 0) {
            const selectedPeriodsArray = Array.from(selectedPeriods)
                .map(id => biWeeklyPeriods.find(p => p.id === id)!)
                .filter(Boolean)
                .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

            if (selectedPeriodsArray.length > 0) {
                const firstPeriod = selectedPeriodsArray[0];
                const lastPeriod = selectedPeriodsArray[selectedPeriodsArray.length - 1];
                onSelectPeriods(firstPeriod.startStr, lastPeriod.endStr, Array.from(selectedPeriods));
            }
        }
    }, [saveOnClickOutside, selectedPeriods, biWeeklyPeriods, onSelectPeriods]);

    useEffect(() => {
        if (scrollRef.current && biWeeklyPeriods.length > 0) {
            const currentYearIndex = biWeeklyPeriods.findIndex(p => p.year === currentYear);
            if (currentYearIndex !== -1) {
                const itemHeight = 24;
                scrollRef.current.scrollTop = currentYearIndex * itemHeight - 50;
            }
        }
    }, [biWeeklyPeriods, currentYear]);

    // State for portal positioning
    const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    // Calculate position when component mounts
    useEffect(() => {
        // Find the trigger element (the button that opened this picker)
        // We'll use the parent element's position
        const updatePosition = () => {
            const parentElement = document.querySelector('[data-period-picker-trigger]');
            if (parentElement) {
                const rect = parentElement.getBoundingClientRect();
                setPortalPosition({
                    top: rect.bottom + window.scrollY + 4, // 4px gap (mt-1)
                    left: rect.left + window.scrollX
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);

        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, []);

    if (!portalPosition) return null;

    const modalContent = (
        <div
            className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-[99999] w-[240px]"
            style={{
                top: `${portalPosition.top}px`,
                left: `${portalPosition.left}px`
            }}
        >
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-[11px] font-semibold text-gray-900">Bissemanas</h3>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                    title="Cancelar (não salvar)"
                >
                    <X size={14} />
                </button>
            </div>

            <div ref={scrollRef} className="max-h-[160px] overflow-y-auto p-2">
                {biWeeklyPeriods.map((period, index) => {
                    const isSelected = selectedPeriods.has(period.id);

                    return (
                        <div
                            key={period.id}
                            className={`
                                flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer
                                transition-colors text-[10px] select-none
                                ${isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}
                            `}
                            onClick={(e) => handlePeriodClick(period, index, e)}
                        >
                            <div className={`
                                w-3 h-3 rounded border flex items-center justify-center flex-shrink-0
                                transition-all
                                ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}
                            `}>
                                {isSelected && (
                                    <Check
                                        size={8}
                                        className="text-white"
                                        strokeWidth={3}
                                    />
                                )}
                            </div>
                            <span className={`font-mono text-[9px] ${isSelected ? 'font-semibold text-blue-700' : 'text-gray-600'}`}>
                                BI {String(period.number).padStart(2, '0')}-{String(period.year).slice(-2)}
                            </span>
                            <span className={`text-[9px] ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                                ({formatDisplayDate(period.startDate)}-{formatDisplayDate(period.endDate)})
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[9px] text-gray-500">
                    {selectedPeriods.size} selecionado{selectedPeriods.size !== 1 ? 's' : ''}
                </span>
                <button
                    onClick={handleApply}
                    className="px-2 py-0.5 text-[10px] bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
                    type="button"
                >
                    Aplicar
                </button>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
