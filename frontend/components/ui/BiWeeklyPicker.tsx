'use client';

import React, { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { getValidBiWeeklyStartDates, formatDateForInput } from '@/lib/periodUtils';

interface BiWeeklyPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectStart: (date: string) => void;
    onSelectEnd: (date: string) => void;
    onClose: () => void;
}

export default function BiWeeklyPicker({
    startDate,
    endDate,
    onSelectStart,
    onSelectEnd,
    onClose
}: BiWeeklyPickerProps) {
    const [year, setYear] = useState(new Date().getFullYear());

    // Generate bi-weekly periods for the selected year
    const biWeeklyPeriods = useMemo(() => {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);

        // Get all bi-weekly start dates for the year
        const startDates = getValidBiWeeklyStartDates(yearStart, 60); // Get more than needed

        // Filter to only include periods that start in this year
        return startDates
            .filter(date => date.getFullYear() === year)
            .map((start, index) => {
                const end = new Date(start);
                end.setDate(end.getDate() + 13);

                return {
                    number: (index + 1) * 2, // B02, B04, B06, etc.
                    startDate: start,
                    endDate: end,
                    startStr: formatDateForInput(start),
                    endStr: formatDateForInput(end)
                };
            });
    }, [year]);

    const handleStartClick = (dateStr: string, endStr: string) => {
        onSelectStart(dateStr);
        // Auto-select the corresponding end date
        onSelectEnd(endStr);
    };

    const handleEndClick = (dateStr: string) => {
        if (!startDate) return; // Can't select end without start
        onSelectEnd(dateStr);
    };

    const formatDisplayDate = (date: Date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}`;
    };

    return (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[400px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">Bissemanas {year}</h3>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setYear(year - 1)}
                            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => setYear(year + 1)}
                            className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50"
                        >
                            →
                        </button>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Table */}
            <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-800 text-white">
                        <tr>
                            <th className="px-3 py-2 text-center font-semibold">#</th>
                            <th className="px-3 py-2 text-center font-semibold">Início</th>
                            <th className="px-3 py-2 text-center font-semibold">Término</th>
                        </tr>
                    </thead>
                    <tbody>
                        {biWeeklyPeriods.map((period, index) => {
                            const isStartSelected = period.startStr === startDate;
                            const isEndSelected = period.endStr === endDate;
                            const isRowSelected = isStartSelected && isEndSelected;
                            const canSelectEnd = startDate !== null;

                            return (
                                <tr
                                    key={period.number}
                                    className={`
                                        border-b border-gray-200 transition-colors
                                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                                        ${isRowSelected ? 'bg-blue-100 hover:bg-blue-200' : 'hover:bg-gray-100'}
                                    `}
                                >
                                    <td className="px-3 py-2 text-center font-semibold text-gray-700">
                                        B{String(period.number).padStart(2, '0')}
                                    </td>
                                    <td
                                        className={`
                                            px-3 py-2 text-center cursor-pointer
                                            ${isStartSelected ? 'bg-blue-500 text-white font-semibold' : 'text-gray-900'}
                                            hover:bg-blue-400 hover:text-white
                                        `}
                                        onClick={() => handleStartClick(period.startStr, period.endStr)}
                                    >
                                        {formatDisplayDate(period.startDate)}
                                    </td>
                                    <td
                                        className={`
                                            px-3 py-2 text-center
                                            ${canSelectEnd ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                                            ${isEndSelected ? 'bg-green-500 text-white font-semibold' : 'text-gray-900'}
                                            ${canSelectEnd ? 'hover:bg-green-400 hover:text-white' : ''}
                                        `}
                                        onClick={() => canSelectEnd && handleEndClick(period.endStr)}
                                    >
                                        {formatDisplayDate(period.endDate)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer with instructions */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                <p>💡 Clique em <strong>Início</strong> para selecionar o período</p>
            </div>
        </div>
    );
}
