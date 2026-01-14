'use client';

import React from 'react';
import { X, CheckCircle, FileText } from 'lucide-react';
import { Proposta, PropostaItem, MaterialSelection } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { generateApprovalPDF } from '@/lib/ApprovalPDFGenerator';

interface ApprovalSuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposta: Proposta | null;
    itens: PropostaItem[];
    materialSelection: MaterialSelection;
}

export default function ApprovalSuccessModal({
    isOpen,
    onClose,
    proposta,
    itens,
    materialSelection
}: ApprovalSuccessModalProps) {
    if (!isOpen || !proposta) return null;

    const handleGeneratePDF = async () => {
        try {
            await generateApprovalPDF(proposta, itens, materialSelection);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Erro ao gerar PDF. Por favor, tente novamente.');
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 z-[102] animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[103] w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Proposta Aprovada!</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6">
                        <div className="space-y-4">
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-900 font-semibold mb-2">
                                    ✅ Proposta aprovada com sucesso!
                                </p>
                                <p className="text-sm text-green-800 leading-relaxed">
                                    Em breve nossa equipe irá entrar em contato para formalizar seu contrato.
                                    Enquanto isso, enviamos o resumo da sua compra por email.
                                </p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-xs text-blue-900 mb-2">
                                    💡 <strong>Próximos passos:</strong>
                                </p>
                                <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                                    <li>Aguarde o contato da nossa equipe</li>
                                    <li>Verifique seu email para o resumo detalhado</li>
                                    <li>Você pode gerar um PDF do resumo abaixo</li>
                                </ul>
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
                            Fechar
                        </Button>
                        <Button
                            onClick={handleGeneratePDF}
                            variant="accent"
                            size="sm"
                            leftIcon={<FileText size={16} />}
                        >
                            Gerar PDF
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
