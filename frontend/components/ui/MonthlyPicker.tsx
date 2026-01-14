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
        const startingDayOfWeek = firstDay.getDay();

        const days: (Date | null)[] = [];

        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

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
            if (date < tomorrow) return;
            onSelectStart(dateStr);

            const suggestedEnd = new Date(date);
            suggestedEnd.setMonth(suggestedEnd.getMonth() + 1);
            if (suggestedEnd.getDate() !== date.getDate()) {
                suggestedEnd.setDate(0);
            }
            onSelectEnd(formatDateForInput(suggestedEnd));
        } else {
            const startDateObj = new Date(startDate);
            if (date <= startDateObj) return;

            const isValidEndDate =
                date.getDate() === startDayOfMonth ||
                (date.getDate() === new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() &&
                    startDayOfMonth! > date.getDate());

            if (!isValidEndDate) return;

            onSelectEnd(dateStr);
        }
    };

    const isDayDisabled = (date: Date) => {
        if (!startDate) {
            return date < tomorrow;
        } else {
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
        'jan', 'fev', 'mar', 'abr', 'mai', 'jun',
        'jul', 'ago', 'set', 'out', 'nov', 'dez'
    ];

    const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    return (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-xl z-50 w-[240px]">
            {/* Header */}
            <div className="flex items-center justify-between px-2 py-1.5 border-b border-gray-200">
                <button
                    onClick={handlePrevMonth}
                    className="p-0.5 hover:bg-gray-100 rounded"
                >
                    <ChevronLeft size={14} />
                </button>
                <h3 className="text-[11px] font-semibold text-gray-900">
                    {monthNames[currentMonth]}. {currentYear}
                </h3>
                <button
                    onClick={handleNextMonth}
                    className="p-0.5 hover:bg-gray-100 rounded"
                >
                    <ChevronRight size={14} />
                </button>
                <button
                    onClick={onClose}
                    className="p-0.5 text-gray-400 hover:text-gray-600"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Calendar Grid */}
            <div className="p-2">
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {weekDays.map((day, i) => (
                        <div key={i} className="text-center text-[9px] font-semibold text-gray-500 h-5 flex items-center justify-center">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-0.5">
                    {calendarDays.map((date, index) => {
                        if (!date) {
                            return <div key={`empty-${index}`} className="h-6" />;
                        }

                        const disabled = isDayDisabled(date);
                        const selected = isDaySelected(date);
                        const isStart = formatDateForInput(date) === startDate;
                        const isEnd = formatDateForInput(date) === endDate;
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                            <button
                                key={index}
                                onClick={() => !disabled && handleDayClick(date)}
                                disabled={disabled}
                                className={`
                                    h-6 flex items-center justify-center text-[10px] rounded
                                    transition-colors
                                    ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-900 cursor-pointer'}
                                    ${selected && isStart ? 'bg-blue-500 text-white font-semibold hover:bg-blue-600' : ''}
                                    ${selected && isEnd ? 'bg-green-500 text-white font-semibold hover:bg-green-600' : ''}
                                    ${!selected && !disabled ? 'hover:bg-gray-100' : ''}
                                    ${isToday && !selected ? 'border border-blue-400' : ''}
                                `}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Footer */}
            <div className="px-2 py-1.5 bg-gray-50 border-t border-gray-200 text-[9px] text-gray-600">
                {!startDate ? (
                    <p>Selecione a data de início</p>
                ) : (
                    <p>Selecione a data de fim (dia <strong>{startDayOfMonth}</strong>)</p>
                )}
            </div>
        </div>
    );
}
