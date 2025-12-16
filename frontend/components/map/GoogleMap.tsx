'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
    const [isLoaded, setIsLoaded] = useState(false);
    const [isStreetViewMode, setIsStreetViewMode] = useState(false);
    const [streetViewPosition, setStreetViewPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [hoveredPonto, setHoveredPonto] = useState<Ponto | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; lat: number; lng: number; address: string } | null>(null);

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

            // Listener para context menu (botão direito)
            googleMapRef.current.addListener('rightclick', async (event: google.maps.MapMouseEvent) => {
                const lat = event.latLng?.lat();
                const lng = event.latLng?.lng();

                if (lat !== undefined && lng !== undefined) {
                    // Geocoding reverso para obter endereço
                    try {
                        const geocoder = new google.maps.Geocoder();
                        const result = await geocoder.geocode({
                            location: { lat, lng }
                        });

                        const address = result.results[0]?.formatted_address || 'Endereço não encontrado';

                        // Calcular posição do menu na tela
                        const domEvent = event.domEvent as MouseEvent;
                        setContextMenu({
                            x: domEvent.clientX,
                            y: domEvent.clientY,
                            lat,
                            lng,
                            address
                        });
                    } catch (error) {
                        console.error('Erro ao buscar endereço:', error);
                    }
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

        // Aplicar TODOS os filtros
        const filteredPontos = pontos.filter((ponto) => {
            // Filtro por país (multi-select)
            if (filterPais.length > 0 && !filterPais.includes(ponto.pais || '')) return false;

            // Filtro por UF (multi-select) - opcional para países sem estados
            if (filterUF.length > 0 && !filterUF.includes(ponto.uf || '')) return false;

            // Filtro por cidade (multi-select)
            if (filterCidade.length > 0 && !filterCidade.includes(ponto.cidade || '')) return false;

            // Filtro por exibidora (multi-select)
            if (filterExibidora.length > 0 && !filterExibidora.includes(ponto.id_exibidora || 0)) return false;

            // Filtro por tipos (verificar se o ponto tem algum dos tipos selecionados)
            if (filterTipos.length > 0) {
                const pontoTipos = ponto.tipo?.split(',').map(t => t.trim()) || [];
                const hasMatchingTipo = filterTipos.some(filterTipo =>
                    pontoTipos.includes(filterTipo)
                );
                if (!hasMatchingTipo) return false;
            }

            // Filtro por faixa de valor (apenas produtos de "Locação")
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

        // Get cart item IDs if there's an active proposal
        const cartItemIds = new Set(
            selectedProposta?.itens?.map((item: any) => item.id_ooh) || []
        );

        // Criar novos markers
        const markers = filteredPontos
            .filter((ponto) => ponto.latitude && ponto.longitude)
            .map((ponto) => {
                // Check if point is in cart
                const isInCart = cartItemIds.has(ponto.id);

                const marker = new google.maps.Marker({
                    position: { lat: ponto.latitude!, lng: ponto.longitude! },
                    title: ponto.codigo_ooh,
                    map: googleMapRef.current!,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 8,
                        fillColor: isInCart ? '#10B981' : '#3B82F6', // Green if in cart, blue otherwise
                        fillOpacity: 0.9,
                        strokeColor: '#FFFFFF',
                        strokeWeight: 2
                    }
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
    }, [pontos, filterExibidora, filterPais, filterUF, filterCidade, filterTipos, filterValorMin, filterValorMax, isLoaded, setSelectedPonto, selectedProposta]);

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

    // Reagir a solicitações de Street View
    useEffect(() => {
        if (streetViewRequest && streetViewRef.current && isLoaded) {
            const position = new google.maps.LatLng(streetViewRequest.lat, streetViewRequest.lng);
            streetViewRef.current.setPosition(position);
            streetViewRef.current.setVisible(true);
            // Limpar o request após processar
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

        // Passar coordenadas para o modal via Zustand
        setStreetViewCoordinates(streetViewPosition);
        setModalOpen(true);
    }, [streetViewPosition, setStreetViewCoordinates, setModalOpen]);

    const handleCadastrarNoMapa = useCallback(() => {
        if (!contextMenu) return;

        // Passar coordenadas para o modal via Zustand
        setStreetViewCoordinates({ lat: contextMenu.lat, lng: contextMenu.lng });
        setModalOpen(true);
        setContextMenu(null);
    }, [contextMenu, setStreetViewCoordinates, setModalOpen]);

    // Fechar context menu ao clicar em qualquer lugar
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

            {/* Context Menu - Botão Direito no Mapa */}
            {contextMenu && !isStreetViewMode && (
                <div
                    className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
                    style={{
                        left: `${contextMenu.x}px`,
                        top: `${contextMenu.y}px`,
                        minWidth: '280px'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header com coordenadas */}
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                        <p className="text-xs font-mono text-gray-600">
                            {contextMenu.lat.toFixed(6)}, {contextMenu.lng.toFixed(6)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                            {contextMenu.address}
                        </p>
                    </div>

                    {/* Botão de cadastrar */}
                    <button
                        onClick={handleCadastrarNoMapa}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 text-sm font-medium text-gray-700"
                    >
                        <MapPin size={16} className="text-emidias-accent" />
                        Cadastrar OOH aqui
                    </button>
                </div>
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
