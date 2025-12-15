'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Upload } from 'lucide-react';

interface Cliente {
    id: number;
    nome: string;
    logo_r2_key: string | null;
    created_at: string;
}

interface ClienteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cliente: Partial<Cliente>) => Promise<void>;
    cliente?: Cliente;
}

export default function ClienteModal({ isOpen, onClose, onSave, cliente }: ClienteModalProps) {
    const [nome, setNome] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (cliente) {
            setNome(cliente.nome);
            if (cliente.logo_r2_key) {
                setLogoPreview(`https://ooh-api.kaike-458.workers.dev/api/images/${cliente.logo_r2_key}`);
            }
        } else {
            resetForm();
        }
    }, [cliente]);

    const resetForm = () => {
        setNome('');
        setLogoFile(null);
        setLogoPreview('');
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let logoR2Key = cliente?.logo_r2_key || null;

            // Upload logo se houver arquivo novo
            if (logoFile) {
                const formData = new FormData();
                formData.append('file', logoFile);

                const uploadResponse = await fetch('https://ooh-api.kaike-458.workers.dev/api/upload-logo', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    },
                    body: formData,
                });

                if (!uploadResponse.ok) {
                    throw new Error('Erro ao fazer upload da logo');
                }

                const uploadData = await uploadResponse.json();
                logoR2Key = uploadData.key;
            }

            await onSave({
                id: cliente?.id,
                nome,
                logo_r2_key: logoR2Key,
            });

            resetForm();
            onClose();
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            alert('Erro ao salvar cliente. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[#06055B] border border-[#FC1E75]/30 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-2xl font-bold text-white">
                        {cliente ? 'Editar Cliente' : 'Novo Cliente'}
                    </h2>
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
                            Nome do Cliente *
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            required
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FC1E75] focus:ring-2 focus:ring-[#FC1E75]/20 transition-all"
                            placeholder="Ex: McDonald's"
                        />
                    </div>

                    {/* Logo Upload */}
                    <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                            Logo
                        </label>
                        <div className="flex items-center space-x-4">
                            {logoPreview && (
                                <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/10 border border-white/10">
                                    <img
                                        src={logoPreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            )}
                            <label className="flex-1 flex items-center justify-center px-4 py-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-all">
                                <Upload className="w-5 h-5 text-white/70 mr-2" />
                                <span className="text-sm text-white/70">
                                    {logoFile ? logoFile.name : 'Selecionar logo'}
                                </span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
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
                            {loading ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
