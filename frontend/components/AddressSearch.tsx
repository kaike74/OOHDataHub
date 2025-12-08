'use client';

import { useRef, useEffect, useState } from 'react';
import { Search, X, Loader2 } from 'lucide-react';

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

    // Inicializar autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      fields: ['address_components', 'geometry', 'formatted_address', 'name'],
      types: ['address']
    });

    // Listener para quando um lugar é selecionado
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
        className={`flex items-center gap-2 bg-white rounded-lg shadow-lg border-2 transition-all ${
          isFocused
            ? 'border-emidias-primary shadow-xl'
            : 'border-transparent'
        }`}
      >
        <div className="pl-4 text-emidias-primary">
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
          placeholder="Buscar endereço..."
          className="flex-1 py-3 pr-2 outline-none text-emidias-primary placeholder-gray-400 bg-transparent"
        />

        {searchValue && (
          <button
            onClick={handleClear}
            className="pr-3 text-gray-400 hover:text-emidias-primary transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Dica */}
      {isFocused && !searchValue && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg shadow-lg border border-emidias-gray/20 p-3 z-50">
          <p className="text-xs text-gray-500">
            Digite um endereço, rua, bairro ou cidade para buscar
          </p>
        </div>
      )}
    </div>
  );
}
