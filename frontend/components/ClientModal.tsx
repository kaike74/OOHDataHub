
import { useState, useRef } from 'react';
import { Upload, Loader2, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCNPJ } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClientModal({ isOpen, onClose, onSuccess }: ClientModalProps) {
    const [formData, setFormData] = useState({
        nome: '',
        cnpj: '',
        segmento: '',
        publico_alvo: '',
        regiao: '',
        pacote_id: ''
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const objectUrl = URL.createObjectURL(file);
            setLogoPreview(objectUrl);
        }
    };

    const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, cnpj: formatCNPJ(value) }));
    };

    const fetchCNPJ = async () => {
        const cleanCNPJ = formData.cnpj.replace(/\D/g, '');
        if (cleanCNPJ.length !== 14) {
            alert('CNPJ inválido. Digite os 14 dígitos.');
            return;
        }

        setIsLoadingCNPJ(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
            if (!response.ok) throw new Error('CNPJ não encontrado');

            const data = await response.json();

            // Auto-fill available data
            setFormData(prev => ({
                ...prev,
                nome: data.razao_social || data.nome_fantasia || prev.nome,
                // Try to map cnae to segmento if possible, or just leave blank
                segmento: data.cnae_fiscal_descricao || prev.segmento,
                regiao: data.uf || prev.regiao // Simple regiao guess
            }));

        } catch (error) {
            console.error('Erro ao buscar CNPJ:', error);
            alert('Erro ao buscar dados do CNPJ. Verifique se está correto.');
        } finally {
            setIsLoadingCNPJ(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nome: '',
            cnpj: '',
            segmento: '',
            publico_alvo: '',
            regiao: '',
            pacote_id: ''
        });
        setLogoPreview(null);
        setSelectedFile(null);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.cnpj || formData.cnpj.length < 14) {
            alert('CNPJ é obrigatório');
            return;
        }

        setIsSubmitting(true);

        try {
            // 1. Create Client
            const payload = {
                nome: formData.nome,
                cnpj: formData.cnpj,
                segmento: formData.segmento,
                publico_alvo: formData.publico_alvo,
                regiao: formData.regiao,
                pacote_id: formData.pacote_id ? Number(formData.pacote_id) : null
            };

            const newClient = await api.createCliente(payload);

            // 2. Upload Logo if selected
            if (selectedFile && newClient.id) {
                await api.uploadClientLogo(selectedFile, String(newClient.id));
            }

            onSuccess();
            handleClose();

        } catch (error: any) {
            console.error('Erro:', error);
            alert(error.message || 'Erro ao criar cliente');
        } finally {
            setIsSubmitting(false);
        }
    };

    const footer = (
        <>
            <button
                type="button"
                onClick={handleClose}
                className="py-2.5 px-4 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
            >
                Cancelar
            </button>
            <Button
                type="submit"
                form="client-form"
                isLoading={isSubmitting}
                className="shadow-lg shadow-emidias-accent/20"
                leftIcon={isSubmitting ? <Loader2 className="animate-spin" size={16} /> : undefined}
            >
                {isSubmitting ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Novo Cliente"
            footer={footer}
            zIndex={70}
            maxWidth="2xl"
        >
            <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-6">
                    {/* Logo Upload */}
                    <div className="flex flex-col items-center gap-2">
                        <div
                            className="w-28 h-28 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:border-emidias-accent hover:bg-emidias-accent/5 transition-all cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-emidias-accent">
                                    <Upload size={24} className="mb-1" />
                                    <span className="text-[10px] uppercase font-bold">Logo</span>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    </div>

                    {/* Main Fields */}
                    <div className="space-y-4">
                        {/* CNPJ Row */}
                        <div className="flex items-end gap-2">
                            <div className="flex-1 space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">CNPJ *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.cnpj}
                                    onChange={handleCNPJChange}
                                    maxLength={18}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none font-mono text-sm"
                                    placeholder="00.000.000/0000-00"
                                />
                            </div>
                            <Button
                                type="button"
                                onClick={fetchCNPJ}
                                disabled={isLoadingCNPJ || formData.cnpj.length < 14}
                                className="mb-[1px] h-[42px]"
                                variant="outline"
                            >
                                {isLoadingCNPJ ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                <span className="ml-2 hidden sm:inline">Buscar</span>
                            </Button>
                        </div>

                        {/* Nome */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nome da Empresa *</label>
                            <input
                                type="text"
                                required
                                value={formData.nome}
                                onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none"
                                placeholder="Razão Social ou Nome Fantasia"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Segmento</label>
                        <select
                            value={formData.segmento}
                            onChange={(e) => setFormData(p => ({ ...p, segmento: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none bg-white"
                        >
                            <option value="">Selecione...</option>
                            <option value="Varejo">Varejo</option>
                            <option value="Serviços">Serviços</option>
                            <option value="Indústria">Indústria</option>
                            <option value="Tecnologia">Tecnologia</option>
                            <option value="Educação">Educação</option>
                            <option value="Saúde">Saúde</option>
                            <option value="Imobiliário">Imobiliário</option>
                            <option value="Automotivo">Automotivo</option>
                            <option value="Alimentação">Alimentação</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Região de Atuação</label>
                        <input
                            type="text"
                            value={formData.regiao}
                            onChange={(e) => setFormData(p => ({ ...p, regiao: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none"
                            placeholder="Ex: São Paulo, Nacional..."
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Público-Alvo</label>
                    <textarea
                        value={formData.publico_alvo}
                        onChange={(e) => setFormData(p => ({ ...p, publico_alvo: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none resize-none h-20"
                        placeholder="Descreva o público-alvo principal..."
                    />
                </div>
            </form>
        </Modal>
    );
}
