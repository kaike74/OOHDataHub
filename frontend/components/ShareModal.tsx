'use client';

import { useState } from 'react';
import { X, Copy, Check, QrCode, ExternalLink, Loader2, Share2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Proposta } from '@/lib/types';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposta: Proposta | null;
}

export default function ShareModal({ isOpen, onClose, proposta }: ShareModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const generateLink = async () => {
        if (!proposta) return;

        setIsLoading(true);
        setError('');

        try {
            const res = await api.shareProposta(proposta.id);
            if (res.success && res.token) {
                // Construct URL using the current origin + view path
                const url = `${window.location.origin}/portal/view?token=${res.token}`;
                setShareUrl(url);
            } else {
                setError('Falha ao gerar link');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao conectar com servidor');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-emidias-primary/5 p-4 border-b border-emidias-primary/10 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <Share2 className="text-emidias-primary" size={20} />
                        Compartilhar Proposta
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div className="text-center">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <ExternalLink className="text-blue-600" size={24} />
                        </div>
                        <h3 className="font-medium text-gray-900">Link Público do Cliente</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Gere um link seguro para que o cliente visualize esta proposta com valores ocultos e sem acesso administrativo.
                        </p>
                    </div>

                    {!shareUrl ? (
                        <button
                            onClick={generateLink}
                            disabled={isLoading}
                            className="w-full py-3 bg-emidias-primary hover:bg-emidias-primary-dark text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                            {isLoading ? 'Gerando...' : 'Gerar Link de Acesso'}
                        </button>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">
                                Link de Acesso
                            </label>
                            <div className="flex gap-2">
                                <input
                                    readOnly
                                    value={shareUrl}
                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emidias-primary/20"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-all ${copied
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {copied ? <Check size={18} /> : <Copy size={18} />}
                                </button>
                            </div>

                            <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2 items-start mt-4">
                                <ExternalLink size={14} className="mt-0.5 flex-shrink-0" />
                                <p>
                                    Este link permite a visualização da proposta. O cliente não verá custos de produção (papel/lona) nem margens, apenas o valor final negociado.
                                </p>
                            </div>

                            <div className="flex justify-center mt-2">
                                <a
                                    href={shareUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-emidias-primary hover:underline flex items-center gap-1"
                                >
                                    Testar link <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
