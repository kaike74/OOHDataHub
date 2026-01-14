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
    onSelectStart?: (date: string) => void;
    onSelectEnd?: (date: string) => void;
    onSelectBoth?: (startDate: string, endDate: string) => void;
    onSelectionChange?: (startDate: string, endDate: string, selectedPeriods: string[]) => void;
    selectedPeriods?: string[];
}

export default function PeriodDatePicker({
    isOpen,
    onClose,
    periodType,
    startDate,
    endDate,
    onSelectStart = () => { },
    onSelectEnd = () => { },
    onSelectBoth,
    onSelectionChange,
    selectedPeriods
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

    const handleSelection = (start: string, end: string, periods: string[]) => {
        if (onSelectionChange) {
            onSelectionChange(start, end, periods);
        } else if (onSelectBoth) {
            onSelectBoth(start, end);
        } else {
            onSelectStart(start);
            onSelectEnd(end);
        }
    };

    return (
        <div ref={pickerRef} className="relative z-[99999]">
            {periodType === 'bissemanal' ? (
                <BiWeeklyPicker
                    startDate={startDate}
                    endDate={endDate}
                    onSelectPeriods={(start, end, periods) => {
                        handleSelection(start, end, periods);
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
                    initialSelectedPeriods={selectedPeriods}
                />
            ) : (
                <MonthlyPicker
                    startDate={startDate}
                    endDate={endDate}
                    onSelectPeriods={(start, end, periods) => {
                        handleSelection(start, end, periods);
                    }}
                    onClose={onClose}
                    saveOnClickOutside={saveOnCloseRef.current}
                />
            )}
        </div>
    );
}
