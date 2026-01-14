'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Edit2, Trash2, Check } from 'lucide-react';

interface MonthlyPeriod {
    id: string;
    startDate: Date;
    endDate: Date;
    startStr: string;
    endStr: string;
    months: number;
    enabled: boolean;
}

interface MonthlyPeriodPickerProps {
    startDate: string | null;
    endDate: string | null;
    onSelectPeriods: (startDate: string, endDate: string, selectedPeriods: string[]) => void;
    onClose: (shouldSave: boolean) => void;
    saveOnClickOutside?: boolean;
    initialSelectedPeriods?: string[];
}

export default function MonthlyPeriodPicker({
    startDate,
    endDate,
    onSelectPeriods,
    onClose,
    saveOnClickOutside = false,
    initialSelectedPeriods = []
}: MonthlyPeriodPickerProps) {
    const [periods, setPeriods] = useState<MonthlyPeriod[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingPeriod, setEditingPeriod] = useState<MonthlyPeriod | null>(null);

    // Form state
    const [formStartDay, setFormStartDay] = useState('01');
    const [formStartMonth, setFormStartMonth] = useState('01');
    const [formStartYear, setFormStartYear] = useState('2026');
    const [formDuration, setFormDuration] = useState('1');
    const [formEndDay, setFormEndDay] = useState('');
    const [formEndMonth, setFormEndMonth] = useState('');
    const [formEndYear, setFormEndYear] = useState('');

    // Initialize periods from props
    useEffect(() => {
        if (initialSelectedPeriods && initialSelectedPeriods.length > 0) {
            // Parse existing periods from selected_periods array
            const parsedPeriods: MonthlyPeriod[] = initialSelectedPeriods.map((periodStr, index) => {
                // Assuming format: "YYYY-MM"
                const [year, month] = periodStr.split('-');
                const start = new Date(parseInt(year), parseInt(month) - 1, 1);
                const end = new Date(parseInt(year), parseInt(month), 0); // Last day of month

                return {
                    id: `period-${index}`,
                    startDate: start,
                    endDate: end,
                    startStr: formatDateForInput(start),
                    endStr: formatDateForInput(end),
                    months: 1,
                    enabled: true
                };
            });
            setPeriods(parsedPeriods);
        } else if (startDate && endDate) {
            // Create initial period from start/end dates
            const start = new Date(startDate);
            const end = new Date(endDate);
            const months = calculateMonths(start, end);

            setPeriods([{
                id: 'period-0',
                startDate: start,
                endDate: end,
                startStr: startDate,
                endStr: endDate,
                months,
                enabled: true
            }]);
        }
    }, []);

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

    const calculateMonths = (start: Date, end: Date): number => {
        const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return Math.max(1, months + 1);
    };

    const calculateEndDate = (startDay: string, startMonth: string, startYear: string, duration: string): Date => {
        const start = new Date(parseInt(startYear), parseInt(startMonth) - 1, parseInt(startDay));
        const durationMonths = parseInt(duration);

        if (duration === 'custom') {
            return start;
        }

        const end = new Date(start);
        end.setMonth(end.getMonth() + durationMonths);
        end.setDate(end.getDate() - 1); // End on the day before

        return end;
    };

    // Auto-calculate end date when form inputs change
    useEffect(() => {
        if (formDuration !== 'custom' && formStartDay && formStartMonth && formStartYear) {
            const endDate = calculateEndDate(formStartDay, formStartMonth, formStartYear, formDuration);
            setFormEndDay(String(endDate.getDate()).padStart(2, '0'));
            setFormEndMonth(String(endDate.getMonth() + 1).padStart(2, '0'));
            setFormEndYear(String(endDate.getFullYear()));
        }
    }, [formStartDay, formStartMonth, formStartYear, formDuration]);

    const handleAddPeriod = () => {
        setShowAddForm(true);
        setEditingPeriod(null);

        // Set default values to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setFormStartDay(String(tomorrow.getDate()).padStart(2, '0'));
        setFormStartMonth(String(tomorrow.getMonth() + 1).padStart(2, '0'));
        setFormStartYear(String(tomorrow.getFullYear()));
        setFormDuration('1');
    };

    const handleEditPeriod = (period: MonthlyPeriod) => {
        setEditingPeriod(period);
        setShowAddForm(true);

        setFormStartDay(String(period.startDate.getDate()).padStart(2, '0'));
        setFormStartMonth(String(period.startDate.getMonth() + 1).padStart(2, '0'));
        setFormStartYear(String(period.startDate.getFullYear()));
        setFormEndDay(String(period.endDate.getDate()).padStart(2, '0'));
        setFormEndMonth(String(period.endDate.getMonth() + 1).padStart(2, '0'));
        setFormEndYear(String(period.endDate.getFullYear()));
        setFormDuration(String(period.months));
    };

    const handleRemovePeriod = (periodId: string) => {
        setPeriods(prev => prev.filter(p => p.id !== periodId));
    };

    const handleTogglePeriod = (periodId: string) => {
        setPeriods(prev => prev.map(p =>
            p.id === periodId ? { ...p, enabled: !p.enabled } : p
        ));
    };

    const handleSavePeriod = () => {
        const startDate = new Date(parseInt(formStartYear), parseInt(formStartMonth) - 1, parseInt(formStartDay));
        const endDate = new Date(parseInt(formEndYear), parseInt(formEndMonth) - 1, parseInt(formEndDay));
        const months = calculateMonths(startDate, endDate);

        const newPeriod: MonthlyPeriod = {
            id: editingPeriod ? editingPeriod.id : `period-${Date.now()}`,
            startDate,
            endDate,
            startStr: formatDateForInput(startDate),
            endStr: formatDateForInput(endDate),
            months,
            enabled: true
        };

        if (editingPeriod) {
            setPeriods(prev => prev.map(p => p.id === editingPeriod.id ? newPeriod : p));
        } else {
            setPeriods(prev => [...prev, newPeriod]);
        }

        setShowAddForm(false);
        setEditingPeriod(null);
    };

    const handleApply = () => {
        const enabledPeriods = periods.filter(p => p.enabled);

        if (enabledPeriods.length > 0) {
            const sortedPeriods = [...enabledPeriods].sort((a, b) =>
                a.startDate.getTime() - b.startDate.getTime()
            );

            const firstPeriod = sortedPeriods[0];
            const lastPeriod = sortedPeriods[sortedPeriods.length - 1];

            // Create selected_periods array with period IDs
            const selectedPeriodIds = sortedPeriods.map(p => p.id);

            onSelectPeriods(firstPeriod.startStr, lastPeriod.endStr, selectedPeriodIds);
        }

        onClose(true);
    };

    const handleCancel = () => {
        onClose(false);
    };

    // Portal positioning
    const [portalPosition, setPortalPosition] = useState<{ top: number; left: number } | null>(null);

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

    if (!portalPosition) return null;

    const enabledCount = periods.filter(p => p.enabled).length;

    const modalContent = (
        <div
            data-period-picker-modal
            className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-[99999] w-[320px]"
            style={{
                top: `${portalPosition.top}px`,
                left: `${portalPosition.left}px`
            }}
        >
            {!showAddForm ? (
                <>
                    {/* Main View */}
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

                    <div className="max-h-[300px] overflow-y-auto p-3 space-y-2">
                        {periods.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-[11px]">
                                Nenhum período adicionado
                            </div>
                        ) : (
                            periods.map(period => (
                                <div
                                    key={period.id}
                                    className="border border-gray-200 rounded-md p-2 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-start gap-2">
                                        <div
                                            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all ${period.enabled ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'
                                                }`}
                                            onClick={() => handleTogglePeriod(period.id)}
                                        >
                                            {period.enabled && (
                                                <Check size={10} className="text-white" strokeWidth={3} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[11px] font-medium ${period.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
                                                {formatDisplayDate(period.startDate)} → {formatDisplayDate(period.endDate)}
                                            </div>
                                            <div className="text-[10px] text-gray-500">
                                                ({period.months} {period.months === 1 ? 'mês' : 'meses'})
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEditPeriod(period)}
                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={12} />
                                            </button>
                                            <button
                                                onClick={() => handleRemovePeriod(period.id)}
                                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Remover"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        <button
                            onClick={handleAddPeriod}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-[11px] font-medium"
                        >
                            <Plus size={14} />
                            Adicionar Período
                        </button>
                    </div>

                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                        <span className="text-[10px] text-gray-500">
                            {enabledCount} período{enabledCount !== 1 ? 's' : ''} selecionado{enabledCount !== 1 ? 's' : ''}
                        </span>
                        <button
                            onClick={handleApply}
                            className="px-3 py-1 text-[11px] bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
                            type="button"
                        >
                            Aplicar
                        </button>
                    </div>
                </>
            ) : (
                <>
                    {/* Add/Edit Form */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
                        <h3 className="text-[12px] font-semibold text-gray-900">
                            {editingPeriod ? 'Editar Período' : 'Novo Período Mensal'}
                        </h3>
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="text-gray-400 hover:text-gray-600"
                            type="button"
                        >
                            <X size={14} />
                        </button>
                    </div>

                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                Data de Início
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={formStartDay}
                                    onChange={(e) => setFormStartDay(e.target.value.padStart(2, '0'))}
                                    className="w-16 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="DD"
                                />
                                <span className="text-gray-400 self-center">/</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={formStartMonth}
                                    onChange={(e) => setFormStartMonth(e.target.value.padStart(2, '0'))}
                                    className="w-16 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="MM"
                                />
                                <span className="text-gray-400 self-center">/</span>
                                <input
                                    type="number"
                                    min="2020"
                                    max="2030"
                                    value={formStartYear}
                                    onChange={(e) => setFormStartYear(e.target.value)}
                                    className="w-20 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="AAAA"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
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
                                <option value="custom">Customizado</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-[11px] font-medium text-gray-700 mb-1">
                                Data de Fim {formDuration !== 'custom' && <span className="text-gray-400">(calculado)</span>}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="1"
                                    max="31"
                                    value={formEndDay}
                                    onChange={(e) => setFormEndDay(e.target.value.padStart(2, '0'))}
                                    disabled={formDuration !== 'custom'}
                                    className="w-16 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="DD"
                                />
                                <span className="text-gray-400 self-center">/</span>
                                <input
                                    type="number"
                                    min="1"
                                    max="12"
                                    value={formEndMonth}
                                    onChange={(e) => setFormEndMonth(e.target.value.padStart(2, '0'))}
                                    disabled={formDuration !== 'custom'}
                                    className="w-16 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="MM"
                                />
                                <span className="text-gray-400 self-center">/</span>
                                <input
                                    type="number"
                                    min="2020"
                                    max="2030"
                                    value={formEndYear}
                                    onChange={(e) => setFormEndYear(e.target.value)}
                                    disabled={formDuration !== 'custom'}
                                    className="w-20 px-2 py-1 text-[11px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                                    placeholder="AAAA"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-2">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-200 rounded font-medium"
                            type="button"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSavePeriod}
                            className="px-3 py-1 text-[11px] bg-blue-500 text-white rounded hover:bg-blue-600 font-medium"
                            type="button"
                        >
                            {editingPeriod ? 'Salvar' : 'Adicionar'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );

    return createPortal(modalContent, document.body);
}
