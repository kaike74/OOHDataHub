'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDateForInput, getTomorrow } from '@/lib/periodUtils';

interface MonthlyPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectStart: (date: string) => void;
    onSelectEnd: (date: string) => void;
    onClose: () => void;
}

export default function MonthlyPicker({
    startDate,
    endDate,
    onSelectStart,
    onSelectEnd,
    onClose
}: MonthlyPickerProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const tomorrow = getTomorrow();
    const startDayOfMonth = startDate ? parseInt(startDate.split('-')[2]) : null;

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(new Date(currentYear, currentMonth, day));
        }

        return days;
    }, [currentMonth, currentYear]);

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleDayClick = (date: Date) => {
        const dateStr = formatDateForInput(date);

        if (!startDate) {
            // Selecting start date
            if (date < tomorrow) return; // Can't select past dates
            onSelectStart(dateStr);

            // Auto-suggest end date 1 month ahead
            const suggestedEnd = new Date(date);
            suggestedEnd.setMonth(suggestedEnd.getMonth() + 1);
            if (suggestedEnd.getDate() !== date.getDate()) {
                suggestedEnd.setDate(0); // Last day of previous month
            }
            onSelectEnd(formatDateForInput(suggestedEnd));
        } else {
            // Selecting end date
            const startDateObj = new Date(startDate);
            if (date <= startDateObj) return; // End must be after start

            // Check if it's the same day of month or last day of month
            const isValidEndDate =
                date.getDate() === startDayOfMonth ||
                (date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() &&
                    startDayOfMonth! > date.getDate());

            if (!isValidEndDate) return;

            onSelectEnd(dateStr);
        }
    };

    const isDayDisabled = (date: Date) => {
        const dateStr = formatDateForInput(date);

        if (!startDate) {
            // When selecting start date, disable past dates
            return date < tomorrow;
        } else {
            // When selecting end date, only allow same day of month
            const startDateObj = new Date(startDate);
            if (date <= startDateObj) return true;

            const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
            const isValidDay =
                date.getDate() === startDayOfMonth ||
                (date.getDate() === lastDayOfMonth && startDayOfMonth! > lastDayOfMonth);

            return !isValidDay;
        }
    };

    const isDaySelected = (date: Date) => {
        const dateStr = formatDateForInput(date);
        return dateStr === startDate || dateStr === endDate;
    };

    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
                <button
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-gray-200 rounded"
                >
                    <ChevronLeft size={16} />
                </button>
                <h3 className="text-sm font-semibold text-gray-900">
                    {monthNames[currentMonth]} {currentYear}
                </h3>
                <button
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-200 rounded"
                >
                    <ChevronRight size={16} />
                </button>
                <button
                    onClick={onClose}
                    className="p-1 text-gray-400 hover:text-gray-600"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-3">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const disabled = isDayDisabled(date);
                        const selected = isDaySelected(date);
                        const isStart = formatDateForInput(date) === startDate;
                        const isEnd = formatDateForInput(date) === endDate;

                        return (
                            <button
                                key={index}
                                onClick={() => !disabled && handleDayClick(date)}
                                disabled={disabled}
                                className={`
                                    aspect-square flex items-center justify-center text-xs rounded
                                    transition-colors
                                    ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-900 cursor-pointer hover:bg-gray-100'}
                                    ${selected && isStart ? 'bg-blue-500 text-white font-semibold hover:bg-blue-600' : ''}
                                    ${selected && isEnd ? 'bg-green-500 text-white font-semibold hover:bg-green-600' : ''}
                                    ${!selected && !disabled ? 'hover:bg-gray-100' : ''}
                                `}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer with instructions */}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
                {!startDate ? (
                    <p>💡 Selecione a <strong>data de início</strong></p>
                ) : (
                    <p>💡 Selecione a <strong>data de fim</strong> (mesmo dia do mês: <strong>{startDayOfMonth}</strong>)</p>
                )}
            </div>
        </div>
    );
}
