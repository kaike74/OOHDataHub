'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { X, Upload, Plus, Trash2, MapPin, Loader2, Image as ImageIcon, Ruler, Users, DollarSign, ArrowRight, ArrowLeft, Check, Search } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';
import ExibidoraForm from './ExibidoraForm';

interface Custo {
  produto: string;
  valor: string;
  periodo: string;
}

import { TIPOS_OOH } from '@/constants/oohTypes';

interface GooglePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

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

  // Endereço e Google Search
  const [endereco, setEndereco] = useState('');
  const [googleSuggestions, setGoogleSuggestions] = useState<GooglePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  const [pais, setPais] = useState('');

  // Exibidora
  const [idExibidora, setIdExibidora] = useState('');
  const [showInlineExibidoraForm, setShowInlineExibidoraForm] = useState(false);

  // Medidas
  const [medidaUnit, setMedidaUnit] = useState<'M' | 'Px'>('M');
  const [medidaWidth, setMedidaWidth] = useState('');
  const [medidaHeight, setMedidaHeight] = useState('');

  const [fluxo, setFluxo] = useState('');
  const [tipos, setTipos] = useState<string[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [custos, setCustos] = useState<Custo[]>([{ produto: '', valor: '', periodo: '' }]);
  const [images, setImages] = useState<File[]>([]);
  const [imagesPreviews, setImagesPreviews] = useState<string[]>([]);

  // Geocoding
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
      setFluxo(editingPonto.fluxo?.toString() || '');

      // Parse medidas
      if (editingPonto.medidas) {
        // Tenta detectar formato "WxH Unit"
        const match = editingPonto.medidas.match(/([\d,.]+)[xX]([\d,.]+)\s*(M|Px|m|px)?/i);
        if (match) {
          setMedidaWidth(match[1]);
          setMedidaHeight(match[2]);
          const unit = match[3]?.toLowerCase();
          setMedidaUnit(unit === 'px' ? 'Px' : 'M');
        } else {
          // Fallback se não bater o regex exato
          setMedidaWidth('');
          setMedidaHeight('');
          setMedidaUnit('M');
        }
      } else {
        setMedidaWidth('');
        setMedidaHeight('');
        setMedidaUnit('M');
      }

      // Parse tipos
      if (editingPonto.tipo) {
        setTipos(editingPonto.tipo.split(',').map(t => t.trim()).filter(Boolean));
      } else if (editingPonto.tipos) {
        setTipos(editingPonto.tipos.split(',').map(t => t.trim()).filter(Boolean));
      } else {
        setTipos([]);
      }

      setObservacoes(editingPonto.observacoes || '');
      setPontoReferencia(editingPonto.ponto_referencia || '');

      // Parse produtos
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

      // Imagens
      if (editingPonto.imagens && editingPonto.imagens.length > 0) {
        setImagesPreviews(editingPonto.imagens.map(img => api.getImageUrl(img)));
      } else {
        setImagesPreviews([]);
      }
      setImages([]);
    }
  }, [editingPonto, isModalOpen]);

  // Street View Coordinates
  useEffect(() => {
    if (streetViewCoordinates && isModalOpen) {
      setLatitude(streetViewCoordinates.lat.toString());
      setLongitude(streetViewCoordinates.lng.toString());
      fetchReverseGeocode(streetViewCoordinates.lat, streetViewCoordinates.lng);
    }
  }, [streetViewCoordinates, isModalOpen]);

  // Auto-fill medidas para Outdoor
  useEffect(() => {
    if (tipos.includes('Outdoor') && !medidaWidth && !medidaHeight && !editingPonto) {
      setMedidaUnit('M');
      setMedidaWidth('9,00');
      setMedidaHeight('3,00');
    }
  }, [tipos, medidaWidth, medidaHeight, editingPonto]);

  // Google Places Autocomplete Logic
  const fetchPredictions = (input: string) => {
    if (!input || input.length < 3 || !window.google) {
      setGoogleSuggestions([]);
      return;
    }

    const service = new google.maps.places.AutocompleteService();
    setIsSearchingAddress(true);
    service.getPlacePredictions({
      input,
      componentRestrictions: { country: 'br' }
    }, (predictions, status) => {
      setIsSearchingAddress(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
        setGoogleSuggestions(predictions.slice(0, 5) as unknown as GooglePrediction[]);
        setShowSuggestions(true);
      } else {
        setGoogleSuggestions([]);
      }
    });
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndereco(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      fetchPredictions(value);
    }, 400);
  };

  const handleSelectPrediction = (placeId: string, description: string) => {
    setEndereco(description);
    setShowSuggestions(false);
    setIsSearchingAddress(true);

    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ placeId }, (results, status) => {
      setIsSearchingAddress(false);
      if (status === 'OK' && results && results[0]) {
        processGeocodeResult(results[0]);
      }
    });
  };

  const processGeocodeResult = (result: google.maps.GeocoderResult) => {
    const location = result.geometry.location;
    setLatitude(location.lat().toString());
    setLongitude(location.lng().toString());

    const addressComponents = result.address_components;
    const cidadeComponent = addressComponents.find(c => c.types.includes('locality')) ||
      addressComponents.find(c => c.types.includes('administrative_area_level_2'));
    const ufComponent = addressComponents.find(c => c.types.includes('administrative_area_level_1'));
    const paisComponent = addressComponents.find(c => c.types.includes('country'));

    if (cidadeComponent) setCidade(cidadeComponent.long_name);
    if (ufComponent) setUf(ufComponent.short_name);
    if (paisComponent) setPais(paisComponent.long_name);

    setErrors({ ...errors, endereco: '' });
    fetchPontoReferencia(location.lat(), location.lng());
  };

  // Manual Geocode on Enter
  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (googleSuggestions.length > 0) {
        handleSelectPrediction(googleSuggestions[0].place_id, googleSuggestions[0].description);
      } else {
        // Fallback to text search geocode
        const geocoder = new google.maps.Geocoder();
        setIsSearchingAddress(true);
        geocoder.geocode({ address: endereco }, (results, status) => {
          setIsSearchingAddress(false);
          if (status === 'OK' && results && results[0]) {
            setEndereco(results[0].formatted_address);
            processGeocodeResult(results[0]);
          }
        });
      }
    }
  };

  const fetchReverseGeocode = (lat: number, lng: number) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        setEndereco(results[0].formatted_address);
        processGeocodeResult(results[0]);
      }
    });
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

  // Image Handling
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
      // Formatar medidas
      const medidaString = (medidaWidth && medidaHeight)
        ? `${medidaWidth}x${medidaHeight} ${medidaUnit}`
        : null;

      const pontoData = {
        codigo_ooh: codigoOoh,
        endereco,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        cidade: cidade || null,
        uf: uf || null,
        pais: pais || 'Brasil',
        id_exibidora: idExibidora ? parseInt(idExibidora) : null,
        medidas: medidaString,
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
    setShowInlineExibidoraForm(false);
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
      setMedidaWidth('');
      setMedidaHeight('');
      setMedidaUnit('M');
      setFluxo('');
      setTipos([]);
      setObservacoes('');
      setPontoReferencia('');
      setCustos([{ produto: '', valor: '', periodo: '' }]);
      setImages([]);
      setImagesPreviews([]);
      setErrors({});
      setGoogleSuggestions([]);
    }, 300);
  };

  const handleIdExibidoraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'CREATE_NEW') {
      setShowInlineExibidoraForm(true);
    } else {
      setIdExibidora(e.target.value);
    }
  };

  const handleInlineExibidoraSuccess = (newId: number) => {
    setShowInlineExibidoraForm(false);
    setIdExibidora(newId.toString());
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
        // Hide footer if inline exhibitor form is valid and showing? 
        // User didn't specify, but typically we hide main actions while in a sub-form.
        // But since it's "inline", maybe we just disable them.
        !showInlineExibidoraForm && (
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
        )
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

                {/* Endereço com Autocomplete */}
                <div className="md:col-span-2 relative">
                  <div className="relative">
                    <Input
                      label="Endereço Completo"
                      placeholder="Digite para buscar..."
                      value={endereco}
                      onChange={handleAddressChange}
                      onKeyDown={handleAddressKeyDown}
                      error={errors.endereco}
                      required
                      icon={isSearchingAddress ? <Loader2 className="animate-spin text-emidias-primary" size={18} /> : <Search size={18} />}
                    />

                    {/* Suggestions Dropdown */}
                    {showSuggestions && googleSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {googleSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.place_id}
                            type="button"
                            onClick={() => handleSelectPrediction(suggestion.place_id, suggestion.description)}
                            className="w-full text-left px-4 py-3 hover:bg-emidias-blue-50 transition-colors flex items-start gap-3 border-b border-gray-50 last:border-0"
                          >
                            <MapPin size={16} className="mt-1 text-emidias-primary shrink-0" />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {suggestion.structured_formatting.main_text}
                              </div>
                              <div className="text-xs text-gray-500">
                                {suggestion.structured_formatting.secondary_text}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
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

              {showInlineExibidoraForm ? (
                <div className="bg-white rounded-xl border border-emidias-primary/20 shadow-lg p-6 animate-in zoom-in-95 duration-300 relative">
                  <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
                    <h3 className="font-bold text-lg text-emidias-primary flex items-center gap-2">
                      <Plus size={20} />
                      Cadastrar Nova Exibidora
                    </h3>
                    <Button variant="ghost" size="icon" onClick={() => setShowInlineExibidoraForm(false)}>
                      <X size={20} />
                    </Button>
                  </div>
                  <ExibidoraForm
                    onSuccess={handleInlineExibidoraSuccess}
                    onCancel={() => setShowInlineExibidoraForm(false)}
                  />
                </div>
              ) : (
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

                  {/* Tipos de Painel (Reordered) */}
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

                  {/* Medidas Custom Input */}
                  <div className="">
                    <div className='flex items-center justify-between mb-2'>
                      <label className="block text-sm font-semibold text-emidias-gray-700">
                        Medidas
                      </label>
                      <div className="bg-gray-100 p-0.5 rounded-lg flex text-xs font-semibold">
                        <button
                          type="button"
                          onClick={() => setMedidaUnit('M')}
                          className={cn(
                            "px-2 py-1 rounded-md transition-all",
                            medidaUnit === 'M' ? "bg-white shadow-sm text-emidias-primary" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Metros
                        </button>
                        <button
                          type="button"
                          onClick={() => setMedidaUnit('Px')}
                          className={cn(
                            "px-2 py-1 rounded-md transition-all",
                            medidaUnit === 'Px' ? "bg-white shadow-sm text-emidias-primary" : "text-gray-500 hover:text-gray-700"
                          )}
                        >
                          Pixels
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="relative">
                        <Input
                          placeholder="Largura"
                          value={medidaWidth}
                          onChange={(e) => setMedidaWidth(medidaUnit === 'Px' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        // Make sure text appears clearly
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">
                          L ({medidaUnit})
                        </span>
                      </div>
                      <div className="relative">
                        <Input
                          placeholder="Altura"
                          value={medidaHeight}
                          onChange={(e) => setMedidaHeight(medidaUnit === 'Px' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">
                          A ({medidaUnit})
                        </span>
                      </div>
                    </div>
                  </div>

                  <Input
                    label="Fluxo Diário"
                    value={fluxo}
                    onChange={(e) => setFluxo(e.target.value)}
                    placeholder="50000"
                    type="number"
                    icon={<Users size={16} />}
                  />

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
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
