'use client';

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { X, Upload, Loader2, Building2, Plus, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface Contato {
    id?: number;
    nome: string;
    telefone: string;
    email: string;
    observacoes: string;
}

export default function ExibidoraModal() {
    const isModalOpen = useStore((state) => state.isExibidoraModalOpen);
    const setModalOpen = useStore((state) => state.setExibidoraModalOpen);
    const editingExibidora = useStore((state) => state.editingExibidora);
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const setExibidoras = useStore((state) => state.setExibidoras);

    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Formulário
    const [nome, setNome] = useState('');
    const [cnpj, setCnpj] = useState('');
    const [razaoSocial, setRazaoSocial] = useState('');
    const [endereco, setEndereco] = useState('');
    const [observacoes, setObservacoes] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>('');
    const [contatos, setContatos] = useState<Contato[]>([]);

    // Preencher formulário ao editar
    useEffect(() => {
        if (editingExibidora && isModalOpen) {
            setNome(editingExibidora.nome || '');
            setCnpj(editingExibidora.cnpj || '');
            setRazaoSocial(editingExibidora.razao_social || '');
            setEndereco(editingExibidora.endereco || '');
            setObservacoes(editingExibidora.observacoes || '');

            // Carregar preview da logo existente
            if (editingExibidora.logo_r2_key) {
                setLogoPreview(api.getImageUrl(editingExibidora.logo_r2_key));
            }

            // Carregar contatos
            api.getContatos(editingExibidora.id).then((data: any) => {
                setContatos(data.map((c: any) => ({
                    id: c.id,
                    nome: c.nome || '',
                    telefone: c.telefone || '',
                    email: c.email || '',
                    observacoes: c.observacoes || ''
                })));
            }).catch(err => console.error('Erro ao carregar contatos:', err));
        }
    }, [editingExibidora, isModalOpen]);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file && file.type.startsWith('image/')) {
            setLogoFile(file);

            // Criar preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        multiple: false,
        maxSize: 5242880, // 5MB
    });

    const removeLogo = () => {
        setLogoFile(null);
        setLogoPreview('');
    };

    // Formatar CNPJ
    const formatCNPJ = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 14) {
            return numbers
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
        return value;
    };

    const handleCNPJChange = (value: string) => {
        const formatted = formatCNPJ(value);
        setCnpj(formatted);
    };

    // Gerenciar contatos
    const addContato = () => {
        setContatos([...contatos, { nome: '', telefone: '', email: '', observacoes: '' }]);
    };

    const removeContato = (index: number) => {
        setContatos(contatos.filter((_, i) => i !== index));
    };

    const updateContato = (index: number, field: keyof Contato, value: string) => {
        const updated = [...contatos];
        updated[index] = { ...updated[index], [field]: value };
        setContatos(updated);
    };

    // Validação
    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
        if (!cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
        if (cnpj.replace(/\D/g, '').length !== 14) {
            newErrors.cnpj = 'CNPJ inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        setIsLoading(true);
        try {
            const exibidoraData = {
                nome: nome.trim(),
                cnpj: cnpj.replace(/\D/g, ''),
                razao_social: razaoSocial.trim() || null,
                endereco: endereco.trim() || null,
                observacoes: observacoes.trim() || null,
            };

            let exibidoraId: number;

            if (editingExibidora) {
                // Atualizar exibidora existente
                await api.updateExibidora(editingExibidora.id, exibidoraData);
                exibidoraId = editingExibidora.id;
            } else {
                // Criar nova exibidora
                const newExibidora = await api.createExibidora(exibidoraData);
                exibidoraId = newExibidora.id;
            }

            // Upload de logo se houver
            if (logoFile) {
                await api.uploadExibidoraLogo(logoFile, exibidoraId.toString());
            }

            // Salvar contatos
            if (contatos.length > 0) {
                await Promise.all(
                    contatos.map(c => {
                        if (c.id) {
                            // Atualizar contato existente
                            return api.updateContato(c.id, {
                                nome: c.nome || null,
                                telefone: c.telefone || null,
                                email: c.email || null,
                                observacoes: c.observacoes || null
                            });
                        } else {
                            // Criar novo contato
                            return api.createContato({
                                id_exibidora: exibidoraId,
                                nome: c.nome || null,
                                telefone: c.telefone || null,
                                email: c.email || null,
                                observacoes: c.observacoes || null
                            });
                        }
                    })
                );
            }

            // Atualizar lista de exibidoras
            const exibidoras = await api.getExibidoras();
            setExibidoras(exibidoras);

            // Fechar modal e limpar
            handleClose();
        } catch (error: any) {
            console.error('Erro ao salvar exibidora:', error);
            setErrors({ submit: error.message || 'Erro ao salvar exibidora' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setModalOpen(false);
        setEditingExibidora(null);
        setTimeout(() => {
            // Reset form
            setNome('');
            setCnpj('');
            setRazaoSocial('');
            setEndereco('');
            setObservacoes('');
            setLogoFile(null);
            setLogoPreview('');
            setErrors({});
        }, 300);
    };

    if (!isModalOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="gradient-primary px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {editingExibidora ? 'Editar Exibidora' : 'Nova Exibidora'}
                        </h2>
                        <p className="text-white/80 text-sm mt-1">
                            Preencha os dados da exibidora
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-semibold text-emidias-primary mb-2">
                                Logo da Exibidora
                            </label>

                            {logoPreview ? (
                                <div className="relative w-full h-48 bg-gradient-to-br from-emidias-primary to-emidias-accent rounded-lg flex items-center justify-center overflow-hidden group">
                                    <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        className="w-full h-full object-contain p-4 bg-white/10"
                                    />
                                    <button
                                        onClick={removeLogo}
                                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    {...getRootProps()}
                                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${isDragActive
                                        ? 'border-emidias-accent bg-pink-50'
                                        : 'border-emidias-gray/30 hover:border-emidias-accent'
                                        }`}
                                >
                                    <input {...getInputProps()} />
                                    <Building2 className="mx-auto text-emidias-gray mb-3" size={48} />
                                    <p className="text-emidias-primary font-medium">
                                        {isDragActive ? 'Solte a logo aqui' : 'Arraste a logo ou clique para selecionar'}
                                    </p>
                                    <p className="text-gray-500 text-sm mt-1">
                                        PNG, JPG, JPEG ou WEBP (máx. 5MB)
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Nome */}
                        <div>
                            <label className="block text-sm font-semibold text-emidias-primary mb-2">
                                Nome da Exibidora <span className="text-emidias-accent">*</span>
                            </label>
                            <input
                                type="text"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                                placeholder="Ex: Empresa de Mídia Exterior"
                            />
                            {errors.nome && (
                                <p className="text-red-500 text-sm mt-1">{errors.nome}</p>
                            )}
                        </div>

                        {/* CNPJ */}
                        <div>
                            <label className="block text-sm font-semibold text-emidias-primary mb-2">
                                CNPJ <span className="text-emidias-accent">*</span>
                            </label>
                            <input
                                type="text"
                                value={cnpj}
                                onChange={(e) => handleCNPJChange(e.target.value)}
                                className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                            />
                            {errors.cnpj && (
                                <p className="text-red-500 text-sm mt-1">{errors.cnpj}</p>
                            )}
                        </div>

                        {/* Razão Social */}
                        <div>
                            <label className="block text-sm font-semibold text-emidias-primary mb-2">
                                Razão Social
                            </label>
                            <input
                                type="text"
                                value={razaoSocial}
                                onChange={(e) => setRazaoSocial(e.target.value)}
                                className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                                placeholder="Digite a razão social"
                            />
                        </div>

                        {/* Endereço de Faturamento */}
                        <div>
                            <label className="block text-sm font-semibold text-emidias-primary mb-2">
                                Endereço de Faturamento
                            </label>
                            <textarea
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition resize-none"
                                placeholder="Rua, número, bairro, cidade - UF, CEP"
                            />
                        </div>



                        {/* Observações */}
                        <div>
                            <label className="block text-sm font-semibold text-emidias-primary mb-2">
                                Observações
                            </label>
                            <textarea
                                value={observacoes}
                                onChange={(e) => setObservacoes(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition resize-none"
                                placeholder="Informações adicionais sobre a exibidora..."
                            />
                        </div>

                        {/* Contatos */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="block text-sm font-semibold text-emidias-primary">
                                    Contatos
                                </label>
                                <button
                                    type="button"
                                    onClick={addContato}
                                    className="flex items-center gap-2 px-3 py-2 text-sm bg-emidias-accent text-white rounded-lg hover:bg-[#E01A6A] transition"
                                >
                                    <Plus size={16} />
                                    Adicionar Contato
                                </button>
                            </div>

                            {contatos.length === 0 ? (
                                <p className="text-gray-500 text-sm italic">Nenhum contato cadastrado</p>
                            ) : (
                                <div className="space-y-4">
                                    {contatos.map((contato, index) => (
                                        <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Contato {index + 1}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeContato(index)}
                                                    className="text-red-500 hover:text-red-700 transition"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <input
                                                type="text"
                                                value={contato.nome}
                                                onChange={(e) => updateContato(index, 'nome', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition text-sm"
                                                placeholder="Nome da pessoa"
                                            />

                                            <div className="grid grid-cols-2 gap-3">
                                                <input
                                                    type="text"
                                                    value={contato.telefone}
                                                    onChange={(e) => updateContato(index, 'telefone', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition text-sm"
                                                    placeholder="Telefone"
                                                />
                                                <input
                                                    type="email"
                                                    value={contato.email}
                                                    onChange={(e) => updateContato(index, 'email', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition text-sm"
                                                    placeholder="E-mail"
                                                />
                                            </div>

                                            <textarea
                                                value={contato.observacoes}
                                                onChange={(e) => updateContato(index, 'observacoes', e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition resize-none text-sm"
                                                placeholder="Observações sobre este contato..."
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error de submit */}
                    {errors.submit && (
                        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-600">{errors.submit}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end gap-3">
                    <button
                        onClick={handleClose}
                        className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
                    >
                        Cancelar
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-2 bg-emidias-accent text-white rounded-lg hover:bg-[#E01A6A] hover-lift transition font-medium shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Salvando...
                            </>
                        ) : (
                            editingExibidora ? 'Salvar Alterações' : 'Criar Exibidora'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
