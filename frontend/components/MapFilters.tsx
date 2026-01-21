'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Filter as FilterIcon, ChevronDown, ChevronUp, Search, MapPin, Building2, Tag, DollarSign, Globe, Check } from 'lucide-react';

interface MapFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapFilters({ isOpen, onClose }: MapFiltersProps) {
  const pontos = useStore((state) => state.pontos);
  const exibidoras = useStore((state) => state.exibidoras);

  // Get current filters from store
  const filterPais = useStore((state) => state.filterPais);
  const filterUF = useStore((state) => state.filterUF);
  const filterCidade = useStore((state) => state.filterCidade);
  const filterExibidora = useStore((state) => state.filterExibidora);
  const filterTipos = useStore((state) => state.filterTipos);
  const filterValorMin = useStore((state) => state.filterValorMin);
  const filterValorMax = useStore((state) => state.filterValorMax);

  // Actions
  const setFilterPais = useStore((state) => state.setFilterPais);
  const setFilterUF = useStore((state) => state.setFilterUF);
  const setFilterCidade = useStore((state) => state.setFilterCidade);
  const setFilterExibidora = useStore((state) => state.setFilterExibidora);
  const setFilterTipos = useStore((state) => state.setFilterTipos);
  const setFilterValorMin = useStore((state) => state.setFilterValorMin);
  const setFilterValorMax = useStore((state) => state.setFilterValorMax);
  const clearFilters = useStore((state) => state.clearFilters);

  // Local state for UI
  const [selectedPaises, setSelectedPaises] = useState<string[]>(filterPais);
  const [selectedUFs, setSelectedUFs] = useState<string[]>(filterUF);
  const [selectedCidades, setSelectedCidades] = useState<string[]>(filterCidade);
  const [selectedExibidoras, setSelectedExibidoras] = useState<number[]>(filterExibidora);
  const [selectedTipos, setSelectedTipos] = useState<string[]>(filterTipos);
  const [valorMin, setValorMin] = useState<string>(filterValorMin?.toString() || '');
  const [valorMax, setValorMax] = useState<string>(filterValorMax?.toString() || '');

