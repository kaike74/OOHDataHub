
import { useState } from 'react';
import { X, Loader2, Coins } from 'lucide-react';
import { useStore } from '@/lib/store';
import { Proposta } from '@/lib/types';
import { api } from '@/lib/api';

interface PropostaModalProps {
    isOpen: boolean;
    onClose: () => void;
    clienteId: number;
    onSuccess: (proposta: Proposta) => void;
}

export default function PropostaModal({ isOpen, onClose, clienteId, onSuccess }: PropostaModalProps) {
    const [nome, setNome] = useState('');
    const [comissao, setComissao] = useState<'V2' | 'V3' | 'V4'>('V2');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const token = useStore((state) => state.token);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const result = await api.createProposta({
                id_cliente: clienteId,
                nome,
                comissao
            });

            // Create minimal proposal object to pass back
            const newProposta: Proposta = {
                id: result.id,
                id_cliente: clienteId,
                nome,
                comissao,
                status: 'rascunho',
                created_at: new Date().toISOString()
            };
            onSuccess(newProposta);
            onClose();
            setNome('');
            setComissao('V2');
        } catch (error) {
            console.error('Erro:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Nova Proposta</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nome da Proposta</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none"
                            placeholder="Ex: Campanha Verão 2025"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Comissão</label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['V2', 'V3', 'V4'] as const).map((opt) => (
                                <button
                                    key={opt}
                                    type="button"
                                    onClick={() => setComissao(opt)}
                                    className={`py-3 px-4 rounded-xl border font-semibold transition-all flex flex-col items-center gap-1 ${comissao === opt
                                        ? 'bg-emidias-accent text-white border-emidias-accent shadow-lg shadow-emidias-accent/20'
                                        : 'bg-white text-gray-600 border-gray-200 hover:border-emidias-accent/50 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="text-lg">{opt}</span>
                                    <span className="text-[10px] opacity-80 font-normal">
                                        {opt === 'V2' ? '+25%' : opt === 'V3' ? '+56%' : '+95%'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-emidias-accent hover:bg-emidias-accent-dark shadow-lg shadow-emidias-accent/20 transition-all flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar e Abrir Mapa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
