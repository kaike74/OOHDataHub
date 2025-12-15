
import { useState, useRef } from 'react';
import { X, Upload, Loader2, Building2 } from 'lucide-react';
import { api } from '@/lib/api';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClientModal({ isOpen, onClose, onSuccess }: ClientModalProps) {
    const [nome, setNome] = useState('');
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setLogoPreview(objectUrl);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Create Client
            const newClient = await api.createCliente({ nome });

            // 2. Upload Logo if selected
            if (selectedFile && newClient.id) {
                const uploadResult = await api.uploadClientLogo(selectedFile, String(newClient.id));
                // Update local object if needed, but we reload list anyway
            }

            onSuccess();
            onClose();
            setNome('');
            setLogoPreview(null);
            setSelectedFile(null);

        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao criar cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-900">Novo Cliente</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Logo Upload Placeholder */}
                    <div className="flex flex-col items-center justify-center gap-3">
                        <div
                            className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:border-emidias-accent hover:bg-emidias-accent/5 transition-all cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="text-gray-400 group-hover:text-emidias-accent" size={32} />
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <span className="text-sm text-gray-500">Logo do Cliente</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Nome da Empresa</label>
                        <input
                            type="text"
                            required
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none"
                            placeholder="Ex: McDonald's"
                        />
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
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Criar Cliente'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
