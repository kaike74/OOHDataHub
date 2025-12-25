import { useState, useRef, useEffect } from 'react';
import { Loader2, X, MapPin } from 'lucide-react';
import { Loader } from '@googlemaps/js-api-loader';

interface LocationAutocompleteProps {
    value: string[]; // Array of selected location strings
    onChange: (locations: string[]) => void;
    placeholder?: string;
}

export default function LocationAutocomplete({ value = [], onChange, placeholder = "Adicionar região..." }: LocationAutocompleteProps) {
    const [inputValue, setInputValue] = useState('');
    const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isScriptLoaded, setIsScriptLoaded] = useState(false);

    const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
    const sessionToken = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

    // Initialize Google Maps Script
    useEffect(() => {
        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
            version: 'weekly',
            libraries: ['places']
        });

        loader.load().then(() => {
            setIsScriptLoaded(true);
            autocompleteService.current = new google.maps.places.AutocompleteService();
            sessionToken.current = new google.maps.places.AutocompleteSessionToken();
        }).catch((err: unknown) => {
            console.error('Error loading Google Maps API:', err);
        });
    }, []);

    const fetchPredictions = (input: string) => {
        if (!input || !autocompleteService.current) {
            setPredictions([]);
            return;
        }

        setIsLoading(true);
        autocompleteService.current.getPlacePredictions({
            input,
            sessionToken: sessionToken.current || undefined,
            types: ['(regions)'], // Bias towards regions (cities, states, etc)
            componentRestrictions: { country: 'br' }, // Restrict to Brazil
            language: 'pt-BR'
        }, (results, status) => {
            setIsLoading(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                setPredictions(results);
            } else {
                setPredictions([]);
            }
        });
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);

        // Debounce prediction fetch
        const timeoutId = setTimeout(() => {
            fetchPredictions(val);
        }, 300);

        return () => clearTimeout(timeoutId);
    };

    const handleSelectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
        const locationName = prediction.description;
        if (!value.includes(locationName)) {
            onChange([...value, locationName]);
        }
        setInputValue('');
        setPredictions([]);

        // Refresh session token
        sessionToken.current = new google.maps.places.AutocompleteSessionToken();
    };

    const handleRemoveLocation = (locationToRemove: string) => {
        onChange(value.filter(loc => loc !== locationToRemove));
    };

    return (
        <div className="space-y-3">
            {/* Selected Tags */}
            <div className="flex flex-wrap gap-2">
                {value.map((location, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-100 group animate-in fade-in zoom-in duration-200"
                    >
                        <MapPin size={12} className="opacity-50" />
                        {location}
                        <button
                            type="button"
                            onClick={() => handleRemoveLocation(location)}
                            className="p-0.5 hover:bg-black/5 rounded-full transition-colors ml-1"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Input & Suggestions */}
            <div className="relative">
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-emidias-accent focus:ring-4 focus:ring-emidias-accent/10 transition-all outline-none"
                    disabled={!isScriptLoaded}
                />

                {isLoading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="animate-spin text-gray-400" size={18} />
                    </div>
                )}

                {/* Suggestions Dropdown */}
                {predictions.length > 0 && inputValue && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto overflow-x-hidden">
                        {predictions.map((prediction) => (
                            <button
                                key={prediction.place_id}
                                type="button"
                                onClick={() => handleSelectPrediction(prediction)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-3 transition-colors border-b border-gray-50 last:border-0"
                            >
                                <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{prediction.structured_formatting.main_text}</p>
                                    <p className="text-xs text-gray-500">{prediction.structured_formatting.secondary_text}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
