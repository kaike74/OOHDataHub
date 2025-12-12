'use client';

import { useRef, useEffect, useState } from 'react';
import { Search, X, Loader2, MapPin } from 'lucide-react';

interface AddressSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

export default function AddressSearch({ onLocationSelect }: AddressSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!inputRef.current || !window.google) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
      types: ['address']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place || !place.geometry || !place.geometry.location) {
        return;
      }

      setIsLoading(true);

      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || place.name || ''
      };

      onLocationSelect(location);
      setSearchValue(location.address);

      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    });

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onLocationSelect]);

  const handleClear = () => {
    setSearchValue('');
    if (inputRef.current) {
      inputRef.current.value = '';
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative">
      <div
        className={`map-search-bar flex items-center gap-3 transition-all ${
          isFocused
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
          onChange={(e) => setSearchValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder="Buscar endereço, rua, bairro..."
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
                Digite um endereço, rua, bairro ou cidade para centralizar o mapa
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
