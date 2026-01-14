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
    onSelectBoth?: (startDate: string, endDate: string) => void;
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
    const saveOnCloseRef = useRef(false);

    // Handle click outside to close AND save
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                saveOnCloseRef.current = true; // Mark to save
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
                        if (onSelectBoth) {
                            onSelectBoth(start, end);
                        } else {
                            onSelectStart(start);
                            onSelectEnd(end);
                        }
                    }}
                    onClose={(shouldSave) => {
                        // If clicking outside or applying, save
                        if (shouldSave || saveOnCloseRef.current) {
                            // Trigger save handled by BiWeeklyPicker
                        }
                        saveOnCloseRef.current = false;
                        onClose();
                    }}
                    saveOnClickOutside={saveOnCloseRef.current}
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
