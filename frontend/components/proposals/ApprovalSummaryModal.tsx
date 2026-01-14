'use client';

import React, { useState, useMemo } from 'react';
import { X, MapPin, Calendar, DollarSign } from 'lucide-react';
import { Proposta, PropostaItem, MaterialSelection } from '@/lib/types';
import { formatPeriodExtended, calculateDuration } from '@/lib/dateUtils';
import { generateStaticMapUrl } from '@/lib/mapUtils';
import { Button } from '@/components/ui/Button';

interface ApprovalSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposta: Proposta | null;
    itens: PropostaItem[];
    onApprove: (materialSelection: MaterialSelection) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export default function ApprovalSummaryModal({
    isOpen,
    onClose,
    proposta,
    itens,
    onApprove
}: ApprovalSummaryModalProps) {
    const [wantsMaterial, setWantsMaterial] = useState(false);
    const [papelQuantities, setPapelQuantities] = useState<Record<number, number>>({});
    const [lonaQuantities, setLonaQuantities] = useState<Record<number, number>>({});

    // Filter only approved items - memoized to prevent recalculation
    const approvedItems = useMemo(() =>
        itens.filter(item => item.status_validacao === 'APPROVED'),
        [itens]
    );

    // Generate static map URL
    const mapUrl = useMemo(() =>
        generateStaticMapUrl(approvedItems, 1200, 500),
        [approvedItems]
    );

    // Calculate totals
    const totals = useMemo(() => {
        let totalLocacao = 0;
        let totalPapel = 0;
        let totalLona = 0;

        approvedItems.forEach(item => {
            // Calculate rental total
            let qtd = 1;
            if (item.periodo_inicio && item.periodo_fim) {
                const start = new Date(item.periodo_inicio);
                const end = new Date(item.periodo_fim);
                const diffMs = end.getTime() - start.getTime();
                const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
            }
            totalLocacao += (item.valor_locacao || 0) * qtd;

            // Calculate material totals if enabled
            if (wantsMaterial) {
                const papelQty = papelQuantities[item.id] || 0;
                const lonaQty = lonaQuantities[item.id] || 0;
                totalPapel += (item.valor_papel || 0) * papelQty;
                totalLona += (item.valor_lona || 0) * lonaQty;
            }
        });

        return {
            locacao: totalLocacao,
            papel: totalPapel,
            lona: totalLona,
            material: totalPapel + totalLona,
            total: totalLocacao + totalPapel + totalLona
        };
    }, [approvedItems, wantsMaterial, papelQuantities, lonaQuantities]);

    const handleApprove = () => {
        onApprove({
            wantsMaterial,
            papelQuantities,
            lonaQuantities
        });
    };

    const updatePapelQuantity = (itemId: number, qty: number) => {
        setPapelQuantities(prev => ({ ...prev, [itemId]: Math.max(0, qty) }));
    };

    const updateLonaQuantity = (itemId: number, qty: number) => {
        setLonaQuantities(prev => ({ ...prev, [itemId]: Math.max(0, qty) }));
    };

    if (!isOpen || !proposta) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 z-[100] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[95vw] h-[95vh] max-w-[1400px] animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-gray-900">Resumo da Compra</h2>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">{proposta.nome}</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        <div className="p-6 space-y-6">
                            {/* Map Section */}
                            <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                <div className="px-4 py-2 bg-white border-b border-gray-200">
                                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                        <MapPin size={14} />
                                        Pontos Selecionados
                                    </h3>
                                </div>
                                {mapUrl ? (
                                    <img
                                        src={mapUrl}
                                        alt="Mapa dos pontos selecionados"
                                        className="w-full h-auto"
                                    />
                                ) : (
                                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                                        Mapa não disponível
                                    </div>
                                )}
                            </div>

                            {/* Material Toggle */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={wantsMaterial}
                                        onChange={(e) => setWantsMaterial(e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-semibold text-gray-900">
                                        Deseja comprar o material conosco? (Papel/Lona)
                                    </span>
                                </label>
                            </div>

                            {/* Points List */}
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                        Detalhamento dos Pontos ({approvedItems.length})
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {approvedItems.map((item, index) => {
                                        const qtd = (() => {
                                            if (!item.periodo_inicio || !item.periodo_fim) return 1;
                                            const start = new Date(item.periodo_inicio);
                                            const end = new Date(item.periodo_fim);
                                            const diffMs = end.getTime() - start.getTime();
                                            const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                                            return item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                                        })();

                                        const locacaoTotal = (item.valor_locacao || 0) * qtd;
                                        const papelQty = papelQuantities[item.id] || 0;
                                        const lonaQty = lonaQuantities[item.id] || 0;
                                        const materialTotal = wantsMaterial
                                            ? ((item.valor_papel || 0) * papelQty) + ((item.valor_lona || 0) * lonaQty)
                                            : 0;

                                        return (
                                            <div key={item.id} className="p-3 hover:bg-gray-50 transition-colors">
                                                <div className="flex items-start gap-3">
                                                    {/* Number Badge */}
                                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                                        {index + 1}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 space-y-2">
                                                        {/* Address */}
                                                        <div className="flex items-start gap-2">
                                                            <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                                            <p className="text-xs font-medium text-gray-900 truncate" title={item.endereco}>
                                                                {item.endereco}
                                                            </p>
                                                        </div>

                                                        {/* Period */}
                                                        {item.periodo_inicio && item.periodo_fim && (
                                                            <div className="flex items-center gap-2">
                                                                <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                                                                <p className="text-[10px] text-gray-600">
                                                                    {formatPeriodExtended(item.periodo_inicio, item.periodo_fim)}
                                                                    <span className="ml-1 text-gray-500">
                                                                        ({calculateDuration(item.periodo_inicio, item.periodo_fim)})
                                                                    </span>
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Values */}
                                                        <div className="flex items-center gap-4 text-[10px]">
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-gray-500">Locação:</span>
                                                                <span className="font-semibold text-gray-900">{formatCurrency(locacaoTotal)}</span>
                                                            </div>
                                                            {wantsMaterial && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-gray-500">Material:</span>
                                                                    <span className="font-semibold text-blue-700">{formatCurrency(materialTotal)}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Material Toggles */}
                                                        {wantsMaterial && (
                                                            <div className="flex items-center gap-4 pt-1">
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-[10px] text-gray-600">Papel:</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={papelQty}
                                                                        onChange={(e) => updatePapelQuantity(item.id, parseInt(e.target.value) || 0)}
                                                                        className="w-14 px-2 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                                    />
                                                                    <span className="text-[10px] text-gray-500">
                                                                        × {formatCurrency(item.valor_papel || 0)}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <label className="text-[10px] text-gray-600">Lona:</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        value={lonaQty}
                                                                        onChange={(e) => updateLonaQuantity(item.id, parseInt(e.target.value) || 0)}
                                                                        className="w-14 px-2 py-0.5 text-[10px] border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                                    />
                                                                    <span className="text-[10px] text-gray-500">
                                                                        × {formatCurrency(item.valor_lona || 0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Totals Section */}
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                                    Totais da Campanha
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Total Locação:</span>
                                        <span className="font-bold text-gray-900">{formatCurrency(totals.locacao)}</span>
                                    </div>
                                    {wantsMaterial && (
                                        <>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Total Material:</span>
                                                <span className="font-bold text-blue-700">{formatCurrency(totals.material)}</span>
                                            </div>
                                            <div className="h-px bg-blue-200 my-2"></div>
                                        </>
                                    )}
                                    <div className="flex items-center justify-between text-lg pt-2">
                                        <span className="font-bold text-gray-900">Total da Compra:</span>
                                        <span className="font-bold text-green-700">{formatCurrency(totals.total)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <Button
                            onClick={onClose}
                            variant="outline"
                            size="sm"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleApprove}
                            variant="accent"
                            size="sm"
                        >
                            Concluir e Aprovar
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
