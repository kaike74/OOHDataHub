'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PropostaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (proposta: { nome: string; comissao: string }) => Promise<void>;
    clienteId: number;
}

export default function PropostaModal({ isOpen, onClose, onSave, clienteId }: PropostaModalProps) {
    const [nome, setNome] = useState('');
    const [comissao, setComissao] = useState<'V2' | 'V3' | 'V4'>('V2');
    const [loading, setLoading] = useState(false);

    const resetForm = () => {
        setNome('');
        setComissao('V2');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await onSave({ nome, comissao });
            resetForm();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar proposta:', error);
            alert('Erro ao salvar proposta. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const comissaoInfo = {
        V2: { multiplicador: '1.25x', percentual: '+25%', descricao: 'Base + 25%' },
        V3: { multiplicador: '1.56x', percentual: '+56%', descricao: 'V2 + 25%' },
        V4: { multiplicador: '1.95x', percentual: '+95%', descricao: 'V3 + 25%' }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#06055B] border border-[#FC1E75]/30 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">Nova Proposta</h2>
                    <button
                        onClick={handleClose}
                        className="text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Nome */}
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                            Nome da Proposta *
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FC1E75] focus:ring-2 focus:ring-[#FC1E75]/20 transition-all"
                            placeholder="Ex: Campanha Black Friday 2024"
                        />
                    </div>

                    {/* Comissão */}
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-3">
                            Nível de Comissão *
                        </label>
                        <div className="space-y-3">
                            {(['V2', 'V3', 'V4'] as const).map((nivel) => (
                                <label
                                    key={nivel}
                                    className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-all ${comissao === nivel
                                            ? 'bg-[#FC1E75]/10 border-[#FC1E75]'
                                            : 'bg-white/5 border-white/10 hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="radio"
                                            name="comissao"
                                            value={nivel}
                                            checked={comissao === nivel}
                                            onChange={(e) => setComissao(e.target.value as 'V2' | 'V3' | 'V4')}
                                            className="w-5 h-5 text-[#FC1E75] border-white/20 focus:ring-[#FC1E75]"
                                        />
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="text-white font-semibold">{nivel}</span>
                                                <span className="text-xs bg-[#FC1E75]/20 text-[#FC1E75] px-2 py-0.5 rounded-full">
                                                    {comissaoInfo[nivel].percentual}
                                                </span>
                                            </div>
                                            <p className="text-xs text-white/60 mt-1">
                                                {comissaoInfo[nivel].descricao}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-white/90 font-mono text-sm">
                                            {comissaoInfo[nivel].multiplicador}
                                        </p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Info */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <p className="text-xs text-white/70">
                            💡 <strong>Papel e Lona</strong> sempre terão acréscimo de +25% independente da comissão selecionada.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/90 hover:bg-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !nome}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-[#FC1E75] to-[#FF6B9D] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FC1E75]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Criando...' : 'Criar Proposta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
