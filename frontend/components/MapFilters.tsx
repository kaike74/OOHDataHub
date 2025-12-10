'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { X, Filter as FilterIcon, ChevronDown, ChevronUp, Search } from 'lucide-react';

interface MapFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapFilters({ isOpen, onClose }: MapFiltersProps) {
  const pontos = useStore((state) => state.pontos);
  const exibidoras = useStore((state) => state.exibidoras);

  // Get current filters from store
  const filterCidade = useStore((state) => state.filterCidade);
  const filterUF = useStore((state) => state.filterUF);
  const filterExibidora = useStore((state) => state.filterExibidora);
  const filterTipos = useStore((state) => state.filterTipos);
  const filterValorMin = useStore((state) => state.filterValorMin);
  const filterValorMax = useStore((state) => state.filterValorMax);

  // Actions
  const setFilterCidade = useStore((state) => state.setFilterCidade);
  const setFilterUF = useStore((state) => state.setFilterUF);
  const setFilterExibidora = useStore((state) => state.setFilterExibidora);
  const setFilterTipos = useStore((state) => state.setFilterTipos);
  const setFilterValorMin = useStore((state) => state.setFilterValorMin);
  const setFilterValorMax = useStore((state) => state.setFilterValorMax);
  const clearFilters = useStore((state) => state.clearFilters);

  // Local state for UI
  const [selectedCidade, setSelectedCidade] = useState<string | null>(filterCidade);
  const [selectedUF, setSelectedUF] = useState<string | null>(filterUF);
  const [selectedExibidora, setSelectedExibidora] = useState<number | null>(filterExibidora);
  const [selectedTipos, setSelectedTipos] = useState<string[]>(filterTipos);
  const [valorMin, setValorMin] = useState<string>(filterValorMin?.toString() || '');
  const [valorMax, setValorMax] = useState<string>(filterValorMax?.toString() || '');

  // Search queries
  const [ufSearch, setUfSearch] = useState('');
  const [cidadeSearch, setCidadeSearch] = useState('');
  const [exibidoraSearch, setExibidoraSearch] = useState('');

  const [expandedSections, setExpandedSections] = useState({
    localizacao: true,
    exibidora: true,
    tipo: false,
    valor: false
  });

  // Extrair valores únicos dos pontos
  const { cidades, ufs, tipos, valores } = useMemo(() => {
    const cidadesSet = new Set<string>();
    const ufsSet = new Set<string>();
    const tiposSet = new Set<string>();
    const valoresArray: number[] = [];

    pontos.forEach(ponto => {
      if (ponto.cidade) cidadesSet.add(ponto.cidade);
      if (ponto.uf) ufsSet.add(ponto.uf);

      // Extrair tipos do campo tipo (separados por vírgula)
      if (ponto.tipo) {
        const tiposArray = ponto.tipo.split(',').map(t => t.trim()).filter(Boolean);
        tiposArray.forEach(tipo => tiposSet.add(tipo));
      }

      // Extrair valores apenas de produtos de "Locação"
      const locacaoProdutos = ponto.produtos?.filter(p => p.tipo === 'Locação') || [];
      locacaoProdutos.forEach(produto => {
        if (produto.valor) valoresArray.push(produto.valor);
      });
    });

    return {
      cidades: Array.from(cidadesSet).sort(),
      ufs: Array.from(ufsSet).sort(),
      tipos: Array.from(tiposSet).sort(),
      valores: valoresArray.length > 0 ? {
        min: Math.min(...valoresArray),
        max: Math.max(...valoresArray)
      } : null
    };
  }, [pontos]);

