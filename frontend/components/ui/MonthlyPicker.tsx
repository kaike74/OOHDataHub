'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check } from 'lucide-react';

interface MonthlyPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectPeriods: (startDate: string, endDate: string, selectedPeriods: string[]) => void;
    onClose: () => void;
    saveOnClickOutside?: boolean;
}

const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function MonthlyPicker({
    startDate,
    endDate,
    onSelectPeriods,
    onClose,
    saveOnClickOutside
}: MonthlyPickerProps) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Extract day from startDate or default to tomorrow's day
    const getInitialDay = () => {
        if (startDate) {
            return parseInt(startDate.split('-')[2]);
        }
        return tomorrow.getDate();
    };

    const [selectedDay, setSelectedDay] = useState(getInitialDay());
    const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initialize selected months from startDate and endDate
    useEffect(() => {
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const selected = new Set<string>();

            let current = new Date(start);
            while (current <= end) {
                const key = `${current.getFullYear()}-${current.getMonth()}`;
                selected.add(key);
                current.setMonth(current.getMonth() + 1);
            }

            setSelectedMonths(selected);
        }
    }, [startDate, endDate]);

    // Handle save on click outside
    useEffect(() => {
        if (saveOnClickOutside && selectedMonths.size > 0) {
            // Convert selected months to sorted array
            const monthsArray = Array.from(selectedMonths)
                .map(key => {
                    const [year, month] = key.split('-').map(Number);
                    return { year, month };
                })
                .sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return a.month - b.month;
                });

            if (monthsArray.length > 0) {
                const firstMonth = monthsArray[0];
                const lastMonth = monthsArray[monthsArray.length - 1];

                const startDateObj = new Date(firstMonth.year, firstMonth.month, selectedDay);
                const endDateObj = new Date(lastMonth.year, lastMonth.month + 1, selectedDay);
                endDateObj.setDate(endDateObj.getDate() - 1);

                onSelectPeriods(formatDateForInput(startDateObj), formatDateForInput(endDateObj), Array.from(selectedMonths));
            }
        }
    }, [saveOnClickOutside, selectedMonths, selectedDay, onSelectPeriods]);

    const handleDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedDay(parseInt(e.target.value));
    };

    const handleMonthToggle = (year: number, month: number) => {
        const key = `${year}-${month}`;
        setSelectedMonths(prev => {
            const newSet = new Set(prev);
            if (newSet.has(key)) {
                newSet.delete(key);
            } else {
                newSet.add(key);
            }
            return newSet;
        });
    };

    const handleApply = () => {
        if (selectedMonths.size === 0) {
            onClose();
            return;
        }

        // Convert selected months to sorted array
        const monthsArray = Array.from(selectedMonths)
            .map(key => {
                const [year, month] = key.split('-').map(Number);
                return { year, month };
            })
            .sort((a, b) => {
                if (a.year !== b.year) return a.year - b.year;
                return a.month - b.month;
            });

        // Calculate start and end dates
        const firstMonth = monthsArray[0];
        const lastMonth = monthsArray[monthsArray.length - 1];

        const startDate = new Date(firstMonth.year, firstMonth.month, selectedDay);
        const endDate = new Date(lastMonth.year, lastMonth.month + 1, selectedDay);
        endDate.setDate(endDate.getDate() - 1); // Last day of period

        onSelectPeriods(formatDateForInput(startDate), formatDateForInput(endDate), Array.from(selectedMonths));
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    // Generate years (current + next 2)
    const years = [currentYear, currentYear + 1, currentYear + 2];

    // Generate day options (1-31)
    const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[280px]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-200 bg-gray-50">
                <h3 className="text-[11px] font-semibold text-gray-900">Período Mensal</h3>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                    title="Cancelar"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Day Selector */}
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
                <label className="text-[10px] text-gray-600 block mb-1">
                    Dia do mês:
                </label>
                <select
                    value={selectedDay}
                    onChange={handleDayChange}
                    className="w-full text-[11px] border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-blue-500"
                >
                    {dayOptions.map(day => (
                        <option key={day} value={day}>
                            Dia {day}
                        </option>
                    ))}
                </select>
            </div>

            {/* Month Selection */}
            <div ref={scrollRef} className="max-h-[200px] overflow-y-auto p-3">
                {years.map(year => (
                    <div key={year} className="mb-3">
                        <h4 className="text-[10px] font-semibold text-gray-700 mb-2">{year}</h4>
                        <div className="grid grid-cols-4 gap-1.5">
                            {monthNames.map((monthName, monthIndex) => {
                                const key = `${year}-${monthIndex}`;
                                const isSelected = selectedMonths.has(key);

                                // Check if month is in the past
                                const monthDate = new Date(year, monthIndex, selectedDay);
                                const isPast = monthDate < tomorrow;

                                return (
                                    <button
                                        key={key}
                                        onClick={() => !isPast && handleMonthToggle(year, monthIndex)}
                                        disabled={isPast}
                                        className={`
                                            px-2 py-1.5 text-[10px] rounded border transition-all
                                            ${isPast ? 'bg-gray-100 text-gray-300 cursor-not-allowed border-gray-200' : ''}
                                            ${!isPast && isSelected ? 'bg-blue-500 text-white border-blue-500 font-semibold' : ''}
                                            ${!isPast && !isSelected ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50' : ''}
                                        `}
                                        type="button"
                                    >
                                        {isSelected && !isPast && (
                                            <Check size={10} className="inline mr-0.5" strokeWidth={3} />
                                        )}
                                        {monthName}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Info */}
            <div className="px-3 py-1.5 bg-blue-50 border-t border-blue-200 text-[9px] text-blue-700">
                ℹ️ Todos os períodos começam no dia {selectedDay} de cada mês
            </div>

            {/* Footer */}
            <div className="px-3 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <span className="text-[9px] text-gray-500">
                    {selectedMonths.size} {selectedMonths.size === 1 ? 'mês' : 'meses'}
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
}
