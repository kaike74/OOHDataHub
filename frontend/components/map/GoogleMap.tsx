'use client';

import { useEffect, useRef, useState } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useStore } from '@/lib/store';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';
import MapTooltip from '@/components/MapTooltip';
import { MapPin } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface GoogleMapProps {
    searchLocation?: { lat: number; lng: number; address: string } | null;
}

export default function GoogleMap({ searchLocation }: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const pontos = useStore((state) => state.pontos);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const setModalOpen = useStore((state) => state.setModalOpen);
    const setStreetViewCoordinates = useStore((state) => state.setStreetViewCoordinates);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isStreetViewMode, setIsStreetViewMode] = useState(false);
    const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [hoveredPonto, setHoveredPonto] = useState<Ponto | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

            // Configurar Street View
            const panorama = googleMapRef.current.getStreetView();
            streetViewRef.current = panorama;

            // Listener para detectar mudança para Street View
            panorama.addListener('visible_changed', () => {
                const isVisible = panorama.getVisible();
                setIsStreetViewMode(isVisible);

                if (isVisible) {
                    const position = panorama.getPosition();
                    if (position) {
                        setStreetViewPosition({
                            lat: position.lat(),
                            lng: position.lng()
                        });
                    }
                }
            });

            // Listener para atualizar posição no Street View
            panorama.addListener('position_changed', () => {
                const position = panorama.getPosition();
                if (position) {
                    setStreetViewPosition({
                        lat: position.lat(),
                        lng: position.lng()
                    });
                }
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

                // Hover handler - mostrar tooltip
                marker.addListener('mouseover', (event: google.maps.MapMouseEvent) => {
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                    }

                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredPonto(ponto);

                        // Calcular posição do tooltip na tela
                        const scale = Math.pow(2, googleMapRef.current!.getZoom()!);
                        const nw = new google.maps.LatLng(
                            googleMapRef.current!.getBounds()!.getNorthEast().lat(),
                            googleMapRef.current!.getBounds()!.getSouthWest().lng()
                        );
                        const worldCoordinateNW = googleMapRef.current!.getProjection()!.fromLatLngToPoint(nw);
                        const worldCoordinate = googleMapRef.current!.getProjection()!.fromLatLngToPoint(marker.getPosition()!);

                        if (worldCoordinate && worldCoordinateNW) {
                            const pixelOffset = new google.maps.Point(
                                Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
                                Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
                            );

                            setTooltipPosition({
                                x: pixelOffset.x,
                                y: pixelOffset.y
                            });
                        }
                    }, 200);
                });

                marker.addListener('mouseout', () => {
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                    }
                    // Delay maior para permitir que o usuário mova o mouse para o tooltip
                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredPonto(null);
                    }, 300);
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

    // Centralizar mapa quando search location mudar
    useEffect(() => {
        if (searchLocation && googleMapRef.current) {
            const location = new google.maps.LatLng(searchLocation.lat, searchLocation.lng);
            googleMapRef.current.setCenter(location);
            googleMapRef.current.setZoom(17);

            // Adicionar marker temporário
            const marker = new google.maps.Marker({
                position: location,
                map: googleMapRef.current,
                animation: google.maps.Animation.DROP,
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#FC1E75',
                    fillOpacity: 0.8,
                    strokeColor: '#FFFFFF',
                    strokeWeight: 2
                }
            });

            // Remover marker após 3 segundos
            setTimeout(() => {
                marker.setMap(null);
            }, 3000);
        }
    }, [searchLocation]);

    const handleStreetViewClick = (ponto: Ponto) => {
        if (ponto.latitude && ponto.longitude && streetViewRef.current) {
            const position = new google.maps.LatLng(ponto.latitude, ponto.longitude);
            streetViewRef.current.setPosition(position);
            streetViewRef.current.setVisible(true);
        }
    };

    const handleCadastrarAqui = () => {
        if (!streetViewPosition) return;

        // Passar coordenadas para o modal via Zustand
        setStreetViewCoordinates(streetViewPosition);
        setModalOpen(true);
    };

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />

            {/* Tooltip no Hover */}
            {hoveredPonto && isLoaded && !isStreetViewMode && (
                <MapTooltip
                    ponto={hoveredPonto}
                    position={tooltipPosition}
                    onStreetViewClick={() => handleStreetViewClick(hoveredPonto)}
                    onMouseEnter={() => {
                        // Cancela o timeout de fechar quando o mouse entra no tooltip
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                        }
                    }}
                    onMouseLeave={() => {
                        // Fecha o tooltip quando o mouse sai
                        setHoveredPonto(null);
                    }}
                />
            )}

            {/* Botão Cadastrar Aqui - Street View */}
            {isStreetViewMode && streetViewPosition && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <button
                        onClick={handleCadastrarAqui}
                        className="px-6 py-3 bg-emidias-accent hover:bg-[#E01A6A] text-white rounded-lg shadow-2xl font-bold flex items-center gap-2 transition hover-lift animate-pulse"
                    >
                        <MapPin size={20} />
                        📍 Cadastrar Aqui
                    </button>
                    <div className="text-center mt-2 bg-black/60 text-white text-xs px-3 py-1 rounded-full">
                        {streetViewPosition.lat.toFixed(6)}, {streetViewPosition.lng.toFixed(6)}
                    </div>
                </div>
            )}

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
