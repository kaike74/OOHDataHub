'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { useStore } from '@/lib/store';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';
import MapTooltip from '@/components/MapTooltip';
import MapLayers from './MapLayers';
import AIChat from '@/components/AIChat';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

interface GoogleMapProps {
    searchLocation?: { lat: number; lng: number; address: string } | null;
    readOnly?: boolean;
}

export default function GoogleMap({ searchLocation, readOnly = false }: GoogleMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const streetViewRef = useRef<google.maps.StreetViewPanorama | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const customMarkersRef = useRef<google.maps.Marker[]>([]);
    const clustererRef = useRef<MarkerClusterer | null>(null);
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const pontos = useStore((state) => state.pontos);
    const customLayers = useStore((state) => state.customLayers);
    const filterExibidora = useStore((state) => state.filterExibidora);
    const filterPais = useStore((state) => state.filterPais);
    const filterUF = useStore((state) => state.filterUF);
    const filterCidade = useStore((state) => state.filterCidade);
    const filterTipos = useStore((state) => state.filterTipos);
    const filterValorMin = useStore((state) => state.filterValorMin);
    const filterValorMax = useStore((state) => state.filterValorMax);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const setModalOpen = useStore((state) => state.setModalOpen);
    const setStreetViewCoordinates = useStore((state) => state.setStreetViewCoordinates);
    const streetViewRequest = useStore((state) => state.streetViewRequest);
    const setStreetViewRequest = useStore((state) => state.setStreetViewRequest);
    const selectedProposta = useStore((state) => state.selectedProposta);
    const isAuthenticated = useStore((state) => state.isAuthenticated);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isStreetViewMode, setIsStreetViewMode] = useState(false);
    const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [hoveredPonto, setHoveredPonto] = useState<Ponto | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lat: number; lng: number; address: string } | null>(null);

    // Inicializar mapa
    useEffect(() => {
        const initMap = async () => {
            if (googleMapRef.current) return; // Prevent re-init

            try {
                const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');

                setOptions({
                    key: GOOGLE_MAPS_API_KEY,
                    v: "weekly",
                });

                await importLibrary("maps");
                await importLibrary("geocoding");
                await importLibrary("places");

                if (!mapRef.current) return;

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

                if (panorama) {
                    panorama.addListener('visible_changed', () => {
                        const isVisible = panorama.getVisible();
                        setIsStreetViewMode(isVisible);
                        if (isVisible) {
                            const position = panorama.getPosition();
                            if (position) setStreetViewPosition({ lat: position.lat(), lng: position.lng() });
                        }
                    });
                    panorama.addListener('position_changed', () => {
                        const position = panorama.getPosition();
                        if (position) setStreetViewPosition({ lat: position.lat(), lng: position.lng() });
                    });
                }

                googleMapRef.current.addListener('rightclick', async (event: google.maps.MapMouseEvent) => {
                    const lat = event.latLng?.lat();
                    const lng = event.latLng?.lng();

                    if (lat !== undefined && lng !== undefined) {
                        try {
                            const geocoder = new google.maps.Geocoder();
                            const result = await geocoder.geocode({ location: { lat, lng } });
                            const address = result.results[0]?.formatted_address || 'Endereço não encontrado';

                            const domEvent = event.domEvent as MouseEvent;
                            setContextMenu({ x: domEvent.clientX, y: domEvent.clientY, lat, lng, address });
                        } catch (error) {
                            console.error('Erro ao buscar endereço:', error);
                        }
                    }
                });

                setIsLoaded(true);

            } catch (error) {
                console.error("Error loading Google Maps:", error);
            }
        };

        initMap();
    }, []);

    // 1. Memoize filtered points to avoid recalculating on every render
    const filteredPontos = useMemo(() => {
        if (!isLoaded) return [];

        return pontos.filter((ponto: Ponto) => {
            // Guest/Public View Mode: Show ONLY points in the proposal
            if (!isAuthenticated && selectedProposta) {
                const isInProposal = selectedProposta.itens?.some((item: any) => item.id_ooh === ponto.id);
                if (!isInProposal) return false;
            }

            // Filtro por país
            if (filterPais.length > 0 && !filterPais.includes(ponto.pais || '')) return false;
            // Filtro por UF
            if (filterUF.length > 0 && !filterUF.includes(ponto.uf || '')) return false;
            // Filtro por cidade
            if (filterCidade.length > 0 && !filterCidade.includes(ponto.cidade || '')) return false;
            // Filtro por exibidora
            if (filterExibidora.length > 0 && !filterExibidora.includes(ponto.id_exibidora || 0)) return false;
            // Filtro por tipos
            if (filterTipos.length > 0) {
                const pontoTipos = ponto.tipo?.split(',').map(t => t.trim()) || [];
                if (!filterTipos.some(t => pontoTipos.includes(t))) return false;
            }
            // Filtro por faixa de valor
            if (filterValorMin !== null || filterValorMax !== null) {
                const locacaoProdutos = ponto.produtos?.filter(p => p.tipo === 'Locação') || [];
                if (locacaoProdutos.length === 0) return false;
                const valores = locacaoProdutos.map(p => p.valor);
                const maxValor = Math.max(...valores);
                const minValor = Math.min(...valores);
                if (filterValorMin !== null && maxValor < filterValorMin) return false;
                if (filterValorMax !== null && minValor > filterValorMax) return false;
            }
            return true;
        });
    }, [pontos, filterExibidora, filterPais, filterUF, filterCidade, filterTipos, filterValorMin, filterValorMax, isLoaded, isAuthenticated, selectedProposta]);

    // 2. Effect for Fitting Bounds (Run ONLY when filtered points change)
    useEffect(() => {
        if (!googleMapRef.current || filteredPontos.length === 0) return;

        const bounds = new google.maps.LatLngBounds();
        let hasValidPoints = false;

        filteredPontos.forEach((ponto) => {
            if (ponto.latitude && ponto.longitude) {
                bounds.extend({ lat: ponto.latitude, lng: ponto.longitude });
                hasValidPoints = true;
            }
        });

        if (hasValidPoints) {
            googleMapRef.current.fitBounds(bounds);
        }
    }, [filteredPontos]);

    // 3. Effect for Rendering Markers (Run when points OR proposal/cart changes)
    useEffect(() => {
        if (!googleMapRef.current) return;

        // Clear old markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        // Get cart item IDs
        const cartItemIds = new Set(
            selectedProposta?.itens?.map((item: any) => item.id_ooh) || []
        );

        // Create new markers
        const markers = filteredPontos
            .filter((ponto: Ponto) => ponto.latitude && ponto.longitude)
            .map((ponto: Ponto) => {
                const isInCart = cartItemIds.has(ponto.id);

                const isGhost = ponto.status === 'pendente_validacao';

                const marker = new google.maps.Marker({
                    position: { lat: ponto.latitude!, lng: ponto.longitude! },
                    title: ponto.codigo_ooh,
                    map: googleMapRef.current!,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: isGhost ? '#9CA3AF' : (isInCart ? '#10B981' : '#3B82F6'), // Gray for ghost, Green if in cart
                        fillOpacity: isGhost ? 0.4 : 0.9,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 2
                    }
                });

                marker.addListener('click', () => setSelectedPonto(ponto));

                // Hover logic
                marker.addListener('mouseover', () => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredPonto(ponto);
                        const scale = Math.pow(2, googleMapRef.current!.getZoom()!);
                        const bounds = googleMapRef.current!.getBounds();
                        if (bounds) {
                            const nw = new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng());
                            const worldCoordinateNW = googleMapRef.current!.getProjection()!.fromLatLngToPoint(nw);
                            const worldCoordinate = googleMapRef.current!.getProjection()!.fromLatLngToPoint(marker.getPosition()!);
                            if (worldCoordinate && worldCoordinateNW) {
                                setTooltipPosition({
                                    x: Math.floor((worldCoordinate.x - worldCoordinateNW.x) * scale),
                                    y: Math.floor((worldCoordinate.y - worldCoordinateNW.y) * scale)
                                });
                            }
                        }
                    }, 200);
                });

                marker.addListener('mouseout', () => {
                    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = setTimeout(() => setHoveredPonto(null), 300);
                });

                return marker;
            });

        markersRef.current = markers;

        if (markers.length > 0) {
            clustererRef.current = new MarkerClusterer({
                map: googleMapRef.current,
                markers,
            });
        }

    }, [filteredPontos, selectedProposta, setSelectedPonto]);

    // 4. Effect for Rendering Custom Markers
    useEffect(() => {
        if (!googleMapRef.current) return;

        // Clear old custom markers
        customMarkersRef.current.forEach(marker => marker.setMap(null));
        customMarkersRef.current = [];

        customLayers.forEach(layer => {
            if (!layer.visible) return;

            layer.markers.forEach(customMarker => {
                const marker = new google.maps.Marker({
                    position: { lat: customMarker.lat, lng: customMarker.lng },
                    title: customMarker.title,
                    map: googleMapRef.current!,
                    icon: {
                        path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                        fillColor: layer.color || '#FC1E75',
                        fillOpacity: 1,
                        anchor: new google.maps.Point(12, 22),
                        strokeWeight: 0,
                        scale: 1.2
                    },
                    draggable: true, // Allow user to move marker
                });

                // Optional: Add info window on click for custom markers
                const infoWindow = new google.maps.InfoWindow({
                    content: `<div style="padding: 5px;"><strong>${customMarker.title}</strong><br/>${customMarker.description || ''}</div>`
                });

                marker.addListener('click', () => {
                    infoWindow.open(googleMapRef.current, marker);
                });

                customMarkersRef.current.push(marker);

                // Handle Drag End - Update Store and Persist
                marker.addListener('dragend', async () => {
                    const position = marker.getPosition();
                    if (position && selectedProposta?.id) {
                        const lat = position.lat();
                        const lng = position.lng();

                        // 1. Optimistic Update Local Store
                        useStore.getState().updateCustomMarkerPosition(layer.id, customMarker.id, lat, lng);

                        // 2. Persist to Backend
                        // We need to send the UPDATED markers array for this layer
                        const updatedLayer = useStore.getState().customLayers.find(l => l.id === layer.id);
                        if (updatedLayer) {
                            try {
                                await api.updateProposalLayer(selectedProposta.id, layer.id, {
                                    markers: updatedLayer.markers
                                });
                            } catch (error) {
                                console.error('Failed to save moved marker:', error);
                                // Revert? For now, just log.
                            }
                        }
                    }
                });
            });
        });

    }, [customLayers]);

    // Centralizar mapa quando search location mudar
    useEffect(() => {
        if (searchLocation && googleMapRef.current) {
            const location = new google.maps.LatLng(searchLocation.lat, searchLocation.lng);
            googleMapRef.current.setCenter(location);
            googleMapRef.current.setZoom(17);

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

            setTimeout(() => {
                marker.setMap(null);
            }, 3000);
        }
    }, [searchLocation]);

    // Reagir a solicitações de Street View
    useEffect(() => {
        if (streetViewRequest && streetViewRef.current && isLoaded) {
            const position = new google.maps.LatLng(streetViewRequest.lat, streetViewRequest.lng);
            streetViewRef.current.setPosition(position);
            streetViewRef.current.setVisible(true);
            setStreetViewRequest(null);
        }
    }, [streetViewRequest, isLoaded, setStreetViewRequest]);

    const handleStreetViewClick = useCallback((ponto: Ponto) => {
        if (ponto.latitude && ponto.longitude && streetViewRef.current) {
            const position = new google.maps.LatLng(ponto.latitude, ponto.longitude);
            streetViewRef.current.setPosition(position);
            streetViewRef.current.setVisible(true);
        }
    }, []);

    const handleCadastrarAqui = useCallback(() => {
        if (!streetViewPosition) return;

        setStreetViewCoordinates(streetViewPosition);
        setModalOpen(true);
    }, [streetViewPosition, setStreetViewCoordinates, setModalOpen]);

    const handleCadastrarNoMapa = useCallback(() => {
        if (!contextMenu) return;

        setStreetViewCoordinates({ lat: contextMenu.lat, lng: contextMenu.lng });
        setModalOpen(true);
        setContextMenu(null);
    }, [contextMenu, setStreetViewCoordinates, setModalOpen]);

    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            document.addEventListener('click', handleClick);
            return () => document.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    return (
        <div className="relative w-full h-full">
            <div ref={mapRef} className="w-full h-full" />

            <MapLayers />
            {selectedProposta && <AIChat />}

            {/* Tooltip no Hover */}
            {hoveredPonto && isLoaded && !isStreetViewMode && (
                <MapTooltip
                    ponto={hoveredPonto}
                    position={tooltipPosition}
                    readOnly={!isAuthenticated}
                    onStreetViewClick={() => handleStreetViewClick(hoveredPonto)}
                    onMouseEnter={() => {
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                        }
                    }}
                    onMouseLeave={() => {
                        setHoveredPonto(null);
                    }}
                />
            )}

            {/* Context Menu */}
            {contextMenu && !isStreetViewMode && (
                <div
                    className="fixed z-50 bg-white rounded-xl shadow-emidias-xl border border-gray-200 overflow-hidden"
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                        minWidth: '280px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <p className="text-xs font-mono text-gray-500 mb-1">
                            {contextMenu.lat.toFixed(6)}, {contextMenu.lng.toFixed(6)}
                        </p>
                        <p className="text-sm text-gray-700 font-medium line-clamp-2">
                            {contextMenu.address}
                        </p>
                    </div>
                    <button
                        onClick={handleCadastrarNoMapa}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3 text-sm font-semibold text-emidias-primary"
                    >
                        <div className="bg-emidias-accent/10 p-2 rounded-full">
                            <MapPin size={16} className="text-emidias-accent" />
                        </div>
                        Cadastrar OOH aqui
                    </button>
                </div>
            )}

            {/* Botão Street View */}
            {isStreetViewMode && streetViewPosition && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
                    <Button
                        onClick={handleCadastrarAqui}
                        className="bg-emidias-accent hover:bg-emidias-accent/90 shadow-2xl animate-pulse"
                        size="lg"
                        leftIcon={<MapPin size={20} />}
                    >
                        Cadastrar Aqui
                    </Button>
                    <div className="text-center mt-2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-mono">
                        {streetViewPosition.lat.toFixed(6)}, {streetViewPosition.lng.toFixed(6)}
                    </div>
                </div>
            )}

            {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emidias-primary mx-auto mb-4"></div>
                        <p className="text-gray-500 font-medium">Carregando mapa...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