  // Search queries
  const [paisSearch, setPaisSearch] = useState('');
  const [ufSearch, setUfSearch] = useState('');
  const [cidadeSearch, setCidadeSearch] = useState('');
  const [exibidoraSearch, setExibidoraSearch] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    pais: true,
    localizacao: true,
    exibidora: true,
    tipo: false,
    valor: false
  });

  // Extrair valores únicos dos pontos
  const { paises, ufs, cidades, tipos, valores } = useMemo(() => {
    const paisesSet = new Set<string>();
    const ufsSet = new Set<string>();
    const cidadesSet = new Set<string>();
    const tiposSet = new Set<string>();
    const valoresArray: number[] = [];

    pontos.forEach(ponto => {
      if (ponto.pais) paisesSet.add(ponto.pais);
      if (ponto.uf) ufsSet.add(ponto.uf);
      if (ponto.cidade) cidadesSet.add(ponto.cidade);

      if (ponto.tipo) {
        const tiposArray = ponto.tipo.split(',').map(t => t.trim()).filter(Boolean);
        tiposArray.forEach(tipo => tiposSet.add(tipo));
      }

      const locacaoProdutos = ponto.produtos?.filter(p => p.tipo === 'Locação') || [];
      locacaoProdutos.forEach(produto => {
        if (produto.valor) valoresArray.push(produto.valor);
      });
    });

    return {
      paises: Array.from(paisesSet).sort(),
      ufs: Array.from(ufsSet).sort(),
      cidades: Array.from(cidadesSet).sort(),
      tipos: Array.from(tiposSet).sort(),
      valores: valoresArray.length > 0 ? {
        min: Math.min(...valoresArray),
        max: Math.max(...valoresArray)
      } : null
    };
  }, [pontos]);

  // Filtrar listas com base na busca
  const filteredPaises = useMemo(() =>
    paises.filter(p => p.toLowerCase().includes(paisSearch.toLowerCase())),
    [paises, paisSearch]
  );

  const filteredUFs = useMemo(() =>
    ufs.filter(u => u.toLowerCase().includes(ufSearch.toLowerCase())),
    [ufs, ufSearch]
  );

  const filteredCidades = useMemo(() =>
    cidades.filter(c => c.toLowerCase().includes(cidadeSearch.toLowerCase())),
    [cidades, cidadeSearch]
  );

  const filteredExibidoras = useMemo(() =>
    exibidoras.filter(e => e.nome.toLowerCase().includes(exibidoraSearch.toLowerCase())),
    [exibidoras, exibidoraSearch]
  );

  // Contar pontos filtrados
  const filteredCount = useMemo(() => {
    return pontos.filter(ponto => {
      if (selectedPaises.length > 0 && !selectedPaises.includes(ponto.pais || '')) return false;
      if (selectedUFs.length > 0 && !selectedUFs.includes(ponto.uf || '')) return false;
      if (selectedCidades.length > 0 && !selectedCidades.includes(ponto.cidade || '')) return false;
      if (selectedExibidoras.length > 0 && !selectedExibidoras.includes(ponto.id_exibidora || 0)) return false;

      if (selectedTipos.length > 0) {
        const pontoTipos = ponto.tipo?.split(',').map(t => t.trim()) || [];
        const hasMatchingTipo = selectedTipos.some(tipo => pontoTipos.includes(tipo));
        if (!hasMatchingTipo) return false;
      }

      if (valorMin || valorMax) {
        const locacaoProdutos = ponto.produtos?.filter(p => p.tipo === 'Locação') || [];
        if (locacaoProdutos.length === 0) return false;

        const valores = locacaoProdutos.map(p => p.valor);
        const max = Math.max(...valores);
        const min = Math.min(...valores);

        if (valorMin && max < parseFloat(valorMin)) return false;
        if (valorMax && min > parseFloat(valorMax)) return false;
      }

      return true;
    }).length;
  }, [pontos, selectedPaises, selectedUFs, selectedCidades, selectedExibidoras, selectedTipos, valorMin, valorMax]);

  // Count active filters
  const activeFiltersCount = [
    selectedPaises.length > 0,
    selectedUFs.length > 0,
    selectedCidades.length > 0,
    selectedExibidoras.length > 0,
    selectedTipos.length > 0,
    valorMin !== '' || valorMax !== ''
  ].filter(Boolean).length;

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const togglePais = (pais: string) => {
    setSelectedPaises(prev =>
      prev.includes(pais) ? prev.filter(p => p !== pais) : [...prev, pais]
    );
  };

  const toggleUF = (uf: string) => {
    setSelectedUFs(prev =>
      prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]
    );
  };

  const toggleCidade = (cidade: string) => {
    setSelectedCidades(prev =>
      prev.includes(cidade) ? prev.filter(c => c !== cidade) : [...prev, cidade]
    );
  };

  const toggleExibidora = (id: number) => {
    setSelectedExibidoras(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleClearAll = () => {
    setSelectedPaises([]);
    setSelectedUFs([]);
    setSelectedCidades([]);
    setSelectedExibidoras([]);
    setSelectedTipos([]);
    setValorMin('');
    setValorMax('');
    setPaisSearch('');
    setUfSearch('');
    setCidadeSearch('');
    setExibidoraSearch('');
    clearFilters();
  };

  const handleApply = () => {
    setFilterPais(selectedPaises);
    setFilterUF(selectedUFs);
    setFilterCidade(selectedCidades);
    setFilterExibidora(selectedExibidoras);
    setFilterTipos(selectedTipos);
    setFilterValorMin(valorMin ? parseFloat(valorMin) : null);
    setFilterValorMax(valorMax ? parseFloat(valorMax) : null);
    onClose();
  };

  if (!isOpen) return null;

  const FilterSection = ({
    title,
    icon: Icon,
    sectionKey,
    children,
    count
  }: {
    title: string;
    icon: any;
    sectionKey: keyof typeof expandedSections;
    children: React.ReactNode;
    count?: number;
  }) => (
    <div className="card-base overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3.5 bg-plura-gray-50 hover:bg-plura-gray-100 flex items-center justify-between transition-all group"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-plura-accent" />
          <span className="font-semibold text-plura-gray-900 text-sm">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="badge badge-accent text-[10px] px-2 py-0.5">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={18}
          className={`text-plura-gray-400 transition-transform duration-200 ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ${expandedSections[sectionKey] ? 'max-h-[400px]' : 'max-h-0'}`}>
        <div className="p-4 space-y-3">
          {children}
        </div>
      </div>
    </div>
  );

  const SearchInput = ({
    value,
    onChange,
    placeholder
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }) => (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      icon={<Search size={16} />}
    />
  );

  const CheckboxItem = ({
    checked,
    onChange,
    label
  }: {
    checked: boolean;
    onChange: () => void;
    label: string;
  }) => (
    <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-plura-gray-50 transition-all group">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="hidden"
      />
      <div
        onClick={onChange}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${checked
          ? 'bg-plura-accent border-plura-accent'
          : 'border-plura-gray-300 group-hover:border-plura-accent/50'
          }`}>
        {checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
      <span
        onClick={onChange}
        className={`text-sm transition-colors ${checked ? 'text-plura-gray-900 font-medium' : 'text-plura-gray-600'}`}>
        {label}
      </span>
    </label>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-0 top-[70px] bottom-0 w-full sm:w-96 bg-plura-gray-50 shadow-plura-2xl z-50 overflow-hidden flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="flex-shrink-0 gradient-primary px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FilterIcon className="text-white" size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Filtros</h2>
                {activeFiltersCount > 0 && (
                  <p className="text-xs text-white/70">{activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}</p>
                )}
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <X size={22} />
            </Button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex-shrink-0 px-6 py-4 bg-white border-b border-plura-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-plura-accent rounded-full animate-pulse" />
              <span className="text-sm font-semibold text-plura-gray-900">
                {filteredCount} pontos
              </span>
              <span className="text-sm text-plura-gray-500">encontrados</span>
            </div>
            {activeFiltersCount > 0 && (
              <Button
                onClick={handleClearAll}
                variant="ghost"
                size="sm"
                className="text-xs font-medium text-plura-accent hover:text-plura-accent-dark h-auto px-2 py-1"
              >
                Limpar todos
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* País */}
          <FilterSection title="País" icon={Globe} sectionKey="pais" count={selectedPaises.length}>
            <SearchInput value={paisSearch} onChange={setPaisSearch} placeholder="Buscar país..." />
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {filteredPaises.length > 0 ? (
                filteredPaises.map(pais => (
                  <CheckboxItem
                    key={pais}
                    checked={selectedPaises.includes(pais)}
                    onChange={() => togglePais(pais)}
                    label={pais}
                  />
                ))
              ) : (
                <p className="text-sm text-plura-gray-500 italic py-2 px-2">Nenhum país cadastrado</p>
              )}
            </div>
          </FilterSection>

          {/* Localização */}
          <FilterSection title="Localização" icon={MapPin} sectionKey="localizacao" count={selectedUFs.length + selectedCidades.length}>
            {/* UF */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-plura-gray-500 uppercase tracking-wider">UF</label>
              <SearchInput value={ufSearch} onChange={setUfSearch} placeholder="Buscar UF..." />
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {filteredUFs.length > 0 ? (
                  filteredUFs.map(uf => (
                    <CheckboxItem
                      key={uf}
                      checked={selectedUFs.includes(uf)}
                      onChange={() => toggleUF(uf)}
                      label={uf}
                    />
                  ))
                ) : (
                  <p className="text-sm text-plura-gray-500 italic py-2 px-2">Nenhuma UF cadastrada</p>
                )}
              </div>
            </div>

            {/* Cidade */}
            <div className="space-y-2 pt-2 border-t border-plura-gray-100">
              <label className="text-xs font-semibold text-plura-gray-500 uppercase tracking-wider">Cidade</label>
              <SearchInput value={cidadeSearch} onChange={setCidadeSearch} placeholder="Buscar cidade..." />
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {filteredCidades.map(cidade => (
                  <CheckboxItem
                    key={cidade}
                    checked={selectedCidades.includes(cidade)}
                    onChange={() => toggleCidade(cidade)}
                    label={cidade}
                  />
                ))}
              </div>
            </div>
          </FilterSection>

          {/* Exibidora */}
          <FilterSection title="Exibidora" icon={Building2} sectionKey="exibidora" count={selectedExibidoras.length}>
            <SearchInput value={exibidoraSearch} onChange={setExibidoraSearch} placeholder="Buscar exibidora..." />
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filteredExibidoras.map(exibidora => (
                <CheckboxItem
                  key={exibidora.id}
                  checked={selectedExibidoras.includes(exibidora.id)}
                  onChange={() => toggleExibidora(exibidora.id)}
                  label={exibidora.nome}
                />
              ))}
            </div>
          </FilterSection>

          {/* Tipo */}
          <FilterSection title="Tipo" icon={Tag} sectionKey="tipo" count={selectedTipos.length}>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {tipos.map(tipo => (
                <CheckboxItem
                  key={tipo}
                  checked={selectedTipos.includes(tipo)}
                  onChange={() => toggleTipo(tipo)}
                  label={tipo}
                />
              ))}
            </div>
          </FilterSection>

          {/* Faixa de Valor */}
          {valores && (
            <FilterSection title="Faixa de Valor" icon={DollarSign} sectionKey="valor" count={valorMin || valorMax ? 1 : 0}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-plura-gray-500 uppercase tracking-wider">Mínimo</label>
                  <Input
                    type="number"
                    value={valorMin}
                    onChange={(e) => setValorMin(e.target.value)}
                    placeholder={`R$ ${valores.min.toFixed(0)}`}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-plura-gray-500 uppercase tracking-wider">Máximo</label>
                  <Input
                    type="number"
                    value={valorMax}
                    onChange={(e) => setValorMax(e.target.value)}
                    placeholder={`R$ ${valores.max.toFixed(0)}`}
                  />
                </div>
              </div>
              <p className="text-xs text-plura-gray-400 italic">
                Valores baseados em produtos de Locação
              </p>
            </FilterSection>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 bg-white border-t border-plura-gray-100 flex gap-3">
          <Button
            onClick={handleClearAll}
            variant="secondary"
            className="flex-1"
          >
            Limpar
          </Button>
          <Button
            onClick={handleApply}
            variant="accent"
            className="flex-1 hover-glow"
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </>
  );
}
