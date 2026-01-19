import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Upload, Plus, Trash2, Phone, Building2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface Contato {
    id?: number;
    nome: string;
    telefone: string;
    email: string;
    observacoes: string;
}

interface ExibidoraFormProps {
    onSuccess: (newId: number) => void;
    onCancel: () => void;
    initialData?: any;
}

export default function ExibidoraForm({ onSuccess, onCancel, initialData }: ExibidoraFormProps) {
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
        if (initialData) {
            setNome(initialData.nome || '');
            setCnpj(initialData.cnpj || '');
            setRazaoSocial(initialData.razao_social || '');
            setEndereco(initialData.endereco || '');
            setObservacoes(initialData.observacoes || '');

            // Carregar preview da logo existente
            if (initialData.logo_r2_key) {
                setLogoPreview(api.getImageUrl(initialData.logo_r2_key));
            }

            // Carregar contatos
            if (initialData.id) {
                api.getContatos(initialData.id).then((data: any) => {
                    setContatos(data.map((c: any) => ({
                        id: c.id,
                        nome: c.nome || '',
                        telefone: c.telefone || '',
                        email: c.email || '',
                        observacoes: c.observacoes || ''
                    })));
                }).catch(err => console.error('Erro ao carregar contatos:', err));
            }
        }
    }, [initialData]);

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

    const removeLogo = (e: React.MouseEvent) => {
        e.stopPropagation();
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

    const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCNPJ(e.target.value);
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
    const validate = async () => {
        const newErrors: Record<string, string> = {};

        if (!nome.trim()) newErrors.nome = 'Nome é obrigatório';
        if (!cnpj.trim()) newErrors.cnpj = 'CNPJ é obrigatório';
        if (cnpj.replace(/\D/g, '').length !== 14) {
            newErrors.cnpj = 'CNPJ inválido';
        } else if (!initialData) {
            // Verificar se CNPJ já existe (apenas ao criar nova exibidora)
            try {
                const exibidoras = await api.getExibidoras();
                const cnpjJaExiste = exibidoras.some((ex: any) => ex.cnpj === cnpj.replace(/\D/g, ''));
                if (cnpjJaExiste) {
                    newErrors.cnpj = 'Este CNPJ já está cadastrado';
                }
            } catch (error) {
                console.error('Erro ao verificar CNPJ:', error);
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!(await validate())) return;

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

            if (initialData) {
                // Atualizar exibidora existente
                await api.updateExibidora(initialData.id, exibidoraData);
                exibidoraId = initialData.id;
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
                            return api.updateContato(c.id, {
                                nome: c.nome || null,
                                telefone: c.telefone || null,
                                email: c.email || null,
                                observacoes: c.observacoes || null
                            });
                        } else {
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

            onSuccess(exibidoraId);
        } catch (error: any) {
            console.error('Erro ao salvar exibidora:', error);
            if (error.message && error.message.includes('UNIQUE constraint failed: exibidoras.cnpj')) {
                setErrors({ cnpj: 'Este CNPJ já está cadastrado' });
            } else {
                setErrors({ submit: error.message || 'Erro ao salvar exibidora' });
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-2">
            {/* Logo Upload */}
            <div>
                <label className="block text-sm font-semibold text-emidias-gray-700 mb-2">
                    Logo da Exibidora
                </label>

                {logoPreview ? (
                    <div className="relative w-full h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center overflow-hidden group border border-gray-200">
                        <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="w-full h-full object-contain p-4 mix-blend-multiply"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={removeLogo}
                                className="rounded-full w-10 h-10 p-0"
                            >
                                <Trash2 size={18} />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={cn(
                            "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 bg-gray-50/50",
                            isDragActive
                                ? "border-emidias-accent bg-pink-50/50 ring-2 ring-emidias-accent/20"
                                : "border-gray-200 hover:border-emidias-primary/50 hover:bg-white"
                        )}
                    >
                        <input {...getInputProps()} />
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3">
                            <Upload className="text-emidias-primary" size={24} />
                        </div>
                        <p className="text-emidias-primary font-medium">
                            {isDragActive ? 'Solte a logo aqui' : 'Arraste ou clique para enviar'}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            PNG, JPG, WEBP (máx. 5MB)
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Nome (Fantasia)"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Empresa de Mídia"
                    error={errors.nome}
                    required
                />
                <Input
                    label="CNPJ"
                    value={cnpj}
                    onChange={handleCNPJChange}
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    error={errors.cnpj}
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                    label="Razão Social"
                    value={razaoSocial}
                    onChange={(e) => setRazaoSocial(e.target.value)}
                    placeholder="Razão Social Ltda"
                />
                <Input
                    label="Endereço"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    placeholder="Endereço completo"
                />
            </div>

            <Textarea
                label="Observações"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais..."
                rows={3}
            />

            {/* Contatos */}
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-emidias-gray-700 flex items-center gap-2">
                        <Phone size={16} className="text-emidias-primary" />
                        Contatos
                    </label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addContato}
                        leftIcon={<Plus size={14} />}
                        className="bg-white border-dashed border-gray-300 hover:border-emidias-accent hover:text-emidias-accent"
                    >
                        Adicionar
                    </Button>
                </div>

                {contatos.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
                        Nenhum contato cadastrado
                    </div>
                ) : (
                    <div className="space-y-4">
                        {contatos.map((contato, index) => (
                            <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm space-y-3 relative group">
                                <button
                                    type="button"
                                    onClick={() => removeContato(index)}
                                    className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <Input
                                        placeholder="Nome"
                                        value={contato.nome}
                                        onChange={(e) => updateContato(index, 'nome', e.target.value)}
                                        className="bg-gray-50/50 border-gray-200"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input
                                            placeholder="Telefone"
                                            value={contato.telefone}
                                            onChange={(e) => updateContato(index, 'telefone', e.target.value)}
                                            className="bg-gray-50/50 border-gray-200"
                                        />
                                        <Input
                                            placeholder="Email"
                                            value={contato.email}
                                            onChange={(e) => updateContato(index, 'email', e.target.value)}
                                            className="bg-gray-50/50 border-gray-200"
                                        />
                                    </div>
                                </div>
                                <Textarea
                                    placeholder="Observações do contato..."
                                    value={contato.observacoes}
                                    onChange={(e) => updateContato(index, 'observacoes', e.target.value)}
                                    rows={1}
                                    className="min-h-[40px] bg-gray-50/50 border-gray-200 resize-none text-xs"
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm animate-in zoom-in">
                    {errors.submit}
                </div>
            )}

            <div className="flex items-center justify-end gap-3 w-full pt-4 border-t border-gray-100">
                <Button variant="ghost" onClick={onCancel}>
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} isLoading={isLoading}>
                    {initialData ? 'Salvar Alterações' : 'Criar Exibidora'}
                </Button>
            </div>
        </div>
    );
}
