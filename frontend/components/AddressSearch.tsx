'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { Search, X, Loader2, MapPin, Target } from 'lucide-react';
import styles from './ui/AnimatedSearchBar.module.css';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

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
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Controls the expansion
  const [dbResults, setDbResults] = useState<SearchResult[]>([]);
  const [googleResults, setGoogleResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const placesServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  // Initialize Google Places AutocompleteService with polling
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5 seconds max

    const initGooglePlaces = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        placesServiceRef.current = new google.maps.places.AutocompleteService();
        console.log('Google Places AutocompleteService initialized');
        return true;
      }
      return false;
    };

    // Try immediately
    if (!initGooglePlaces()) {
      // Poll every 100ms until loaded or timeout
      const interval = setInterval(() => {
        attempts++;
        if (initGooglePlaces() || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts) {
            console.warn('Google Places API took too long to load');
          }
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, []);

  // Search database
  const searchDatabase = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setDbResults([]);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      // Check if response has results array
      const results = Array.isArray(data) ? data : (data.results || []);

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

  // Search Google Places
  const searchGoogle = useCallback((query: string) => {
    if (!query || query.length < 3 || !placesServiceRef.current) {
      setGoogleResults([]);
      return;
    }

    placesServiceRef.current.getPlacePredictions(
      {
        input: query,
        componentRestrictions: { country: 'br' }
      },
      (predictions, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          const formatted: SearchResult[] = predictions.slice(0, 5).map((prediction) => ({
            type: 'google' as const,
            label: prediction.structured_formatting.main_text,
            sublabel: prediction.structured_formatting.secondary_text,
            data: prediction
          }));
          setGoogleResults(formatted);
        } else {
          setGoogleResults([]);
        }
      }
    );
  }, []);

  // Debounced search (both sources)
  useEffect(() => {
    const timer = setTimeout(() => {
      searchDatabase(searchValue);
      searchGoogle(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, searchDatabase, searchGoogle]);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSearchValue('');
    setDbResults([]);
    setGoogleResults([]);
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
      setGoogleResults([]);
    }
  };

  const handleSelectGoogleResult = (result: SearchResult) => {
    if (result.type === 'google') {
      setIsLoading(true);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ placeId: result.data.place_id }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            address: results[0].formatted_address
          };
          onLocationSelect(location);
          setSearchValue(result.label);
          setShowDropdown(false);
          setDbResults([]);
          setGoogleResults([]);
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
      });
    }
  };

  const handleToggle = () => {
    if (!isOpen) {
      setIsOpen(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const allResults = [...dbResults, ...googleResults];

  // Close logic for outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.finder-box-container') && !searchValue && isOpen) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [searchValue, isOpen]);


  return (
    <div className={cn(styles.finderBox, isOpen && styles.open, "finder-box-container z-50")}>
      <div className={styles.fieldHolder} style={isOpen ? { width: '380px' } : undefined}>

        {/* Toggle / Search Icon */}
        <div
          className={styles.iconButton}
          onClick={handleToggle}
        >
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
            setIsOpen(true);
            if (searchValue.length >= 2) setShowDropdown(true);
          }}
          onBlur={() => setTimeout(() => {
            setIsFocused(false);
            setShowDropdown(false);
          }, 200)}
          placeholder="Buscar endereço, código, exibidora..."
          className={styles.input}
        />

        {/* Close Button or Clear Button */}
        {searchValue && (
          <div className={styles.closeButton} onClick={handleClear}>
            <X size={16} />
          </div>
        )}

      </div>

      {/* Combined Results Dropdown */}
      {
        showDropdown && allResults.length > 0 && isOpen && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-md rounded-xl shadow-emidias-xl max-h-96 overflow-y-auto z-[60] animate-fade-in-up border border-emidias-gray-200">
            <div className="p-1.5">
              {dbResults.length > 0 && (
                <>
                  <div className="text-xs font-semibold text-emidias-gray-500 px-2.5 py-1.5">
                    🎯 Pontos Cadastrados ({dbResults.length})
                  </div>
                  {dbResults.map((result, index) => (
                    <button
                      key={`db-${result.id || index}`}
                      onClick={() => handleSelectDbResult(result)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emidias-blue-50 transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <Target size={14} className="text-emidias-accent mt-0.5 flex-shrink-0" />
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
                </>
              )}

              {googleResults.length > 0 && (
                <>
                  {dbResults.length > 0 && <div className="h-px bg-emidias-gray-200 my-1.5" />}
                  <div className="text-xs font-semibold text-emidias-gray-500 px-2.5 py-1.5">
                    📍 Endereços Google ({googleResults.length})
                  </div>
                  {googleResults.map((result, index) => (
                    <button
                      key={`google-${index}`}
                      onClick={() => handleSelectGoogleResult(result)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-emidias-blue-50 transition-colors group"
                    >
                      <div className="flex items-start gap-2">
                        <MapPin size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
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
                </>
              )}
            </div>
          </div>
        )
      }
    </div >
  );
}
