'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Check, Plus, Edit2, Trash2 } from 'lucide-react';
import {
    addMonths,
    formatMonthlyPeriodDisplay,
    generateMonthlyPeriodId,
    formatDateForInput,
    formatDisplayDate
} from '@/lib/periodUtils';

interface MonthlyPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectPeriods: (startDate: string, endDate: string, selectedPeriods: string[]) => void;
    onClose: (shouldSave: boolean) => void;
    saveOnClickOutside?: boolean;
    initialSelectedPeriods?: string[];
}

interface MonthlyPeriod {
    id: string;
    startDate: Date;
    endDate: Date;
    active: boolean;
}

export default function MonthlyPicker({
    startDate,
    endDate,
    onSelectPeriods,
    onClose,
    saveOnClickOutside,
    initialSelectedPeriods
}: MonthlyPickerProps) {
    // Parse initial periods from selected_periods array or start/end dates
    const getInitialPeriods = (): MonthlyPeriod[] => {
        if (initialSelectedPeriods && initialSelectedPeriods.length > 0) {
            // Parse from selected_periods format: "2026-01-17_2026-02-17"
            return initialSelectedPeriods.map(periodStr => {
                const [start, end] = periodStr.split('_');
                return {
                    id: periodStr,
                    startDate: new Date(start),
                    endDate: new Date(end),
                    active: true
                };
            });
        }

        if (startDate && endDate) {
            // Legacy format: single period from start/end dates
            const period = {
                id: generateMonthlyPeriodId(new Date(startDate), new Date(endDate)),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                active: true
            };
            return [period];
        }

        return [];
    };

    const [periods, setPeriods] = useState<MonthlyPeriod[]>(getInitialPeriods());
    const [isAddingPeriod, setIsAddingPeriod] = useState(false);
    const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null);

    // Form state
    const [formStartDay, setFormStartDay] = useState('01');
    const [formStartMonth, setFormStartMonth] = useState('01');
    const [formStartYear, setFormStartYear] = useState('2026');
    const [formDuration, setFormDuration] = useState('1');
    const [formEndDate, setFormEndDate] = useState<Date | null>(null);
    const [overlapError, setOverlapError] = useState<string | null>(null);

    // Portal positioning
    const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null);

    // Helper: Get max days in a month
    const getMaxDaysInMonth = (month: number, year: number): number => {
        return new Date(year, month, 0).getDate();
    };

    // Calculate max day for current selection
    const maxDay = getMaxDaysInMonth(parseInt(formStartMonth), parseInt(formStartYear));
    useEffect(() => {
        const updatePosition = () => {
            const parentElement = document.querySelector('[data-period-picker-trigger]');
            if (parentElement) {
                const rect = parentElement.getBoundingClientRect();
                setPortalPosition({
                    top: rect.bottom + window.scrollY + 4,
                    left: rect.left + window.scrollX
                });
            }
        };

        updatePosition();
        window.addEventListener('resize', updatePosition);

        return () => {
            window.removeEventListener('resize', updatePosition);
        };
    }, []);

    // Auto-adjust day if it exceeds max days in selected month
    useEffect(() => {
        const currentDay = parseInt(formStartDay);
        if (currentDay > maxDay) {
            setFormStartDay(String(maxDay).padStart(2, '0'));
        }
    }, [formStartMonth, formStartYear, maxDay]);

    // Auto-calculate end date when form inputs change
    useEffect(() => {
        if (formStartDay && formStartMonth && formStartYear && formDuration) {
            const start = new Date(
                parseInt(formStartYear),
                parseInt(formStartMonth) - 1,
                parseInt(formStartDay)
            );

            if (!isNaN(start.getTime())) {
                const months = parseInt(formDuration);
                const end = addMonths(start, months);
                end.setDate(end.getDate() - 1); // End date is last day of period
                setFormEndDate(end);
            }
        }
    }, [formStartDay, formStartMonth, formStartYear, formDuration]);

    // Check overlap in real-time
    useEffect(() => {
        if (!formEndDate) {
            setOverlapError(null);
            return;
        }

        const start = new Date(
            parseInt(formStartYear),
            parseInt(formStartMonth) - 1,
            parseInt(formStartDay)
        );

        if (checkOverlap(start, formEndDate, editingPeriodId || undefined)) {
            setOverlapError('Data indisponível');
        } else {
            setOverlapError(null);
        }
    }, [formStartDay, formStartMonth, formStartYear, formEndDate, editingPeriodId]);



    // Check if a new period overlaps with existing periods
    const checkOverlap = (newStart: Date, newEnd: Date, excludeId?: string): boolean => {
        return periods.some(period => {
            if (excludeId && period.id === excludeId) return false;

            const periodStart = period.startDate.getTime();
            const periodEnd = period.endDate.getTime();
            const checkStart = newStart.getTime();
            const checkEnd = newEnd.getTime();

            // Check if ranges overlap
            return (checkStart <= periodEnd && checkEnd >= periodStart);
        });
    };

    // Auto-save helper
    const saveWithPeriods = (currentPeriods: MonthlyPeriod[]) => {
        const activePeriods = currentPeriods.filter(p => p.active);

        if (activePeriods.length > 0) {
            const sortedPeriods = [...activePeriods].sort((a, b) =>
                a.startDate.getTime() - b.startDate.getTime()
            );

            const firstPeriod = sortedPeriods[0];
            const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

            const selectedPeriodIds = sortedPeriods.map(p => p.id);

            onSelectPeriods(
                formatDateForInput(firstPeriod.startDate),
                formatDateForInput(lastPeriod.endDate),
                selectedPeriodIds
            );
        } else {
            // Clear selection
            onSelectPeriods('', '', []);
        }
    };

    const handleCancel = () => {
        onClose(false);
    };

    const handleAddPeriod = () => {
        if (!formEndDate) return;

        const start = new Date(
            parseInt(formStartYear),
            parseInt(formStartMonth) - 1,
            parseInt(formStartDay)
        );

        // Check for overlap (redundant but safe)
        if (checkOverlap(start, formEndDate, editingPeriodId || undefined)) {
            // Already handled by UI state, but prevent submission
            return;
        }

        const newPeriod: MonthlyPeriod = {
            id: generateMonthlyPeriodId(start, formEndDate),
            startDate: start,
            endDate: formEndDate,
            active: true
        };

        if (editingPeriodId) {
            // Update existing period
            const updated = periods.map(p =>
                p.id === editingPeriodId ? newPeriod : p
            );
            setPeriods(updated);
            setEditingPeriodId(null);
            saveWithPeriods(updated);
        } else {
            // Add new period
            const updated = [...periods, newPeriod];
            setPeriods(updated);
            saveWithPeriods(updated);
        }

        // Reset form
        setIsAddingPeriod(false);
        resetForm();
    };

    const handleEditPeriod = (period: MonthlyPeriod) => {
        setFormStartDay(String(period.startDate.getDate()).padStart(2, '0'));
        setFormStartMonth(String(period.startDate.getMonth() + 1).padStart(2, '0'));
        setFormStartYear(String(period.startDate.getFullYear()));
        setFormEndDate(period.endDate);

        // Calculate duration in months
        const months = Math.round((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
        setFormDuration(String(Math.min(months, 6))); // Cap at 6 months

        setEditingPeriodId(period.id);
        setIsAddingPeriod(true);
    };

    const handleRemovePeriod = (periodId: string) => {
        const updated = periods.filter(p => p.id !== periodId);
        setPeriods(updated);
        saveWithPeriods(updated);
    };

    const handleTogglePeriod = (periodId: string) => {
        const updated = periods.map(p =>
            p.id === periodId ? { ...p, active: !p.active } : p
        );
        setPeriods(updated);
        saveWithPeriods(updated);
    };

    const resetForm = () => {
        let suggestion = new Date();

        // Suggest next available date if periods exist
        if (periods.length > 0) {
            const sorted = [...periods].sort((a, b) => b.endDate.getTime() - a.endDate.getTime());
            const latestEnd = sorted[0].endDate;
            suggestion = new Date(latestEnd);
            suggestion.setDate(suggestion.getDate() + 1);
        }

        setFormStartDay(String(suggestion.getDate()).padStart(2, '0'));
        setFormStartMonth(String(suggestion.getMonth() + 1).padStart(2, '0'));
        setFormStartYear(String(suggestion.getFullYear()));
        setFormDuration('1');
        setFormEndDate(null);
    };

    if (!portalPosition) return null;

    const modalContent = (
        <div
            data-period-picker-modal
            className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-[99999] w-[320px]"
            style={{
                top: `${portalPosition.top}px`,
                left: `${portalPosition.left}px`
            }}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                <h3 className="text-[12px] font-semibold text-gray-900">Períodos Mensais</h3>
                <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600"
                    type="button"
                    title="Cancelar (não salvar)"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Period List or Add Form */}
            <div className="max-h-[300px] overflow-y-auto p-3">
                {!isAddingPeriod ? (
                    <>
                        {/* Period List */}
                        {periods.map(period => (
                            <div
                                key={period.id}
                                className="mb-2 p-2 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0 pl-1">
                                        <div className="text-[11px] text-gray-900 font-medium">
                                            {formatMonthlyPeriodDisplay(period.startDate, period.endDate)}
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleEditPeriod(period)}
                                            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 size={12} />
                                        </button>
                                        <button
                                            onClick={() => handleRemovePeriod(period.id)}
                                            className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                            title="Remover"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add Period Button */}
                        <button
                            onClick={() => {
                                resetForm();
                                setIsAddingPeriod(true);
                            }}
                            className="w-full py-2 px-3 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-[11px] font-medium"
                        >
                            <Plus size={14} />
                            Adicionar Período
                        </button>
                    </>
                ) : (
                    /* Add/Edit Period Form */
                    <div className="space-y-3">
                        <div>
                            <label className="block text-[10px] font-medium text-gray-700 mb-1">
                                Data de Início
                            </label>
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    min="1"
                                    max={maxDay}
                                    value={formStartDay}
                                    onChange={(e) => {
                                        const day = parseInt(e.target.value);
                                        if (day >= 1 && day <= maxDay) {
                                            setFormStartDay(e.target.value);
                                        }
                                    }}
                                    className="w-14 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="DD"
                                />
                                <span className="text-gray-400 self-center">/</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={formStartMonth}
                                    onChange={(e) => setFormStartMonth(e.target.value)}
                                    className="w-14 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="MM"
                                />
                                <span className="text-gray-400 self-center">/</span>
                                <input
                                    type="number"
                                    min="2026"
                                    max="2030"
                                    value={formStartYear}
                                    onChange={(e) => setFormStartYear(e.target.value)}
                                    className="w-20 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="AAAA"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-medium text-gray-700 mb-1">
                                Duração
                            </label>
                            <select
                                value={formDuration}
                                onChange={(e) => setFormDuration(e.target.value)}
                                className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="1">1 mês</option>
                                <option value="2">2 meses</option>
                                <option value="3">3 meses</option>
                                <option value="4">4 meses</option>
                                <option value="5">5 meses</option>
                                <option value="6">6 meses</option>
                            </select>
                        </div>

                        {formEndDate && (
                            <div className="flex justify-between items-center text-[10px] text-gray-600 bg-gray-50 p-2 rounded">
                                <span><strong>Fim:</strong> {formatDisplayDate(formEndDate)}</span>
                                {overlapError && (
                                    <span className="text-red-500 font-bold">{overlapError}</span>
                                )}
                            </div>
                        )}

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => {
                                    setIsAddingPeriod(false);
                                    setEditingPeriodId(null);
                                    resetForm();
                                }}
                                className="flex-1 px-3 py-1.5 text-[11px] border border-gray-300 rounded hover:bg-gray-50 font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddPeriod}
                                disabled={!formEndDate || !!overlapError}
                                className="flex-1 px-3 py-1.5 text-[11px] bg-blue-500 text-white rounded hover:bg-blue-600 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {editingPeriodId ? 'Salvar' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            {!isAddingPeriod && (
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500">
                        {periods.filter(p => p.active).length} período{periods.filter(p => p.active).length !== 1 ? 's' : ''} (Salvo automático)
                    </span>
                </div>
            )}
        </div>
    );

    return createPortal(modalContent, document.body);
}
