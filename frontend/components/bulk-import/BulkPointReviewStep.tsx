'use client';

import { useMemo } from 'react';
import { useBulkImportStore, type BulkPoint } from '@/stores/useBulkImportStore';
import { ChevronLeft, ChevronRight, Check, Upload, Plus, Trash2, Users, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useDropzone } from 'react-dropzone';
import { useCallback, useState } from 'react';

const TIPOS_OOH = [
    'Outdoor', 'Indoor', 'Frontlight', 'Led', 'Vertical',
    'Iluminado', 'Empena', 'Mub', 'Painel rodoviário', 'Abrigo'
];

interface Custo {
    produto: string;
    valor: string;
    periodo: string;
}

export default function BulkPointReviewStep() {
    const session = useBulkImportStore((state) => state.session);
    const updatePoint = useBulkImportStore((state) => state.updatePoint);
    const navigateToPoint = useBulkImportStore((state) => state.navigateToPoint);
    const addPointImage = useBulkImportStore((state) => state.addPointImage);
    const removePointImage = useBulkImportStore((state) => state.removePointImage);
    const setCurrentStep = useBulkImportStore((state) => state.setCurrentStep);

    if (!session || !session.pontos || session.pontos.length === 0) {
        return (
            <div className="flex items-center justify-center h-[500px]">
                <p className="text-gray-400">Nenhum ponto para revisar</p>
            </div>
        );
    }

    const currentIndex = session.currentPointIndex;
    const currentPoint = session.pontos[currentIndex];
    const totalPoints = session.pontos.length;

    // Calculate status
    const hasImages = (currentPoint.imagens?.length || 0) > 0;
    const hasErrors = currentPoint.validationErrors?.some(e => e.severity === 'error') || false;
    const hasWarnings = currentPoint.validationErrors?.some(e => e.severity === 'warning') || false;

    const borderColor = hasErrors
        ? 'border-red-500'
        : hasImages && !hasWarnings
            ? 'border-green-500'
            : 'border-yellow-500';

    // Local state for form fields
    const [tipos, setTipos] = useState<string[]>(
        currentPoint.tipos ? currentPoint.tipos.split(',').map(t => t.trim()) : []
    );
    const [medidaUnit, setMedidaUnit] = useState<'M' | 'Px'>('M');
    const [medidaWidth, setMedidaWidth] = useState(currentPoint.medidas?.split('x')[0] || '');
    const [medidaHeight, setMedidaHeight] = useState(currentPoint.medidas?.split('x')[1]?.split(' ')[0] || '');
    const [custos, setCustos] = useState<Custo[]>(
        currentPoint.produtos?.map(p => ({
            produto: p.tipo,
            valor: `R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            periodo: p.periodo || ''
        })) || [{ produto: '', valor: '', periodo: '' }]
    );

    // Image upload
    const onDrop = useCallback((acceptedFiles: File[]) => {
        acceptedFiles.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                addPointImage(currentIndex, file, e.target?.result as string);
            };
            reader.readAsDataURL(file);
        });
    }, [currentIndex, addPointImage]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
        multiple: true
    });

    const toggleTipo = (tipo: string) => {
        const newTipos = tipos.includes(tipo)
            ? tipos.filter(t => t !== tipo)
            : [...tipos, tipo];
        setTipos(newTipos);
        updatePoint(currentIndex, { tipos: newTipos.join(', ') });
    };

    const updateCusto = (index: number, field: keyof Custo, value: string) => {
        const newCustos = [...custos];
        if (field === 'valor') {
            const numbers = value.replace(/\D/g, '');
            if (numbers.length > 0) {
                const numValue = parseInt(numbers, 10);
                const reais = Math.floor(numValue / 100);
                const centavos = numValue % 100;
                newCustos[index][field] = `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
            } else {
                newCustos[index][field] = '';
            }
        } else {
            newCustos[index][field] = value;
        }

        if (field === 'produto' && value !== 'Locação') {
            newCustos[index].periodo = '';
        }

        setCustos(newCustos);

        // Update point with produtos
        const produtos = newCustos
            .filter(c => c.produto && c.valor)
            .map(c => ({
                tipo: c.produto,
                valor: parseFloat(c.valor.replace(/[^\d,]/g, '').replace(',', '.')),
                periodo: c.periodo || undefined
            }));
        updatePoint(currentIndex, { produtos });
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            navigateToPoint(currentIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < totalPoints - 1) {
            navigateToPoint(currentIndex + 1);
        } else {
            // Last point - move to processing step
            setCurrentStep(4);
        }
    };

    const isLastPoint = currentIndex === totalPoints - 1;

    return (
        <div className={cn('border-4 rounded-2xl p-6 space-y-6', borderColor)}>
            {/* Header with status */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">
                        {currentPoint.codigo_ooh}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{currentPoint.endereco}</p>
                </div>
                <div className="text-right">
                    <div className={cn(
                        'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium',
                        hasErrors && 'bg-red-100 text-red-700',
                        !hasErrors && hasImages && 'bg-green-100 text-green-700',
                        !hasErrors && !hasImages && 'bg-yellow-100 text-yellow-700'
                    )}>
                        {hasErrors && '❌ Com erros'}
                        {!hasErrors && hasImages && '✅ Completo'}
                        {!hasErrors && !hasImages && '⚠️ Sem imagem'}
                    </div>
                </div>
            </div>

            {/* Images */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fotos do Ponto
                </label>
                {currentPoint.imagens && currentPoint.imagens.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                        {currentPoint.imagens.map((img, idx) => (
                            <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                                <img
                                    src={img.preview}
                                    alt={`Preview ${idx}`}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        onClick={() => removePointImage(currentIndex, idx)}
                                        className="rounded-full w-8 h-8 p-0"
                                    >
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        <div {...getRootProps()} className="flex items-center justify-center aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-emidias-primary hover:bg-gray-50 cursor-pointer transition-all">
                            <input {...getInputProps()} />
                            <Plus className="text-gray-300 hover:text-emidias-primary" />
                        </div>
                    </div>
                ) : (
                    <div
                        {...getRootProps()}
                        className={cn(
                            'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all',
                            isDragActive ? 'border-emidias-accent bg-pink-50/50' : 'border-gray-200 hover:border-emidias-primary/50'
                        )}
                    >
                        <input {...getInputProps()} />
                        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
                        <p className="text-sm text-gray-600">
                            {isDragActive ? 'Solte as fotos aqui' : 'Arraste fotos ou clique para enviar'}
                        </p>
                    </div>
                )}
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
                <Input
                    label="Cidade"
                    value={currentPoint.cidade || ''}
                    onChange={(e) => updatePoint(currentIndex, { cidade: e.target.value })}
                />
                <Input
                    label="UF"
                    value={currentPoint.uf || ''}
                    onChange={(e) => updatePoint(currentIndex, { uf: e.target.value.toUpperCase() })}
                    maxLength={2}
                />
                <Input
                    label="Medidas (Largura)"
                    value={medidaWidth}
                    onChange={(e) => {
                        setMedidaWidth(e.target.value);
                        updatePoint(currentIndex, { medidas: `${e.target.value}x${medidaHeight} ${medidaUnit}` });
                    }}
                />
                <Input
                    label="Medidas (Altura)"
                    value={medidaHeight}
                    onChange={(e) => {
                        setMedidaHeight(e.target.value);
                        updatePoint(currentIndex, { medidas: `${medidaWidth}x${e.target.value} ${medidaUnit}` });
                    }}
                />
                <Input
                    label="Fluxo Diário"
                    value={currentPoint.fluxo?.toString() || ''}
                    onChange={(e) => updatePoint(currentIndex, { fluxo: parseInt(e.target.value) || undefined })}
                    type="number"
                    icon={<Users size={16} />}
                />
            </div>

            {/* Tipos */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tipos de Painel
                </label>
                <div className="flex flex-wrap gap-2">
                    {TIPOS_OOH.map(tipo => (
                        <button
                            key={tipo}
                            type="button"
                            onClick={() => toggleTipo(tipo)}
                            className={cn(
                                'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                                tipos.includes(tipo)
                                    ? 'bg-emidias-primary text-white border-emidias-primary'
                                    : 'bg-white text-gray-600 border-gray-200 hover:border-emidias-primary'
                            )}
                        >
                            {tipo}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products */}
            <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <DollarSign size={16} className="text-emidias-accent" />
                        Tabela de Preços
                    </label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCustos([...custos, { produto: '', valor: '', periodo: '' }])}
                        leftIcon={<Plus size={14} />}
                    >
                        Adicionar
                    </Button>
                </div>
                <div className="space-y-3">
                    {custos.map((custo, index) => (
                        <div key={index} className="flex gap-3 items-start">
                            <div className="flex-1 grid grid-cols-3 gap-3">
                                <select
                                    value={custo.produto}
                                    onChange={(e) => updateCusto(index, 'produto', e.target.value)}
                                    className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Locação">Locação</option>
                                    <option value="Papel">Papel</option>
                                    <option value="Lona">Lona</option>
                                </select>
                                <Input
                                    value={custo.valor}
                                    onChange={(e) => updateCusto(index, 'valor', e.target.value)}
                                    placeholder="R$ 0,00"
                                    className="h-10"
                                />
                                {custo.produto === 'Locação' ? (
                                    <select
                                        value={custo.periodo}
                                        onChange={(e) => updateCusto(index, 'periodo', e.target.value)}
                                        className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                    >
                                        <option value="">Período...</option>
                                        <option value="Bissemanal">Bissemanal</option>
                                        <option value="Mensal">Mensal</option>
                                    </select>
                                ) : (
                                    <div className="w-full h-10 bg-gray-100 rounded-lg" />
                                )}
                            </div>
                            <Button
                                type="button"
                                variant="danger"
                                size="icon"
                                onClick={() => setCustos(custos.filter((_, i) => i !== index))}
                                className="h-10 w-10"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Observações */}
            <Textarea
                label="Observações"
                value={currentPoint.observacoes || ''}
                onChange={(e) => updatePoint(currentIndex, { observacoes: e.target.value })}
                rows={3}
            />

            {/* Navigation Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600 font-medium">
                    Ponto {currentIndex + 1} de {totalPoints}
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        leftIcon={<ChevronLeft size={16} />}
                    >
                        Anterior
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleNext}
                        rightIcon={isLastPoint ? <Check size={16} /> : <ChevronRight size={16} />}
                    >
                        {isLastPoint ? 'Finalizar Cadastro' : 'Próximo'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
