'use client';

import { useEffect, useRef, useState } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useStore } from '@/lib/store';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export default function GoogleMap() {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);

    const pontos = useStore((state) => state.pontos);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const [isLoaded, setIsLoaded] = useState(false);

    // Inicializar mapa
    useEffect(() => {
        const initMap = async () => {
            if (!mapRef.current || googleMapRef.current) return;

            // Carrega o Google Maps API manualmente
            if (!window.google) {
                const script = document.createElement('script');
                script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geocoding`;
                script.async = true;
                script.defer = true;

                await new Promise<void>((resolve, reject) => {
                    script.onload = () => resolve();
                    script.onerror = reject;
                    document.head.appendChild(script);
                });
            }

            googleMapRef.current = new google.maps.Map(mapRef.current, {
                center: { lat: -23.5505, lng: -46.6333 }, // São Paulo
                zoom: 12,
                mapTypeControl: true,
                fullscreenControl: true,
                streetViewControl: true,
                zoomControl: true,
                styles: [
                    {
                        featureType: 'poi',
                        elementType: 'labels',
                        stylers: [{ visibility: 'off' }],
                    },
                ],
            });

            setIsLoaded(true);
        };

        initMap();
    }, []);

    // Atualizar markers quando pontos mudarem
    useEffect(() => {
        if (!isLoaded || !googleMapRef.current) return;

        // Limpar markers antigos
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        // Criar novos markers
        const markers = pontos
            .filter((ponto) => ponto.latitude && ponto.longitude)
            .map((ponto) => {
                const marker = new google.maps.Marker({
                    position: { lat: ponto.latitude!, lng: ponto.longitude! },
                    title: ponto.codigo_ooh,
                    map: googleMapRef.current!,
                });

                // Click handler
                marker.addListener('click', () => {
                    setSelectedPonto(ponto);
                });

                return marker;
            });

        markersRef.current = markers;

        // Criar cluster
        if (markers.length > 0) {
            clustererRef.current = new MarkerClusterer({
                map: googleMapRef.current,
                markers,
            });
        }

        // Ajustar bounds se houver pontos
        if (markers.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            markers.forEach((marker) => {
                const pos = marker.getPosition();
                if (pos) bounds.extend(pos);
            });
            googleMapRef.current.fitBounds(bounds);
        }
    }, [pontos, isLoaded, setSelectedPonto]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />

            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">Carregando mapa...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
