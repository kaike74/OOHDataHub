import { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCNPJ } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import LocationAutocomplete from './LocationAutocomplete';

interface ClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editClient?: any;
}

export default function ClientModal({ isOpen, onClose, onSuccess, editClient }: ClientModalProps) {
    const isEditMode = !!editClient;
    const [formData, setFormData] = useState({
        nome: '',
        cnpj: '',
        segmento: '',
        publico_alvo: '',
        regioes_atuacao: [] as string[],
        cidade: '',
        uf: '',
        pacote_id: ''
    });

    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingCNPJ, setIsLoadingCNPJ] = useState(false);
    const [cnpjValidation, setCnpjValidation] = useState<'idle' | 'valid' | 'invalid' | 'loading'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && editClient) {
            let parsedRegioes = [];
            try {
                parsedRegioes = editClient.regioes_atuacao ? JSON.parse(editClient.regioes_atuacao) : [];
            } catch (e) {
                // If it's a simple string (legacy), wrap in array
                parsedRegioes = editClient.regioes_atuacao ? [editClient.regioes_atuacao] : [];
            }

            setFormData({
                nome: editClient.nome || '',
                cnpj: editClient.cnpj || '',
                segmento: editClient.segmento || '',
                publico_alvo: editClient.publico_alvo || '',
                regioes_atuacao: parsedRegioes,
                cidade: editClient.cidade || '',
                uf: editClient.uf || '',
                pacote_id: editClient.pacote_id?.toString() || ''
            });

            if (editClient.logo_url) {
                setLogoPreview(api.getImageUrl(editClient.logo_url));
            }

            setCnpjValidation('valid');
        } else if (isOpen) {
            // Reset form on open new
            setFormData({
                nome: '',
                cnpj: '',
                segmento: '',
                publico_alvo: '',
                regioes_atuacao: [],
                cidade: '',
                uf: '',
                pacote_id: ''
            });
            setLogoPreview(null);
            setSelectedFile(null);
            setCnpjValidation('idle');
            setErrorMessage('');
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
        const formatted = formatCNPJ(value);
        setFormData(prev => ({ ...prev, cnpj: formatted }));

        if (cnpjValidation !== 'idle') setCnpjValidation('idle');
        setErrorMessage('');

        const cleanCNPJ = formatted.replace(/\D/g, '');
        if (cleanCNPJ.length === 14) {
            fetchCNPJ(cleanCNPJ);
        }
    };

    const fetchCNPJ = async (cleanCNPJ: string) => {
        setIsLoadingCNPJ(true);
        setCnpjValidation('loading');
        setErrorMessage('');

        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
            if (!response.ok) {
                throw new Error('CNPJ não encontrado');
            }

            const data = await response.json();

            setFormData(prev => ({
                ...prev,
                nome: prev.nome || data.razao_social || data.nome_fantasia, // Keep existing if typed, or use API
                segmento: prev.segmento || data.cnae_fiscal_descricao,
                cidade: data.municipio,
                uf: data.uf
            }));

            setCnpjValidation('valid');

        } catch (error) {
            console.error('Erro ao buscar CNPJ:', error);
            // Don't block user, just show warning
            // setErrorMessage('CNPJ não encontrado base. Verifique os dados.'); 
            // setCnpjValidation('invalid'); 
            // actually better to just let them type if API fails?
            // User requested to remove button, so auto-search shouldn't be too intrusive with errors.
            setCnpjValidation('idle'); // Just reset to allow manual entry without red errors everywhere if API fails
        } finally {
            setIsLoadingCNPJ(false);
        }
    };

    const handleClose = () => {
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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
                regioes_atuacao: JSON.stringify(formData.regioes_atuacao),
                cidade: formData.cidade,
                uf: formData.uf,
                pacote_id: formData.pacote_id ? Number(formData.pacote_id) : null
            };

            let clientId: number;

            if (isEditMode) {
                await api.updateCliente(editClient.id, payload);
                clientId = editClient.id;
            } else {
                const newClient = await api.createCliente(payload);
                clientId = newClient.id;
            }

            if (selectedFile && clientId) {
                await api.uploadClientLogo(selectedFile, String(clientId));
            }

            onSuccess();
            handleClose();

        } catch (error: any) {
            console.error('Erro:', error);
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
                className="shadow-lg shadow-plura-accent/20"
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
                            className="w-28 h-28 rounded-xl bg-gray-50 border-2 border-dashed border-gray-300 flex items-center justify-center relative overflow-hidden group hover:border-plura-accent hover:bg-plura-accent/5 transition-all cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {logoPreview ? (
                                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center text-gray-400 group-hover:text-plura-accent">
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
                        <div className="space-y-1">
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
                                    onChange={handleCNPJChange}
                                    maxLength={18}
                                    className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none font-mono text-sm ${cnpjValidation === 'valid'
                                            ? 'border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 bg-green-50/30'
                                            : cnpjValidation === 'invalid'
                                                ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 bg-red-50/30'
                                                : 'border-gray-200 focus:border-plura-accent focus:ring-4 focus:ring-plura-accent/10'
                                        }`}
                                    placeholder="00.000.000/0000-00"
                                />
                                {cnpjValidation === 'loading' && (
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                        <Loader2 className="animate-spin text-plura-accent" size={18} />
                                    </div>
                                )}
                            </div>
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
                                className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none ${formData.nome.trim().length > 0 && formData.nome.trim().length < 3
                                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                                        : 'border-gray-200 focus:border-plura-accent focus:ring-4 focus:ring-plura-accent/10'
                                    }`}
                                placeholder="Razão Social ou Nome Fantasia"
                            />
                        </div>
                    </div>
                </div>

                {/* City and State */}
                <div className="grid grid-cols-[1fr_80px] gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Cidade</label>
                        <input
                            type="text"
                            value={formData.cidade}
                            onChange={(e) => setFormData(p => ({ ...p, cidade: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-plura-accent focus:ring-4 focus:ring-plura-accent/10 transition-all outline-none bg-gray-50 text-gray-600 cursor-not-allowed" // Styled as read-only suggestion but editable if user wants potentially? User said "automaticamente", usually implies read-only sync, but safer to allow edit if API wrong. But bg-gray-50 suggests read-only. Let's make it editable but styled normally? Or keep as is.
                            placeholder="Cidade"
                        // readOnly // User request: "dois campos de localização distintos um é a localização que tem no cnpj do cliente UF/Cidade". It prevents editing if I set readOnly. Usually better to allow correction.
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">UF</label>
                        <input
                            type="text"
                            value={formData.uf}
                            onChange={(e) => setFormData(p => ({ ...p, uf: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-plura-accent focus:ring-4 focus:ring-plura-accent/10 transition-all outline-none text-center bg-gray-50 text-gray-600 cursor-not-allowed"
                            placeholder="UF"
                            maxLength={2}
                        //  readOnly
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Segmento</label>
                        <select
                            value={formData.segmento}
                            onChange={(e) => setFormData(p => ({ ...p, segmento: e.target.value }))}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-plura-accent focus:ring-4 focus:ring-plura-accent/10 transition-all outline-none bg-white"
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
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Regiões de Atuação</label>
                        <LocationAutocomplete
                            value={formData.regioes_atuacao}
                            onChange={(vals) => setFormData(p => ({ ...p, regioes_atuacao: vals }))}
                            placeholder="Ex: São Paulo, Zona Sul..."
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Público-Alvo</label>
                    <textarea
                        value={formData.publico_alvo}
                        onChange={(e) => setFormData(p => ({ ...p, publico_alvo: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-plura-accent focus:ring-4 focus:ring-plura-accent/10 transition-all outline-none resize-none h-20"
                        placeholder="Descreva o público-alvo principal..."
                    />
                </div>
            </form>
        </Modal>
    );
}
