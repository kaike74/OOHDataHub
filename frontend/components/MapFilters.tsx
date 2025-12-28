'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { X, Filter as FilterIcon, ChevronDown, Search, MapPin, Building2, Tag, DollarSign, Globe, Check, Eraser } from 'lucide-react';

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
    <div className="bg-white/50 border border-white/40 rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-4 py-3 bg-white/60 hover:bg-white/80 flex items-center justify-between transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors">
            <Icon size={16} />
          </div>
          <span className="font-semibold text-gray-700 text-sm">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`text-gray-400 transition-transform duration-300 ${expandedSections[sectionKey] ? 'rotate-180' : ''}`}
        />
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSections[sectionKey] ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-3 space-y-3 bg-white/30 backdrop-blur-sm">
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
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 bg-white/70 border border-gray-200 rounded-lg text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 hover:bg-white transition-all outline-none"
      />
    </div>
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
    <label className="flex items-center gap-2.5 cursor-pointer p-2 rounded-lg hover:bg-blue-50/50 transition-all group select-none">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          className="peer sr-only"
        />
        <div
          className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${checked
            ? 'bg-blue-600 border-blue-600 shadow-sm'
            : 'border-gray-300 bg-white group-hover:border-blue-400'
            }`}>
          <Check size={10} className={`text-white transition-transform ${checked ? 'scale-100' : 'scale-0'}`} strokeWidth={4} />
        </div>
      </div>
      <span
        className={`text-sm transition-colors ${checked ? 'text-gray-900 font-medium' : 'text-gray-600 group-hover:text-gray-900'}`}>
        {label}
      </span>
    </label>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed left-4 top-[80px] bottom-6 w-full max-w-[380px] bg-white/80 backdrop-blur-2xl shadow-2xl shadow-black/10 border border-white/50 rounded-2xl z-50 overflow-hidden flex flex-col animate-in slide-in-from-left-4 duration-500">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-gray-100/50 bg-white/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center text-white">
                <FilterIcon size={20} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">Filtros</h2>
                {activeFiltersCount > 0 ? (
                  <p className="text-xs font-medium text-blue-600">{activeFiltersCount} ativo{activeFiltersCount !== 1 && 's'}</p>
                ) : (
                  <p className="text-xs text-gray-400">Nenhum filtro ativo</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex-shrink-0 px-5 py-3 bg-blue-50/30 border-b border-blue-100/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <p className="text-sm font-medium text-blue-900">
              <strong className="text-blue-700">{filteredCount}</strong> pontos encontrados
            </p>
          </div>

          {activeFiltersCount > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs font-medium text-gray-500 hover:text-red-500 flex items-center gap-1 transition-colors group"
            >
              <Eraser size={12} className="group-hover:rotate-12 transition-transform" />
              Limpar
            </button>
          )}
        </div>

        {/* Filters Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
          {/* País */}
          <FilterSection title="País" icon={Globe} sectionKey="pais" count={selectedPaises.length}>
            <SearchInput value={paisSearch} onChange={setPaisSearch} placeholder="Buscar país..." />
            <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
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
                <p className="text-sm text-gray-400 italic py-2 px-2 text-center">Nenhum país encontrado</p>
              )}
            </div>
          </FilterSection>

          {/* Localização */}
          <FilterSection title="Localização" icon={MapPin} sectionKey="localizacao" count={selectedUFs.length + selectedCidades.length}>
            {/* UF */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Estados (UF)</label>
              <SearchInput value={ufSearch} onChange={setUfSearch} placeholder="Buscar UF..." />
              <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
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
                  <p className="text-sm text-gray-400 italic py-2 px-2 text-center">Nenhuma UF</p>
                )}
              </div>
            </div>

            {/* Cidade */}
            <div className="space-y-2 pt-3 border-t border-gray-100/50">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cidades</label>
              <SearchInput value={cidadeSearch} onChange={setCidadeSearch} placeholder="Buscar cidade..." />
              <div className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {filteredCidades.length > 0 ? (
                  filteredCidades.map(cidade => (
                    <CheckboxItem
                      key={cidade}
                      checked={selectedCidades.includes(cidade)}
                      onChange={() => toggleCidade(cidade)}
                      label={cidade}
                    />
                  ))
                ) : (
                  <p className="text-sm text-gray-400 italic py-2 px-2 text-center">Nenhuma cidade</p>
                )}

              </div>
            </div>
          </FilterSection>

          {/* Exibidora */}
          <FilterSection title="Exibidora" icon={Building2} sectionKey="exibidora" count={selectedExibidoras.length}>
            <SearchInput value={exibidoraSearch} onChange={setExibidoraSearch} placeholder="Buscar exibidora..." />
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
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
          <FilterSection title="Tipo de Mídia" icon={Tag} sectionKey="tipo" count={selectedTipos.length}>
            <div className="space-y-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
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
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Mínimo</label>
                  <Input
                    type="number"
                    value={valorMin}
                    onChange={(e) => setValorMin(e.target.value)}
                    placeholder={`R$ ${valores.min.toFixed(0)}`}
                    className="h-9 bg-white/70 border-gray-200 text-sm focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Máximo</label>
                  <Input
                    type="number"
                    value={valorMax}
                    onChange={(e) => setValorMax(e.target.value)}
                    placeholder={`R$ ${valores.max.toFixed(0)}`}
                    className="h-9 bg-white/70 border-gray-200 text-sm focus:ring-blue-500/20"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400 italic text-center mt-2">
                * Baseado em valores de locação
              </p>
            </FilterSection>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 bg-white/80 border-t border-gray-200/50 backdrop-blur-md flex gap-3">
          <Button
            onClick={handleApply}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/30 border-0 h-11"
          >
            Aplicar Filtros
          </Button>
        </div>
      </div>
    </>
  );
}
