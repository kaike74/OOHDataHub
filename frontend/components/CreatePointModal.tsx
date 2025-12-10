'use client';

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { X, Upload, Plus, Trash2, MapPin, Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface Custo {
  produto: string; // Locação, Papel, Lona
  valor: string;
  periodo: string; // Bissemanal, Mensal, Unitário (só aparece se produto = Locação)
}

const TIPOS_OOH = [
  'Outdoor',
  'Frontlight',
  'Led',
  'Vertical',
  'Iluminado',
  'Empena',
  'Mub',
  'Painel rodoviário',
  'Abrigo'
];

const PRODUTOS_CUSTO = ['Locação', 'Papel', 'Lona'];

const PERIODOS = ['Bissemanal', 'Mensal', 'Unitário'];


export default function CreatePointModal() {
  const isModalOpen = useStore((state) => state.isModalOpen);
  const setModalOpen = useStore((state) => state.setModalOpen);
  const editingPonto = useStore((state) => state.editingPonto);
  const setEditingPonto = useStore((state) => state.setEditingPonto);
  const exibidoras = useStore((state) => state.exibidoras);
  const setPontos = useStore((state) => state.setPontos);
  const streetViewCoordinates = useStore((state) => state.streetViewCoordinates);
  const setStreetViewCoordinates = useStore((state) => state.setStreetViewCoordinates);

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Formulário
  const [codigoOoh, setCodigoOoh] = useState('');
  const [endereco, setEndereco] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [idExibidora, setIdExibidora] = useState('');
  const [medidas, setMedidas] = useState('');
  const [fluxo, setFluxo] = useState('');
  const [tipos, setTipos] = useState<string[]>([]); // Multiselect de tipos OOH
  const [observacoes, setObservacoes] = useState('');
  const [custos, setCustos] = useState<Custo[]>([{ produto: '', valor: '', periodo: '' }]);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  // Geocoding
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Preencher formulário ao editar
  useEffect(() => {
    if (editingPonto && isModalOpen) {
      setCodigoOoh(editingPonto.codigo_ooh || '');
      setEndereco(editingPonto.endereco || '');
      setLatitude(editingPonto.latitude?.toString() || '');
      setLongitude(editingPonto.longitude?.toString() || '');
      setCidade(editingPonto.cidade || '');
      setUf(editingPonto.uf || '');
      setIdExibidora(editingPonto.id_exibidora?.toString() || '');
      setMedidas(editingPonto.medidas || '');
      setFluxo(editingPonto.fluxo?.toString() || '');

      // Parse tipos se existir
      if (editingPonto.tipos) {
        setTipos(editingPonto.tipos.split(', ').filter(Boolean));
      }

      setObservacoes(editingPonto.observacoes || '');

      // Parse produtos
      if (editingPonto.produtos && editingPonto.produtos.length > 0) {
        setCustos(editingPonto.produtos.map(p => ({
          produto: p.tipo,
          valor: p.valor.toString(),
          periodo: p.periodo || ''
        })));
      }

      // Carregar previews de imagens existentes
      if (editingPonto.imagens && editingPonto.imagens.length > 0) {
        setImagesPreviews(editingPonto.imagens.map(img => api.getImageUrl(img)));
      }
    }
  }, [editingPonto, isModalOpen]);

  // Preencher coordenadas do Street View
  useEffect(() => {
    if (streetViewCoordinates && isModalOpen) {
      setLatitude(streetViewCoordinates.lat.toString());
      setLongitude(streetViewCoordinates.lng.toString());

      // Fazer geocoding reverso para obter endereço
      const reverseGeocode = async () => {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat: streetViewCoordinates.lat, lng: streetViewCoordinates.lng }
          });

          if (result.results[0]) {
            setEndereco(result.results[0].formatted_address);

            const addressComponents = result.results[0].address_components;
            const cidadeComponent = addressComponents.find(c => c.types.includes('administrative_area_level_2'));
            const ufComponent = addressComponents.find(c => c.types.includes('administrative_area_level_1'));

            if (cidadeComponent) setCidade(cidadeComponent.long_name);
            if (ufComponent) setUf(ufComponent.short_name);
          }
        } catch (error) {
          console.error('Erro no geocoding reverso:', error);
        }
      };

      reverseGeocode();
    }
  }, [streetViewCoordinates, isModalOpen]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...newFiles]);

    // Criar previews
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagesPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: true
  });

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagesPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const toggleTipo = (tipo: string) => {
    setTipos(prev =>
      prev.includes(tipo)
        ? prev.filter(t => t !== tipo)
        : [...prev, tipo]
    );
  };

  const addCusto = () => {
    setCustos([...custos, { produto: '', valor: '', periodo: '' }]);
  };

  const removeCusto = (index: number) => {
    setCustos(custos.filter((_, i) => i !== index));
  };

  const updateCusto = (index: number, field: keyof Custo, value: string) => {
    const newCustos = [...custos];

    // Format currency for valor field
    if (field === 'valor') {
      // Remove tudo exceto números
      const numbers = value.replace(/\D/g, '');

      // Converter para centavos e formatar
      if (numbers) {
        const valueInCents = parseInt(numbers);
        const formatted = (valueInCents / 100).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        });
        newCustos[index][field] = formatted;
      } else {
        newCustos[index][field] = '';
      }
    } else {
      newCustos[index][field] = value;
    }

    // Se mudou o produto e não é Locação, limpar período
    if (field === 'produto' && value !== 'Locação') {
      newCustos[index].periodo = '';
    }

    setCustos(newCustos);
  };

  // Geocoding do endereço
  const geocodeAddress = async () => {
    if (!endereco) {
      setErrors({ ...errors, endereco: 'Digite um endereço' });
      return;
    }

    setIsGeocoding(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: endereco });

      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        setLatitude(location.lat().toString());
        setLongitude(location.lng().toString());

        // Extrair cidade e UF
        const addressComponents = result.results[0].address_components;
        const cidadeComponent = addressComponents.find(c => c.types.includes('administrative_area_level_2'));
        const ufComponent = addressComponents.find(c => c.types.includes('administrative_area_level_1'));

        if (cidadeComponent) setCidade(cidadeComponent.long_name);
        if (ufComponent) setUf(ufComponent.short_name);

        setErrors({ ...errors, endereco: '' });
      } else {
        setErrors({ ...errors, endereco: 'Endereço não encontrado' });
      }
    } catch (error) {
      console.error('Erro no geocoding:', error);
      setErrors({ ...errors, endereco: 'Erro ao buscar coordenadas' });
    } finally {
      setIsGeocoding(false);
    }
  };

  // Validação
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};

    if (!codigoOoh) newErrors.codigoOoh = 'Código OOH é obrigatório';
    if (!endereco) newErrors.endereco = 'Endereço é obrigatório';
    if (!latitude || !longitude) newErrors.coordenadas = 'Coordenadas são obrigatórias';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};

    if (!idExibidora) newErrors.idExibidora = 'Exibidora é obrigatória';
    if (custos.some(c => c.produto && !c.valor)) {
      newErrors.custos = 'Preencha o valor para todos os custos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;

    setIsLoading(true);
    try {
      const pontoData = {
        codigo_ooh: codigoOoh,
        endereco,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cidade: cidade || null,
        uf: uf || null,
        id_exibidora: idExibidora ? parseInt(idExibidora) : null,
        medidas: medidas || null,
        fluxo: fluxo ? parseInt(fluxo) : null,
        tipos: tipos.length > 0 ? tipos.join(', ') : null,
        observacoes: observacoes || null,
        produtos: custos
          .filter(c => c.produto && c.valor)
          .map(c => ({
            tipo: c.produto,
            valor: parseFloat(c.valor.replace(/[^\d,]/g, '').replace(',', '.')),
            periodo: c.periodo || null
          }))
      };

      let pontoId: number;

      if (editingPonto) {
        // Atualizar ponto existente
        await api.updatePonto(editingPonto.id, pontoData);
        pontoId = editingPonto.id;
      } else {
        // Criar novo ponto
        const newPonto = await api.createPonto(pontoData);
        pontoId = newPonto.id;
      }

      // Upload de novas imagens
      if (images.length > 0) {
        await Promise.all(
          images.map((file, index) =>
            api.uploadImage(file, pontoId.toString(), index, index === 0)
          )
        );
      }

      // Atualizar lista de pontos
      const pontos = await api.getPontos();
      setPontos(pontos);

      // Fechar modal e limpar
      handleClose();
    } catch (error: any) {
      console.error('Erro ao salvar ponto:', error);
      setErrors({ submit: error.message || 'Erro ao salvar ponto' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingPonto(null);
    setStreetViewCoordinates(null);
    setTimeout(() => {
      // Reset form
      setCurrentStep(1);
      setCodigoOoh('');
      setEndereco('');
      setLatitude('');
      setLongitude('');
      setCidade('');
      setUf('');
      setIdExibidora('');
      setMedidas('');
      setFluxo('');
      setTipos([]);
      setObservacoes('');
      setCustos([{ produto: '', valor: '', periodo: '' }]);
      setImages([]);
      setImagesPreviews([]);
      setErrors({});
    }, 300);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="gradient-primary px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editingPonto ? 'Editar Ponto OOH' : 'Novo Ponto OOH'}
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Etapa {currentStep} de 2
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 h-2">
          <div
            className="bg-emidias-accent h-full transition-all duration-300"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Código OOH */}
              <div>
                <label className="block text-sm font-semibold text-emidias-primary mb-2">
                  Código OOH <span className="text-emidias-accent">*</span>
                </label>
                <input
                  type="text"
                  value={codigoOoh}
                  onChange={(e) => setCodigoOoh(e.target.value)}
                  className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                  placeholder="Ex: OOH-001"
                />
                {errors.codigoOoh && (
                  <p className="text-red-500 text-sm mt-1">{errors.codigoOoh}</p>
                )}
              </div>

              {/* Endereço com Geocoding */}
              <div>
                <label className="block text-sm font-semibold text-emidias-primary mb-2">
                  Endereço Completo <span className="text-emidias-accent">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    className="flex-1 px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                  <button
                    onClick={geocodeAddress}
                    disabled={isGeocoding}
                    className="px-4 py-3 bg-emidias-success text-white rounded-lg hover:bg-emidias-success-light transition font-medium flex items-center gap-2 disabled:opacity-50"
                  >
                    {isGeocoding ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      <MapPin size={20} />
                    )}
                    Buscar
                  </button>
                </div>
                {errors.endereco && (
                  <p className="text-red-500 text-sm mt-1">{errors.endereco}</p>
                )}
              </div>

              {/* Coordenadas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-emidias-primary mb-2">
                    Latitude <span className="text-emidias-accent">*</span>
                  </label>
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                    placeholder="-23.5505"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-emidias-primary mb-2">
                    Longitude <span className="text-emidias-accent">*</span>
                  </label>
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                    placeholder="-46.6333"
                  />
                </div>
              </div>
              {errors.coordenadas && (
                <p className="text-red-500 text-sm mt-1">{errors.coordenadas}</p>
              )}

              {/* Cidade e UF */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-emidias-primary mb-2">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                    placeholder="São Paulo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-emidias-primary mb-2">
                    UF
                  </label>
                  <input
                    type="text"
                    value={uf}
                    onChange={(e) => setUf(e.target.value.toUpperCase())}
                    className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Exibidora */}
              <div>
                <label className="block text-sm font-semibold text-emidias-primary mb-2">
                  Exibidora <span className="text-emidias-accent">*</span>
                </label>
                <div className="relative">
                  <select
                    value={idExibidora}
                    onChange={(e) => {
                      if (e.target.value === 'CREATE_NEW') {
                        // Open ExibidoraModal
                        useStore.getState().setExibidoraModalOpen(true);
                      } else {
                        setIdExibidora(e.target.value);
                      }
                    }}
                    className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition appearance-none"
                    style={{
                      backgroundImage: idExibidora && idExibidora !== 'CREATE_NEW'
                        ? `url(${api.getImageUrl(exibidoras.find(ex => ex.id.toString() === idExibidora)?.logo_r2_key || '')})`
                        : 'none',
                      backgroundSize: '32px 32px',
                      backgroundPosition: '12px center',
                      backgroundRepeat: 'no-repeat',
                      paddingLeft: idExibidora && idExibidora !== 'CREATE_NEW' ? '52px' : '16px'
                    }}
                  >
                    <option value="">Selecione...</option>
                    <option value="CREATE_NEW" className="font-semibold text-emidias-accent">
                      ➕ Criar nova exibidora
                    </option>
                    {exibidoras.map((ex) => (
                      <option
                        key={ex.id}
                        value={ex.id}
                        style={{
                          backgroundImage: ex.logo_r2_key ? `url(${api.getImageUrl(ex.logo_r2_key)})` : 'none',
                          backgroundSize: '24px 24px',
                          backgroundPosition: '8px center',
                          backgroundRepeat: 'no-repeat',
                          paddingLeft: ex.logo_r2_key ? '40px' : '12px'
                        }}
                      >
                        {ex.nome}
                      </option>
                    ))}
                  </select>
                  {/* Logo preview next to selected */}
                  {idExibidora && idExibidora !== 'CREATE_NEW' && exibidoras.find(ex => ex.id.toString() === idExibidora)?.logo_r2_key && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded overflow-hidden pointer-events-none">
                      <img
                        src={api.getImageUrl(exibidoras.find(ex => ex.id.toString() === idExibidora)?.logo_r2_key || '')}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                {errors.idExibidora && (
                  <p className="text-red-500 text-sm mt-1">{errors.idExibidora}</p>
                )}
              </div>

              {/* Medidas e Fluxo */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-emidias-primary mb-2">
                    Medidas
                  </label>
                  <input
                    type="text"
                    value={medidas}
                    onChange={(e) => setMedidas(e.target.value)}
                    className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                    placeholder="Ex: 9x3m"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-emidias-primary mb-2">
                    Fluxo (pessoas/dia)
                  </label>
                  <input
                    type="number"
                    value={fluxo}
                    onChange={(e) => setFluxo(e.target.value)}
                    className="w-full px-4 py-3 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                    placeholder="50000"
                  />
                </div>
              </div>

              {/* Tipo (Multiselect) */}
              <div>
                <label className="block text-sm font-semibold text-emidias-primary mb-2">
                  Tipo
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS_OOH.map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => toggleTipo(tipo)}
                      className={`px-3 py-2 rounded-lg border-2 transition font-medium text-sm ${tipos.includes(tipo)
                        ? 'border-emidias-accent bg-pink-50 text-emidias-accent'
                        : 'border-emidias-gray/30 hover:border-emidias-accent text-gray-700'
                        }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custos */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-semibold text-emidias-primary">
                    Custos
                  </label>
                  <button
                    type="button"
                    onClick={addCusto}
                    className="text-emidias-accent hover:text-emidias-primary text-sm font-medium flex items-center gap-1"
                  >
                    <Plus size={16} />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-3">
                  {custos.map((custo, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <select
                          value={custo.produto}
                          onChange={(e) => updateCusto(index, 'produto', e.target.value)}
                          className="px-3 py-2 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                        >
                          <option value="">Produto...</option>
                          {PRODUTOS_CUSTO.map((produto) => (
                            <option key={produto} value={produto}>
                              {produto}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={custo.valor}
                          onChange={(e) => updateCusto(index, 'valor', e.target.value)}
                          className="px-3 py-2 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                          placeholder="R$ 1.000,00"
                        />

                        {/* Período só aparece se produto = Locação */}
                        {custo.produto === 'Locação' ? (
                          <select
                            value={custo.periodo}
                            onChange={(e) => updateCusto(index, 'periodo', e.target.value)}
                            className="px-3 py-2 border border-emidias-gray/30 rounded-lg focus:ring-2 focus:ring-emidias-primary focus:border-transparent transition"
                          >
                            <option value="">Período...</option>
                            {PERIODOS.map((periodo) => (
                              <option key={periodo} value={periodo}>
                                {periodo}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="px-3 py-2 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                            N/A
                          </div>
                        )}
                      </div>

                      {custos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCusto(index)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.custos && (
                  <p className="text-red-500 text-sm mt-1">{errors.custos}</p>
                )}
              </div>

              {/* Upload de Imagens */}
              <div>
                <label className="block text-sm font-semibold text-emidias-primary mb-2">
                  Imagens
                </label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition ${isDragActive
                    ? 'border-emidias-accent bg-pink-50'
                    : 'border-emidias-gray/30 hover:border-emidias-accent'
                    }`}
                >
                  <input {...getInputProps()} />
                  <Upload className="mx-auto text-emidias-gray mb-3" size={32} />
                  <p className="text-emidias-primary font-medium">
                    {isDragActive ? 'Solte as imagens aqui' : 'Arraste imagens ou clique para selecionar'}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    PNG, JPG, JPEG ou WEBP (múltiplas imagens)
                  </p>
                </div>

                {/* Previews */}
                {imagesPreviews.length > 0 && (
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    {imagesPreviews.map((preview, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                  placeholder="Informações adicionais sobre o ponto..."
                />
              </div>
            </div>
          )}

          {/* Error de submit */}
          {errors.submit && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            {currentStep === 2 && (
              <button
                onClick={() => setCurrentStep(1)}
                className="px-6 py-2 text-emidias-primary hover:bg-gray-100 rounded-lg transition font-medium"
              >
                Voltar
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition font-medium"
            >
              Cancelar
            </button>

            {currentStep === 1 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 gradient-primary text-white rounded-lg hover-lift transition font-medium shadow-lg"
              >
                Próximo
              </button>
            ) : (
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
                  'Salvar Ponto'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
