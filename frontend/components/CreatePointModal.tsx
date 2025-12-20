'use client';

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { X, Upload, Plus, Trash2, MapPin, Loader2, Image as ImageIcon, Ruler, Users, DollarSign, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

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

export default function CreatePointModal() {
  const isModalOpen = useStore((state) => state.isModalOpen);
  const setModalOpen = useStore((state) => state.setModalOpen);
  const editingPonto = useStore((state) => state.editingPonto);
  const setEditingPonto = useStore((state) => state.setEditingPonto);
  const exibidoras = useStore((state) => state.exibidoras);
  const setPontos = useStore((state) => state.setPontos);
  const streetViewCoordinates = useStore((state) => state.streetViewCoordinates);
  const setStreetViewCoordinates = useStore((state) => state.setStreetViewCoordinates);
  const isExibidoraModalOpen = useStore((state) => state.isExibidoraModalOpen);

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
  const [pais, setPais] = useState('');
  const [idExibidora, setIdExibidora] = useState('');
  const [medidas, setMedidas] = useState('');
  const [fluxo, setFluxo] = useState('');
  const [tipos, setTipos] = useState<string[]>([]); // Multiselect de tipos OOH
  const [observacoes, setObservacoes] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [custos, setCustos] = useState<Custo[]>([{ produto: '', valor: '', periodo: '' }]);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  // Geocoding
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isFetchingReferencia, setIsFetchingReferencia] = useState(false);

  // Preencher formulário ao editar
  useEffect(() => {
    if (editingPonto && isModalOpen) {
      setCodigoOoh(editingPonto.codigo_ooh || '');
      setEndereco(editingPonto.endereco || '');
      setLatitude(editingPonto.latitude?.toString() || '');
      setLongitude(editingPonto.longitude?.toString() || '');
      setCidade(editingPonto.cidade || '');
      setUf(editingPonto.uf || '');
      setPais(editingPonto.pais || 'Brasil');
      setIdExibidora(editingPonto.id_exibidora?.toString() || '');
      setMedidas(editingPonto.medidas || '');
      setFluxo(editingPonto.fluxo?.toString() || '');

      // Parse tipos se existir
      if (editingPonto.tipo) {
        const tiposArray = editingPonto.tipo.split(',').map(t => t.trim()).filter(Boolean);
        setTipos(tiposArray);
      } else if (editingPonto.tipos) {
        const tiposArray = editingPonto.tipos.split(',').map(t => t.trim()).filter(Boolean);
        setTipos(tiposArray);
      } else {
        setTipos([]);
      }

      setObservacoes(editingPonto.observacoes || '');
      setPontoReferencia(editingPonto.ponto_referencia || '');

      // Parse produtos com formatação
      if (editingPonto.produtos && editingPonto.produtos.length > 0) {
        setCustos(editingPonto.produtos.map(p => {
          const reais = Math.floor(p.valor);
          const centavos = Math.round((p.valor - reais) * 100);
          const valorFormatado = `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;

          return {
            produto: p.tipo,
            valor: valorFormatado,
            periodo: p.periodo || ''
          };
        }));
      } else {
        setCustos([{ produto: '', valor: '', periodo: '' }]);
      }

      // Carregar previews de imagens existentes
      if (editingPonto.imagens && editingPonto.imagens.length > 0) {
        setImagesPreviews(editingPonto.imagens.map(img => api.getImageUrl(img)));
      } else {
        setImagesPreviews([]);
      }

      setImages([]);
    }
  }, [editingPonto, isModalOpen]);

  // Preencher coordenadas do Street View
  useEffect(() => {
    if (streetViewCoordinates && isModalOpen) {
      setLatitude(streetViewCoordinates.lat.toString());
      setLongitude(streetViewCoordinates.lng.toString());

      const reverseGeocode = async () => {
        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({
            location: { lat: streetViewCoordinates.lat, lng: streetViewCoordinates.lng }
          });

          if (result.results[0]) {
            setEndereco(result.results[0].formatted_address);

            const addressComponents = result.results[0].address_components;
            const cidadeComponent = addressComponents.find(c => c.types.includes('locality')) ||
              addressComponents.find(c => c.types.includes('administrative_area_level_2'));
            const ufComponent = addressComponents.find(c => c.types.includes('administrative_area_level_1'));
            const paisComponent = addressComponents.find(c => c.types.includes('country'));

            if (cidadeComponent) setCidade(cidadeComponent.long_name);
            if (ufComponent) setUf(ufComponent.short_name);
            if (paisComponent) setPais(paisComponent.long_name);

            fetchPontoReferencia(streetViewCoordinates.lat, streetViewCoordinates.lng);
          }
        } catch (error) {
          console.error('Erro no geocoding reverso:', error);
        }
      };

      reverseGeocode();
    }
  }, [streetViewCoordinates, isModalOpen]);

  // Selecionar automaticamente a exibidora recém-criada
  useEffect(() => {
    if (!isExibidoraModalOpen && isModalOpen && exibidoras.length > 0 && !idExibidora) {
      const latestExibidora = exibidoras[exibidoras.length - 1];
      if (latestExibidora) {
        setIdExibidora(latestExibidora.id.toString());
      }
    }
  }, [isExibidoraModalOpen, exibidoras, isModalOpen, idExibidora]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.filter(file => file.type.startsWith('image/'));
    setImages(prev => [...prev, ...newFiles]);
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
    if (field === 'valor') {
      const numbers = value.replace(/\D/g, '');
      if (numbers.length > 0) {
        const numValue = parseInt(numbers, 10);
        const reais = Math.floor(numValue / 100);
        const centavos = numValue % 100;
        const formatted = `R$ ${reais.toLocaleString('pt-BR')},${centavos.toString().padStart(2, '0')}`;
        newCustos[index][field] = formatted;
      } else {
        newCustos[index][field] = '';
      }
    } else if (field === 'produto') {
      const produtoJaExiste = custos.some((c, i) => i !== index && c.produto === value && value !== '');
      if (produtoJaExiste) {
        setErrors({ ...errors, custos: `Produto "${value}" já foi adicionado` });
        return;
      } else {
        if (errors.custos) {
          const { custos: _, ...rest } = errors;
          setErrors(rest);
        }
      }
      newCustos[index][field] = value;
    } else {
      newCustos[index][field] = value;
    }

    if (field === 'produto' && value !== 'Locação') {
      newCustos[index].periodo = '';
    }

    setCustos(newCustos);
  };

  const fetchPontoReferencia = async (lat: number, lng: number) => {
    setIsFetchingReferencia(true);
    try {
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      const location = new google.maps.LatLng(lat, lng);

      service.nearbySearch(
        {
          location,
          radius: 500,
          rankBy: google.maps.places.RankBy.PROMINENCE
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
            const relevantTypes = ['shopping_mall', 'supermarket', 'hospital', 'school', 'university', 'park', 'stadium', 'transit_station'];
            const relevantPlaces = results.filter(place =>
              place.types?.some(type => relevantTypes.includes(type))
            ).slice(0, 3);

            const partes: string[] = [];

            if (relevantPlaces.length > 0) {
              const mainPlace = relevantPlaces[0];
              partes.push(`Próximo a: ${mainPlace.name}`);
              if (relevantPlaces.length > 1) {
                partes.push(`Região: ${relevantPlaces.slice(1).map(p => p.name).join(', ')}`);
              }
            }

            const geocoder = new google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (geoResults, geoStatus) => {
              if (geoStatus === 'OK' && geoResults && geoResults[0]) {
                const addressComponents = geoResults[0].address_components;
                const route = addressComponents.find(c => c.types.includes('route'));
                if (route) partes.unshift(`Cruzamento: ${route.long_name}`);
                setPontoReferencia(partes.join('\n'));
              } else if (partes.length > 0) {
                setPontoReferencia(partes.join('\n'));
              }
              setIsFetchingReferencia(false);
            });
          } else {
            setIsFetchingReferencia(false);
          }
        }
      );
    } catch (error) {
      console.error('Erro ao buscar ponto de referência:', error);
      setIsFetchingReferencia(false);
    }
  };

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

        const addressComponents = result.results[0].address_components;
        const cidadeComponent = addressComponents.find(c => c.types.includes('locality')) ||
          addressComponents.find(c => c.types.includes('administrative_area_level_2'));
        const ufComponent = addressComponents.find(c => c.types.includes('administrative_area_level_1'));
        const paisComponent = addressComponents.find(c => c.types.includes('country'));

        if (cidadeComponent) setCidade(cidadeComponent.long_name);
        if (ufComponent) setUf(ufComponent.short_name);
        if (paisComponent) setPais(paisComponent.long_name);

        setErrors({ ...errors, endereco: '' });
        fetchPontoReferencia(location.lat(), location.lng());
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
        pais: pais || 'Brasil',
        id_exibidora: idExibidora ? parseInt(idExibidora) : null,
        medidas: medidas || null,
        fluxo: fluxo ? parseInt(fluxo) : null,
        tipos: tipos.length > 0 ? tipos.join(', ') : null,
        observacoes: observacoes || null,
        ponto_referencia: pontoReferencia || null,
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
        await api.updatePonto(editingPonto.id, pontoData);
        pontoId = editingPonto.id;
      } else {
        const newPonto = await api.createPonto(pontoData);
        pontoId = newPonto.id;
      }

      if (images.length > 0) {
        await Promise.all(
          images.map((file, index) =>
            api.uploadImage(file, pontoId.toString(), index, index === 0)
          )
        );
      }

      const pontos = await api.getPontos();
      setPontos(pontos);
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
      setCurrentStep(1);
      setCodigoOoh('');
      setEndereco('');
      setLatitude('');
      setLongitude('');
      setCidade('');
      setUf('');
      setPais('');
      setIdExibidora('');
      setMedidas('');
      setFluxo('');
      setTipos([]);
      setObservacoes('');
      setPontoReferencia('');
      setCustos([{ produto: '', valor: '', periodo: '' }]);
      setImages([]);
      setImagesPreviews([]);
      setErrors({});
    }, 300);
  };

  const handleIdExibidoraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'CREATE_NEW') {
      useStore.getState().setExibidoraModalOpen(true);
      if (idExibidora) {
        setTimeout(() => setIdExibidora(idExibidora), 0);
      }
    } else {
      setIdExibidora(e.target.value);
    }
  };

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2">
          <MapPin size={24} />
          {editingPonto ? 'Editar Ponto OOH' : 'Novo Ponto OOH'}
        </div>
      }
      maxWidth="4xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-sm text-gray-500 font-medium">
            Etapa {currentStep} de 2
          </div>
          <div className="flex gap-3">
            {currentStep === 1 ? (
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
            ) : (
              <Button variant="outline" onClick={() => setCurrentStep(1)} leftIcon={<ArrowLeft size={16} />}>
                Voltar
              </Button>
            )}

            {currentStep === 1 ? (
              <Button onClick={handleNext} rightIcon={<ArrowRight size={16} />}>
                Próximo
              </Button>
            ) : (
              <Button onClick={handleSubmit} isLoading={isLoading} rightIcon={<Check size={16} />}>
                {editingPonto ? 'Salvar Alterações' : 'Criar Ponto'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="relative h-1 bg-gray-100 rounded-full mb-6 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-emidias-primary transition-all duration-300 ease-out"
            style={{ width: `${(currentStep / 2) * 100}%` }}
          />
        </div>

        {/* Form Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Imagens Dropzone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-emidias-gray-700 mb-2">
                    Fotos do Ponto
                  </label>

                  {imagesPreviews.length > 0 ? (
                    <div className="grid grid-cols-4 gap-4">
                      {imagesPreviews.map((preview, index) => (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                          <img
                            src={preview}
                            alt={`Preview ${index}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => removeImage(index)}
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
                        "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 bg-gray-50/50",
                        isDragActive
                          ? "border-emidias-accent bg-pink-50/50 ring-2 ring-emidias-accent/20"
                          : "border-gray-200 hover:border-emidias-primary/50 hover:bg-white"
                      )}
                    >
                      <input {...getInputProps()} />
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="text-emidias-primary" size={24} />
                      </div>
                      <p className="text-emidias-primary font-medium">
                        {isDragActive ? 'Solte as fotos aqui' : 'Arraste fotos ou clique para enviar'}
                      </p>
                      <p className="text-gray-400 text-xs mt-1">
                        PNG, JPG, WEBP (máx. 5MB)
                      </p>
                    </div>
                  )}
                </div>

                <Input
                  label="Código OOH"
                  placeholder="Ex: OOH-001"
                  value={codigoOoh}
                  onChange={(e) => setCodigoOoh(e.target.value)}
                  error={errors.codigoOoh}
                  required
                />

                {/* Endereço com botão de busca */}
                <div className="md:col-span-2">
                  <div className="flex gap-2 items-end">
                    <Input
                      label="Endereço Completo"
                      placeholder="Rua, número, bairro, cidade - UF"
                      value={endereco}
                      onChange={(e) => setEndereco(e.target.value)}
                      error={errors.endereco}
                      className="flex-1"
                      required
                    />
                    <Button
                      onClick={geocodeAddress}
                      disabled={isGeocoding}
                      className="mb-[2px] h-[46px]" // Alinhamento visual com input
                      leftIcon={isGeocoding ? undefined : <MapPin size={18} />}
                    >
                      {isGeocoding ? <Loader2 className="animate-spin" size={18} /> : 'Buscar'}
                    </Button>
                  </div>
                </div>

                <Input
                  label="Latitude"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="-23.5505"
                  required
                />
                <Input
                  label="Longitude"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-46.6333"
                  required
                  error={errors.coordenadas}
                />

                <div className="grid grid-cols-3 gap-4 md:col-span-2">
                  <Input label="Cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} />
                  <Input label="UF" value={uf} onChange={(e) => setUf(e.target.value.toUpperCase())} maxLength={2} />
                  <Input label="País" value={pais} onChange={(e) => setPais(e.target.value)} />
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Ponto de Referência"
                    value={pontoReferencia}
                    onChange={(e) => setPontoReferencia(e.target.value)}
                    placeholder="Próximo ao Shopping..."
                    rows={2}
                  />
                  {isFetchingReferencia && (
                    <p className="text-xs text-emidias-accent mt-1 flex items-center gap-1 animate-pulse">
                      <Loader2 size={10} className="animate-spin" />
                      Buscando referências automáticas...
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
              {/* Step 2 Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-emidias-gray-700 mb-2">
                    Exibidora <span className="text-emidias-accent">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={idExibidora}
                      onChange={handleIdExibidoraChange}
                      className={cn(
                        "w-full h-[46px] rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emidias-primary/20 focus-visible:border-emidias-primary transition-all appearance-none cursor-pointer",
                        errors.idExibidora && "border-emidias-danger"
                      )}
                      // Custom style for icon padding if selected
                      style={{
                        paddingLeft: idExibidora && idExibidora !== 'CREATE_NEW' && exibidoras.find(ex => ex.id.toString() === idExibidora)?.logo_r2_key ? '52px' : '16px'
                      }}
                    >
                      <option value="">Selecione uma exibidora</option>
                      <option value="CREATE_NEW" className="font-semibold text-emidias-primary">+ Cadastrar Nova Exibidora</option>
                      {exibidoras.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.nome}</option>
                      ))}
                    </select>

                    {/* Selected Logo Preview */}
                    {idExibidora && idExibidora !== 'CREATE_NEW' && exibidoras.find(ex => ex.id.toString() === idExibidora)?.logo_r2_key && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded overflow-hidden pointer-events-none bg-white border border-gray-100 p-0.5">
                        <img
                          src={api.getImageUrl(exibidoras.find(ex => ex.id.toString() === idExibidora)?.logo_r2_key || '')}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                  </div>
                  {errors.idExibidora && <p className="text-xs text-red-500 mt-1">{errors.idExibidora}</p>}
                </div>

                <Input
                  label="Medidas"
                  value={medidas}
                  onChange={(e) => setMedidas(e.target.value)}
                  placeholder="Ex: 9x3m"
                  icon={<Ruler size={16} />}
                />

                <Input
                  label="Fluxo Diário"
                  value={fluxo}
                  onChange={(e) => setFluxo(e.target.value)}
                  placeholder="50000"
                  type="number"
                  icon={<Users size={16} />}
                />

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-emidias-gray-700 mb-2">
                    Tipos de Painel
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIPOS_OOH.map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => toggleTipo(tipo)}
                        className={cn(
                          "px-4 py-2 rounded-lg text-sm font-medium transition-all border",
                          tipos.includes(tipo)
                            ? "bg-emidias-primary text-white border-emidias-primary shadow-md shadow-emidias-primary/20"
                            : "bg-white text-gray-600 border-gray-200 hover:border-emidias-primary hover:text-emidias-primary"
                        )}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tabela de Preços Dinâmica */}
                <div className="md:col-span-2 bg-gray-50/50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-sm font-semibold text-emidias-gray-700 flex items-center gap-2">
                      <DollarSign size={16} className="text-emidias-accent" />
                      Tabela de Preços (Estimativa)
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addCusto}
                      leftIcon={<Plus size={14} />}
                      className="bg-white"
                    >
                      Adicionar
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {custos.map((custo, index) => (
                      <div key={index} className="flex gap-3 items-start animate-in slide-in-from-top-2">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div className="relative">
                            <select
                              value={custo.produto}
                              onChange={(e) => updateCusto(index, 'produto', e.target.value)}
                              className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emidias-primary focus:ring-2 focus:ring-emidias-primary/20 outline-none transition-all placeholder:text-gray-400"
                            >
                              <option value="" disabled>Selecione...</option>
                              <option value="Locação">Locação</option>
                              <option value="Papel">Papel</option>
                              <option value="Lona">Lona</option>
                            </select>
                          </div>

                          <Input
                            value={custo.valor}
                            onChange={(e) => updateCusto(index, 'valor', e.target.value)}
                            placeholder="R$ 0,00"
                            className="h-10 bg-white"
                          // Simplified input without label wrapper for grid
                          />

                          {custo.produto === 'Locação' ? (
                            <select
                              value={custo.periodo}
                              onChange={(e) => updateCusto(index, 'periodo', e.target.value)}
                              className="w-full h-10 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-emidias-primary focus:ring-2 focus:ring-emidias-primary/20 outline-none transition-all"
                            >
                              <option value="">Período...</option>
                              <option value="Bissemanal">Bissemana</option>
                              <option value="Mensal">Mensal</option>
                              <option value="Unitário">Unitário</option>
                            </select>
                          ) : (
                            <div className="w-full h-10 bg-gray-100 rounded-lg border border-transparent" />
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="danger"
                          size="icon"
                          onClick={() => removeCusto(index)}
                          className="h-10 w-10 shrink-0 rounded-lg"
                          title="Remover"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    ))}
                  </div>
                  {errors.custos && <p className="text-xs text-red-500 mt-2">{errors.custos}</p>}
                </div>

                <div className="md:col-span-2">
                  <Textarea
                    label="Observações Gerais"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {errors.submit && (
          <div className="rounded-xl bg-red-50 p-4 border border-red-200 text-sm text-red-600 animate-in zoom-in">
            {errors.submit}
          </div>
        )}

      </div>
    </Modal>
  );
}