  // Filtrar listas com base na busca
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
      if (selectedUF && ponto.uf !== selectedUF) return false;
      if (selectedCidade && ponto.cidade !== selectedCidade) return false;
      if (selectedExibidora && ponto.id_exibidora !== selectedExibidora) return false;

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
  }, [pontos, selectedUF, selectedCidade, selectedExibidora, selectedTipos, valorMin, valorMax]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTipo = (tipo: string) => {
    setSelectedTipos(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleClearAll = () => {
    setSelectedUF(null);
    setSelectedCidade(null);
    setSelectedExibidora(null);
    setSelectedTipos([]);
    setValorMin('');
    setValorMax('');
    setUfSearch('');
    setCidadeSearch('');
    setExibidoraSearch('');
    clearFilters();
  };

  const handleApply = () => {
    // Aplicar todos os filtros ao store
    setFilterUF(selectedUF);
    setFilterCidade(selectedCidade);
    setFilterExibidora(selectedExibidora);
    setFilterTipos(selectedTipos);
    setFilterValorMin(valorMin ? parseFloat(valorMin) : null);
    setFilterValorMax(valorMax ? parseFloat(valorMax) : null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Painel de Filtros */}
      <div className="fixed left-0 top-[70px] bottom-0 w-80 bg-white shadow-2xl z-50 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="gradient-primary px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FilterIcon className="text-white" size={20} />
            <h2 className="text-lg font-bold text-white">Filtros</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contador de Resultados */}
        <div className="px-6 py-3 bg-emidias-accent/10 border-b border-emidias-gray/20">
          <p className="text-sm font-semibold text-emidias-primary">
            {filteredCount} pontos encontrados
          </p>
        </div>

        {/* Filtros */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Localização */}
          <div className="border border-emidias-gray/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('localizacao')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
            >
              <span className="font-semibold text-emidias-primary text-sm">Localização</span>
              {expandedSections.localizacao ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSections.localizacao && (
              <div className="p-4 space-y-3">
                {/* UF */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Estado (UF)</label>

                  {/* Search */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={ufSearch}
                      onChange={(e) => setUfSearch(e.target.value)}
                      placeholder="Buscar UF..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emidias-primary focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {filteredUFs.map(uf => (
                      <label key={uf} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="radio"
                          checked={selectedUF === uf}
                          onChange={() => setSelectedUF(selectedUF === uf ? null : uf)}
                          className="rounded-full border-gray-300 text-emidias-primary focus:ring-emidias-primary"
                        />
                        <span className="text-sm text-gray-700">{uf}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Cidade</label>

                  {/* Search */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                      type="text"
                      value={cidadeSearch}
                      onChange={(e) => setCidadeSearch(e.target.value)}
                      placeholder="Buscar cidade..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emidias-primary focus:border-transparent"
                    />
                  </div>

                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {filteredCidades.map(cidade => (
                      <label key={cidade} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="radio"
                          checked={selectedCidade === cidade}
                          onChange={() => setSelectedCidade(selectedCidade === cidade ? null : cidade)}
                          className="rounded-full border-gray-300 text-emidias-primary focus:ring-emidias-primary"
                        />
                        <span className="text-sm text-gray-700">{cidade}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Exibidora */}
          <div className="border border-emidias-gray/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('exibidora')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
            >
              <span className="font-semibold text-emidias-primary text-sm">Exibidora</span>
              {expandedSections.exibidora ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSections.exibidora && (
              <div className="p-4">
                {/* Search */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    value={exibidoraSearch}
                    onChange={(e) => setExibidoraSearch(e.target.value)}
                    placeholder="Buscar exibidora..."
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emidias-primary focus:border-transparent"
                  />
                </div>

                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {filteredExibidoras.map(exibidora => (
                    <label key={exibidora.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        checked={selectedExibidora === exibidora.id}
                        onChange={() => setSelectedExibidora(selectedExibidora === exibidora.id ? null : exibidora.id)}
                        className="rounded-full border-gray-300 text-emidias-primary focus:ring-emidias-primary"
                      />
                      <span className="text-sm text-gray-700">{exibidora.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tipo */}
          <div className="border border-emidias-gray/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('tipo')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
            >
              <span className="font-semibold text-emidias-primary text-sm">Tipo</span>
              {expandedSections.tipo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSections.tipo && (
              <div className="p-4">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {tipos.map(tipo => (
                    <label key={tipo} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTipos.includes(tipo)}
                        onChange={() => toggleTipo(tipo)}
                        className="rounded border-gray-300 text-emidias-primary focus:ring-emidias-primary"
                      />
                      <span className="text-sm text-gray-700">{tipo}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Faixa de Valor (Locação) */}
          {valores && (
            <div className="border border-emidias-gray/20 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('valor')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
              >
                <span className="font-semibold text-emidias-primary text-sm">Faixa de Valor (Locação)</span>
                {expandedSections.valor ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expandedSections.valor && (
                <div className="p-4 space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Mínimo</label>
                      <input
                        type="number"
                        value={valorMin}
                        onChange={(e) => setValorMin(e.target.value)}
                        placeholder={`R$ ${valores.min.toFixed(0)}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emidias-primary focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Máximo</label>
                      <input
                        type="number"
                        value={valorMax}
                        onChange={(e) => setValorMax(e.target.value)}
                        placeholder={`R$ ${valores.max.toFixed(0)}`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emidias-primary focus:border-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    Valores baseados apenas em produtos de Locação
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
          <button
            onClick={handleClearAll}
            className="flex-1 px-4 py-2 border border-emidias-gray/30 text-emidias-primary rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Limpar
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-2 bg-emidias-accent text-white rounded-lg hover:bg-[#E01A6A] transition font-medium hover-lift shadow-lg"
          >
            Aplicar
          </button>
        </div>
      </div>
    </>
  );
}
