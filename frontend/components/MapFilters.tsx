'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { X, Filter as FilterIcon, ChevronDown, ChevronUp } from 'lucide-react';

interface MapFiltersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MapFilters({ isOpen, onClose }: MapFiltersProps) {
  const pontos = useStore((state) => state.pontos);
  const exibidoras = useStore((state) => state.exibidoras);
  const filterCidade = useStore((state) => state.filterCidade);
  const filterUF = useStore((state) => state.filterUF);
  const filterExibidora = useStore((state) => state.filterExibidora);
  const setFilterCidade = useStore((state) => state.setFilterCidade);
  const setFilterUF = useStore((state) => state.setFilterUF);
  const setFilterExibidora = useStore((state) => state.setFilterExibidora);
  const clearFilters = useStore((state) => state.clearFilters);

  const [selectedCidades, setSelectedCidades] = useState<string[]>([]);
  const [selectedUFs, setSelectedUFs] = useState<string[]>([]);
  const [selectedExibidoras, setSelectedExibidoras] = useState<number[]>([]);
  const [valorMin, setValorMin] = useState<string>('');
  const [valorMax, setValorMax] = useState<string>('');
  const [tiposProduto, setTiposProduto] = useState<string[]>([]);

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

      ponto.produtos?.forEach(produto => {
        if (produto.tipo) tiposSet.add(produto.tipo);
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

  // Contar pontos filtrados
  const filteredCount = useMemo(() => {
    return pontos.filter(ponto => {
      if (selectedCidades.length > 0 && !selectedCidades.includes(ponto.cidade || '')) return false;
      if (selectedUFs.length > 0 && !selectedUFs.includes(ponto.uf || '')) return false;
      if (selectedExibidoras.length > 0 && !selectedExibidoras.includes(ponto.id_exibidora || 0)) return false;

      if (tiposProduto.length > 0) {
        const hasTipo = ponto.produtos?.some(p => tiposProduto.includes(p.tipo));
        if (!hasTipo) return false;
      }

      if (valorMin || valorMax) {
        const valores = ponto.produtos?.map(p => p.valor) || [];
        const max = Math.max(...valores);
        const min = Math.min(...valores);

        if (valorMin && max < parseFloat(valorMin)) return false;
        if (valorMax && min > parseFloat(valorMax)) return false;
      }

      return true;
    }).length;
  }, [pontos, selectedCidades, selectedUFs, selectedExibidoras, tiposProduto, valorMin, valorMax]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleCidade = (cidade: string) => {
    setSelectedCidades(prev =>
      prev.includes(cidade) ? prev.filter(c => c !== cidade) : [...prev, cidade]
    );
  };

  const toggleUF = (uf: string) => {
    setSelectedUFs(prev =>
      prev.includes(uf) ? prev.filter(u => u !== uf) : [...prev, uf]
    );
  };

  const toggleExibidora = (id: number) => {
    setSelectedExibidoras(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const toggleTipo = (tipo: string) => {
    setTiposProduto(prev =>
      prev.includes(tipo) ? prev.filter(t => t !== tipo) : [...prev, tipo]
    );
  };

  const handleClearAll = () => {
    setSelectedCidades([]);
    setSelectedUFs([]);
    setSelectedExibidoras([]);
    setTiposProduto([]);
    setValorMin('');
    setValorMax('');
    clearFilters();
  };

  const handleApply = () => {
    // Aplicar filtros (você pode implementar a lógica de filtro real aqui)
    // Por enquanto, apenas fechar o painel
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
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {ufs.map(uf => (
                      <label key={uf} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedUFs.includes(uf)}
                          onChange={() => toggleUF(uf)}
                          className="rounded border-gray-300 text-emidias-primary focus:ring-emidias-primary"
                        />
                        <span className="text-sm text-gray-700">{uf}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Cidade */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">Cidade</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {cidades.map(cidade => (
                      <label key={cidade} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedCidades.includes(cidade)}
                          onChange={() => toggleCidade(cidade)}
                          className="rounded border-gray-300 text-emidias-primary focus:ring-emidias-primary"
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
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {exibidoras.map(exibidora => (
                    <label key={exibidora.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedExibidoras.includes(exibidora.id)}
                        onChange={() => toggleExibidora(exibidora.id)}
                        className="rounded border-gray-300 text-emidias-primary focus:ring-emidias-primary"
                      />
                      <span className="text-sm text-gray-700">{exibidora.nome}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Produto */}
          <div className="border border-emidias-gray/20 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('tipo')}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
            >
              <span className="font-semibold text-emidias-primary text-sm">Tipo de Produto</span>
              {expandedSections.tipo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {expandedSections.tipo && (
              <div className="p-4">
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {tipos.map(tipo => (
                    <label key={tipo} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={tiposProduto.includes(tipo)}
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

          {/* Faixa de Valor */}
          {valores && (
            <div className="border border-emidias-gray/20 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('valor')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
              >
                <span className="font-semibold text-emidias-primary text-sm">Faixa de Valor</span>
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
