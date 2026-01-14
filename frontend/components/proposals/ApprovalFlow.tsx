'use client';

import { useState, useMemo, useRef } from 'react';
import { Proposta, PropostaItem, Ponto } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { X, Check, FileText, MapPin, Calendar, DollarSign, Package, AlertCircle } from 'lucide-react';
import GoogleMap from '@/components/map/GoogleMap';
import { cn } from '@/lib/utils';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ApprovalFlowProps {
    isOpen: boolean;
    onClose: () => void;
    proposta: Proposta;
    itens: PropostaItem[];
    onApprove: (data: ApprovalData) => Promise<void>;
}

export interface ApprovalData {
    buyMaterial: boolean;
    materialSelections: Record<number, { paper: number; canvas: number }>;
    totals: {
        rental: number;
        material: number;
        grandTotal: number;
    };
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Stepper Component for Quantity
const NumberStepper = ({ value, onChange, label, max = 10 }: { value: number, onChange: (v: number) => void, label?: string, max?: number }) => (
    <div className="flex flex-col items-center gap-1">
        {label && <span className="text-[10px] text-gray-500 uppercase">{label}</span>}
        <div className="flex items-center border border-gray-200 rounded overflow-hidden h-8 bg-white">
            <button
                onClick={() => onChange(Math.max(0, value - 1))}
                className="w-8 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-r border-gray-100 disabled:opacity-50"
                disabled={value <= 0}
            >
                -
            </button>
            <div className="w-10 h-full flex items-center justify-center text-sm font-medium text-gray-900 bg-gray-50/50">
                {value}
            </div>
            <button
                onClick={() => onChange(Math.min(max, value + 1))}
                className="w-8 h-full flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors border-l border-gray-100"
            >
                +
            </button>
        </div>
    </div>
);

export default function ApprovalFlow({ isOpen, onClose, proposta, itens, onApprove }: ApprovalFlowProps) {
    const [step, setStep] = useState<'summary' | 'success'>('summary');
    const [buyMaterial, setBuyMaterial] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const summaryRef = useRef<HTMLDivElement>(null);
    const successRef = useRef<HTMLDivElement>(null);

    // Initialize with 0 or default values
    const [materialSelections, setMaterialSelections] = useState<Record<number, { paper: number; canvas: number }>>(() => {
        const initial: Record<number, { paper: number; canvas: number }> = {};
        itens.forEach(item => {
            initial[item.id] = { paper: 0, canvas: 0 };
        });
        return initial;
    });

    const updateSelection = (itemId: number, type: 'paper' | 'canvas', val: number) => {
        setMaterialSelections(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                [type]: val
            }
        }));
    };

    // Calculate Totals
    const totals = useMemo(() => {
        let rental = 0;
        let material = 0;

        itens.forEach(item => {
            // Rental Calculation
            let qtd = 1;
            if (item.periodo_inicio && item.periodo_fim) {
                const start = new Date(item.periodo_inicio);
                const end = new Date(item.periodo_fim);
                const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
                qtd = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
            }
            rental += (item.valor_locacao || 0) * qtd;

            // Material Calculation
            if (buyMaterial) {
                const selection = materialSelections[item.id] || { paper: 0, canvas: 0 };
                material += (item.valor_papel || 0) * selection.paper;
                material += (item.valor_lona || 0) * selection.canvas;
            }
        });

        return {
            rental,
            material,
            grandTotal: rental + material
        };
    }, [itens, buyMaterial, materialSelections]);

    // Map Points
    // Map Points
    const mapPoints = useMemo<Ponto[]>(() => {
        return itens.map(item => {
            const { id: itemId, ...rest } = item;
            return {
                ...rest,
                id: item.id_ooh || itemId, // Fallback if id_ooh missing
                latitude: item.latitude,
                longitude: item.longitude,
                codigo_ooh: item.codigo_ooh,
                endereco: item.endereco,
                cidade: item.cidade,
                uf: item.uf,
                tipo: item.tipo,
                // Include minimal required fields for GoogleMap to work without crashing
                produtos: [],
            } as any;
        });
    }, [itens]);

    const [showConfirm, setShowConfirm] = useState(false);

    const handleConfirm = () => {
        setShowConfirm(true);
    };

    const executeApproval = async () => {
        setIsSubmitting(true);
        try {
            await onApprove({
                buyMaterial,
                materialSelections,
                totals
            });
            setShowConfirm(false); // Close confirm
            setStep('success');
        } catch (error) {
            console.error("Failed to approve", error);
            alert("Erro ao aprovar proposta. Tente novamente.");
            setShowConfirm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGeneratePDF = async () => {
        // Use the success modal content or a specific hidden summary div
        const element = successRef.current || summaryRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Resumo_Aprovacao_${proposta.nome}.pdf`);
        } catch (error) {
            console.error('Error generating PDF', error);
            alert('Erro ao gerar PDF');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div
                className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                ref={step === 'summary' ? summaryRef : successRef}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-gray-900">
                            {step === 'summary' ? 'Resumo da Aprovação' : 'Aprovação Concluída'}
                        </h2>
                        {step === 'summary' && (
                            <p className="text-sm text-gray-500">Revise os detalhes da campanha antes de confirmar</p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50/50">
                    {step === 'summary' ? (
                        <div className="flex flex-col gap-6 p-6">
                            {/* 1. Map Section */}
                            <div className="w-full h-[300px] rounded-xl overflow-hidden shadow-sm border border-gray-200 relative">
                                <GoogleMap
                                    readOnly
                                    showProposalActions={false}
                                    forcedPontos={mapPoints}
                                    enableStreetView={false}
                                />
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 text-xs font-medium text-gray-700">
                                    {mapPoints.length} pontos selecionados
                                </div>
                            </div>

                            {/* 2. Material Toggle */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-3 rounded-full shadow-sm text-blue-600">
                                        <Package size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Produção de Material</h3>
                                        <p className="text-sm text-gray-600">Gostaria de contratar a produção (Papel/Lona) conosco?</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={cn("text-sm font-medium transition-colors", !buyMaterial ? "text-gray-900" : "text-gray-500")}>
                                        Tenho fornecedor próprio
                                    </span>
                                    <button
                                        onClick={() => setBuyMaterial(!buyMaterial)}
                                        className={cn(
                                            "relative w-14 h-7 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                                            buyMaterial ? "bg-blue-600" : "bg-gray-300"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out mt-1 ml-1",
                                                buyMaterial ? "translate-x-7" : "translate-x-0"
                                            )}
                                        />
                                    </button>
                                    <span className={cn("text-sm font-medium transition-colors", buyMaterial ? "text-blue-700" : "text-gray-500")}>
                                        Sim, quero comprar
                                    </span>
                                </div>
                            </div>

                            {/* 3. Items List */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-4 py-3 w-[40%]">Localização</th>
                                            <th className="px-4 py-3">Período</th>
                                            <th className="px-4 py-3 text-right">Locação</th>
                                            {buyMaterial && (
                                                <>
                                                    <th className="px-4 py-3 text-center w-[15%]">Material Ass.</th>
                                                    <th className="px-4 py-3 text-right">Custo Material</th>
                                                </>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {itens.map(item => {
                                            let qtdPeriodoDisplay = "";
                                            let periodoExtenso = "";

                                            if (item.periodo_inicio && item.periodo_fim) {
                                                const start = new Date(item.periodo_inicio);
                                                const end = new Date(item.periodo_fim);
                                                const diffDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

                                                // Intl Format
                                                const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'short' });
                                                const yearFormatter = new Intl.DateTimeFormat('pt-BR', { year: 'numeric' });

                                                periodoExtenso = `${dateFormatter.format(start)} a ${dateFormatter.format(end)} de ${yearFormatter.format(end)}`;

                                                const qtdBi = item.periodo_comercializado === 'mensal' ? 1 : Math.ceil(diffDays / 14);
                                                const labelPeriodo = item.periodo_comercializado === 'mensal' ? 'Mês(es)' : 'Bissemana(s)';
                                                qtdPeriodoDisplay = `${qtdBi} ${labelPeriodo}`;
                                            }

                                            // Rental Subtotal
                                            const qtd = parseInt(qtdPeriodoDisplay.split(' ')[0] || "1"); // safe parse
                                            const rentalVal = (item.valor_locacao || 0) * qtd;

                                            // Material Subtotal
                                            const sel = materialSelections[item.id] || { paper: 0, canvas: 0 };
                                            const matVal = ((item.valor_papel || 0) * sel.paper) + ((item.valor_lona || 0) * sel.canvas);

                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50 group">
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900 line-clamp-1">{item.endereco}</span>
                                                            <span className="text-xs text-gray-500">{item.cidade} - {item.uf}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-gray-900">{qtdPeriodoDisplay}</span>
                                                            <span className="text-[11px] text-gray-500">{periodoExtenso}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-medium text-gray-700">
                                                        {formatCurrency(rentalVal)}
                                                    </td>
                                                    {buyMaterial && (
                                                        <>
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <NumberStepper
                                                                        value={sel.paper}
                                                                        onChange={(v) => updateSelection(item.id, 'paper', v)}
                                                                        label="Papel"
                                                                    />
                                                                    <NumberStepper
                                                                        value={sel.canvas}
                                                                        onChange={(v) => updateSelection(item.id, 'canvas', v)}
                                                                        label="Lona"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium text-blue-700">
                                                                {formatCurrency(matVal)}
                                                            </td>
                                                        </>
                                                    )}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-300">
                                <Check size={40} className="text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Proposta Aprovada com Sucesso!</h3>
                            <p className="text-gray-500 max-w-md mx-auto mb-8">
                                Em breve nossa equipe irá entrar em contato para formalizar seu contrato.
                                Enquanto isso, enviamos o resumo da sua compra por e-mail.
                            </p>

                            <div className="flex items-center gap-4 bg-gray-50 p-6 rounded-xl border border-gray-100 w-full max-w-lg mb-8 text-left">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total da Campanha</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(totals.grandTotal)}</p>
                                </div>
                                <div className="h-10 w-px bg-gray-200 mx-4" />
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">{mapPoints.length} pontos</p>
                                    <p className="text-xs text-gray-500">{buyMaterial ? 'Com material incluso' : 'Material próprio'}</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleGeneratePDF}
                                size="lg"
                                variant="outline"
                                leftIcon={<FileText size={18} />}
                                className="border-gray-300 hover:bg-gray-50"
                            >
                                Baixar Resumo em PDF
                            </Button>
                        </div>
                    )}
                </div>

                {/* Footer Totals */}
                {step === 'summary' && (
                    <div className="bg-white border-t border-gray-200 px-8 py-5 flex items-center justify-between shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center gap-8">
                            <div className="flex flex-col">
                                <span className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Total Locação</span>
                                <span className="text-lg font-semibold text-gray-700">{formatCurrency(totals.rental)}</span>
                            </div>
                            {buyMaterial && (
                                <div className="flex flex-col">
                                    <span className="text-[11px] text-gray-400 uppercase font-semibold tracking-wider">Total Material</span>
                                    <span className="text-lg font-semibold text-blue-600">{formatCurrency(totals.material)}</span>
                                </div>
                            )}
                            <div className="h-8 w-px bg-gray-200" />
                            <div className="flex flex-col">
                                <span className="text-[11px] text-gray-500 uppercase font-bold tracking-wider">Total Final</span>
                                <span className="text-2xl font-bold text-gray-900 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">
                                    {formatCurrency(totals.grandTotal)}
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                Voltar
                            </Button>
                            <Button
                                disabled={isSubmitting}
                                onClick={handleConfirm}
                                isLoading={isSubmitting}
                                variant="primary"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 px-8"
                            >
                                Aprovar e Concluir
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Confirmar Aprovação</h3>
                                <p className="text-sm text-gray-500">Tem certeza que deseja concluir e aprovar esta proposta? Esta ação não poderá ser desfeita.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirm(false)}
                                className="border-gray-200"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={executeApproval}
                                isLoading={isSubmitting}
                                variant="primary"
                                className="bg-blue-600 text-white hover:bg-blue-700"
                            >
                                Sim, Aprovar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
