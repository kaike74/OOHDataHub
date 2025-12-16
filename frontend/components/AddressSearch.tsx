'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Search, X, Loader2, MapPin, Target } from 'lucide-react';

interface AddressSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

interface SearchResult {
  type: 'google' | 'database';
  id?: number;
  label: string;
  sublabel?: string;
  data: any;
}

export default function AddressSearch({ onLocationSelect }: AddressSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Debounced search in database
  const searchDatabase = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDbResults([]);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();

      const formattedResults: SearchResult[] = results.map((ponto: any) => ({
        type: 'database' as const,
        id: ponto.id,
        label: `${ponto.codigo_ooh} - ${ponto.endereco}`,
        sublabel: `${ponto.cidade}, ${ponto.uf} • ${ponto.exibidora_nome || 'Sem exibidora'}`,
        data: ponto
      }));

      setDbResults(formattedResults);
    } catch (error) {
      console.error('Error searching database:', error);
      setDbResults([]);
    }
  }, []);

  // Debounce search (removed filterText integration)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDatabase(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, searchDatabase]);

  // Google Maps initialization removed - using only our custom search
  // The Google Places widget was causing dual dropdowns

  const handleClear = () => {
    setSearchValue('');
    setDbResults([]);
    setShowDropdown(false);
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  const handleSelectDbResult = (result: SearchResult) => {
    if (result.type === 'database' && result.data.latitude && result.data.longitude) {
      const location = {
        lat: result.data.latitude,
        lng: result.data.longitude,
        address: result.label
      };
      onLocationSelect(location);
      setSearchValue(result.label);
      setShowDropdown(false);
      setDbResults([]);
    }
  };

  return (
    <div className="relative">
      <div
        className={`map-search-bar flex items-center gap-3 transition-all ${isFocused
          ? 'border-emidias-accent shadow-accent'
          : 'border-transparent'
          }`}
      >
        <div className={`flex-shrink-0 transition-colors ${isFocused ? 'text-emidias-accent' : 'text-emidias-gray-400'}`}>
          {isLoading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Search size={20} />
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={searchValue}
          onChange={(e) => {
            setSearchValue(e.target.value);
            setShowDropdown(e.target.value.length >= 2);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (searchValue.length >= 2) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => {
            setIsFocused(false);
            setShowDropdown(false);
          }, 200)}
          placeholder="Buscar endereço, código OOH, cidade, exibidora..."
          className="flex-1 py-0.5 outline-none text-emidias-gray-900 placeholder-emidias-gray-400 bg-transparent text-sm font-medium"
        />

        {searchValue && (
          <button
            onClick={handleClear}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-emidias-gray-400 hover:text-emidias-gray-600 hover:bg-emidias-gray-100 rounded-lg transition-all"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Database Results Dropdown */}
      {showDropdown && dbResults.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-light rounded-xl shadow-emidias-xl max-h-96 overflow-y-auto z-[60] animate-fade-in-up">
          <div className="p-2">
            <div className="text-xs font-semibold text-emidias-gray-400 px-3 py-2">
              🎯 Pontos Cadastrados ({dbResults.length})
            </div>
            {dbResults.map((result, index) => (
              <button
                key={`${result.type}-${result.id || index}`}
                onClick={() => handleSelectDbResult(result)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-emidias-blue-50 transition-colors group"
              >
                <div className="flex items-start gap-2">
                  <Target size={16} className="text-emidias-accent mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-emidias-gray-900 truncate group-hover:text-emidias-primary">
                      {result.label}
                    </div>
                    {result.sublabel && (
                      <div className="text-xs text-emidias-gray-500 truncate mt-0.5">
                        {result.sublabel}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hint Tooltip */}
      {isFocused && !searchValue && (
        <div className="absolute top-full mt-2 left-0 right-0 glass-light rounded-xl shadow-emidias-lg p-4 z-50 animate-fade-in-up">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-emidias-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-emidias-accent" />
            </div>
            <div>
              <p className="text-sm font-medium text-emidias-gray-900">Buscar localização</p>
              <p className="text-xs text-emidias-gray-500 mt-0.5">
                Digite código OOH, endereço, cidade ou nome da exibidora
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
