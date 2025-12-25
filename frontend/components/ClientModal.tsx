
import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, Search, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCNPJ } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editClient?: any; // Cliente to edit (if provided, modal is in edit mode)
}

export default function ClientModal({ isOpen, onClose, onSuccess, editClient }: ClientModalProps) {
    const isEditMode = !!editClient;
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
    const [cnpjValidation, setCnpjValidation] = useState<'idle' | 'valid' | 'invalid' | 'loading'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load edit data when opening in edit mode
    useEffect(() => {
        if (isOpen && editClient) {
            setFormData({
                nome: editClient.nome || '',
                cnpj: editClient.cnpj || '',
                segmento: editClient.segmento || '',
                publico_alvo: editClient.publico_alvo || '',
                regiao: editClient.regiao || '',
                pacote_id: editClient.pacote_id?.toString() || ''
            });

            if (editClient.logo_url) {
                setLogoPreview(api.getImageUrl(editClient.logo_url));
            }

            setCnpjValidation('valid'); // Assume valid if already in DB
        }
    }, [isOpen, editClient]);

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
            setErrorMessage('CNPJ inválido. Digite os 14 dígitos.');
            setCnpjValidation('invalid');
            return;
        }

        setIsLoadingCNPJ(true);
        setCnpjValidation('loading');
        setErrorMessage('');

        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
            if (!response.ok) {
                throw new Error('CNPJ não encontrado');
            }

            const data = await response.json();

            // Auto-fill available data
            setFormData(prev => ({
                ...prev,
                nome: data.razao_social || data.nome_fantasia || prev.nome,
                segmento: data.cnae_fiscal_descricao || prev.segmento,
                regiao: data.uf || prev.regiao
            }));

            setCnpjValidation('valid');

        } catch (error) {
            console.error('Erro ao buscar CNPJ:', error);
            setErrorMessage('CNPJ não encontrado ou inválido. Verifique e tente novamente.');
            setCnpjValidation('invalid');
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
        setCnpjValidation('idle');
        setErrorMessage('');
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validações
        if (!formData.nome || formData.nome.trim().length < 3) {
            setErrorMessage('Nome da empresa deve ter pelo menos 3 caracteres');
            return;
        }

        if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
            setErrorMessage('CNPJ é obrigatório e deve ter 14 dígitos');
            setCnpjValidation('invalid');
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const payload = {
                nome: formData.nome.trim(),
                cnpj: formData.cnpj,
                segmento: formData.segmento,
                publico_alvo: formData.publico_alvo,
                regiao: formData.regiao,
                pacote_id: formData.pacote_id ? Number(formData.pacote_id) : null
            };

            let clientId: number;

            if (isEditMode) {
                // 1. Update existing client
                await api.updateCliente(editClient.id, payload);
                clientId = editClient.id;
            } else {
                // 1. Create new client
                const newClient = await api.createCliente(payload);
                clientId = newClient.id;
            }

            // 2. Upload Logo if selected
            if (selectedFile && clientId) {
                await api.uploadClientLogo(selectedFile, String(clientId));
            }

            onSuccess();
            handleClose();

        } catch (error: any) {
            console.error('Erro:', error);

            // Tratamento específico de erros
            if (error.message?.includes('CNPJ já existe') || error.message?.includes('duplicate')) {
                setErrorMessage('Este CNPJ já está cadastrado no sistema');
                setCnpjValidation('invalid');
            } else {
                setErrorMessage(error.message || 'Erro ao criar cliente. Tente novamente.');
            }
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
                {isSubmitting ? 'Salvando...' : isEditMode ? 'Atualizar Cliente' : 'Salvar Cliente'}
            </Button>
        </>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={isEditMode ? "Editar Cliente" : "Novo Cliente"}
            footer={footer}
            zIndex={70}
            maxWidth="2xl"
        >
            <form id="client-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={20} />
                        <div>
                            <p className="font-semibold text-red-900 text-sm">Erro</p>
                            <p className="text-red-700 text-sm mt-0.5">{errorMessage}</p>
                        </div>
                    </div>
                )}

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
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                    CNPJ *
                                    {cnpjValidation === 'valid' && (
                                        <span className="flex items-center gap-1 text-green-600 font-semibold text-[10px] normal-case">
                                            <CheckCircle2 size={14} />
                                            Válido
                                        </span>
                                    )}
                                    {cnpjValidation === 'invalid' && (
                                        <span className="flex items-center gap-1 text-red-600 font-semibold text-[10px] normal-case">
                                            <XCircle size={14} />
                                            Inválido
                                        </span>
                                    )}
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        value={formData.cnpj}
                                        onChange={(e) => {
                                            handleCNPJChange(e);
                                            if (cnpjValidation !== 'idle') setCnpjValidation('idle');
                                            setErrorMessage('');
                                        }}
                                        maxLength={18}
                                        className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none font-mono text-sm ${
                                            cnpjValidation === 'valid'
                                                ? 'border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 bg-green-50/30'
                                                : cnpjValidation === 'invalid'
                                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30'
                                                : 'border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10'
                                        }`}
                                        placeholder="00.000.000/0000-00"
                                    />
                                    {cnpjValidation === 'loading' && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <Loader2 className="animate-spin text-emidias-accent" size={18} />
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Button
                                type="button"
                                onClick={fetchCNPJ}
                                disabled={isLoadingCNPJ || formData.cnpj.replace(/\D/g, '').length !== 14}
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
                                minLength={3}
                                value={formData.nome}
                                onChange={(e) => {
                                    setFormData(p => ({ ...p, nome: e.target.value }));
                                    setErrorMessage('');
                                }}
                                className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none ${
                                    formData.nome.trim().length > 0 && formData.nome.trim().length < 3
                                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                        : 'border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10'
                                }`}
                                placeholder="Razão Social ou Nome Fantasia"
                            />
                            {formData.nome.trim().length > 0 && formData.nome.trim().length < 3 && (
                                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                    <AlertCircle size={12} />
                                    Mínimo 3 caracteres
                                </p>
                            )}
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
