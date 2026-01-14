'use client';

import React, { useRef, useEffect } from 'react';
import BiWeeklyPicker from './BiWeeklyPicker';
import MonthlyPicker from './MonthlyPicker';

interface PeriodDatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    periodType: 'bissemanal' | 'mensal';
    startDate: string | null;
    endDate: string | null;
    onSelectStart: (date: string) => void;
    onSelectEnd: (date: string) => void;
    onSelectBoth?: (startDate: string, endDate: string) => void; // New callback for bi-weekly
}

export default function PeriodDatePicker({
    isOpen,
    onClose,
    periodType,
    startDate,
    endDate,
    onSelectStart,
    onSelectEnd,
    onSelectBoth
}: PeriodDatePickerProps) {
    const pickerRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div ref={pickerRef}>
            {periodType === 'bissemanal' ? (
                <BiWeeklyPicker
                    startDate={startDate}
                    endDate={endDate}
                    onSelectPeriods={(start, end) => {
                        // Use onSelectBoth if available to avoid double update
                        if (onSelectBoth) {
                            onSelectBoth(start, end);
                        } else {
                            onSelectStart(start);
                            onSelectEnd(end);
                        }
                    }}
                    onClose={onClose}
                />
            ) : (
                <MonthlyPicker
                    startDate={startDate}
                    endDate={endDate}
                    onSelectStart={onSelectStart}
                    onSelectEnd={onSelectEnd}
                    onClose={onClose}
                />
            )}
        </div>
    );
}
