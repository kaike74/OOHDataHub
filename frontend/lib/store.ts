import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ponto, Exibidora, Stats, User, Cliente, Proposta, MapLayer } from './types';

interface AppState {
    // Auth
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;

    // Data
    pontos: Ponto[];
    exibidoras: Exibidora[];
    stats: Stats | null;

    // UI State
    selectedPonto: Ponto | null;
    editingPonto: Ponto | null;
    selectedExibidora: Exibidora | null;
    editingExibidora: Exibidora | null;
    isSidebarOpen: boolean;
    isModalOpen: boolean;
    isExibidoraModalOpen: boolean;
    isExhibitorDetailsOpen: boolean;
    exibidoraFormMode: 'full' | 'contacts';
    isMenuOpen: boolean;
    currentView: 'map' | 'exibidoras' | 'clientes' | 'propostas' | 'contas' | 'lixeira';
    selectedCliente: Cliente | null;
    selectedProposta: Proposta | null;
    streetViewCoordinates: { lat: number; lng: number } | null;
    streetViewRequest: { lat: number; lng: number } | null;

    // Point Details Modal State
    isPointModalOpen: boolean;
    pointModalIndex: number; // Index in cart items for navigation
    hoveredCartItemId: number | null; // ID of cart item being hovered
    highlightedPointId: number | null; // ID of point to highlight (for "Ver na Proposta" animation)

    // Modal Navigation Context - tracks which modal was opened from which
    modalNavigationSource: 'exhibitor' | 'point' | 'map' | null;

    // Filters
    filterCidade: string[];
    filterUF: string[];
    filterPais: string[];
    filterExibidora: number[];
    filterTipos: string[];
    filterValorMin: number | null;
    filterValorMax: number | null;
    searchQuery: string;
    filterText: string; // For real-time search filtering

    // Auth Actions
    setAuth: (user: User, token: string) => void;
    logout: () => void;

    // Actions
    setPontos: (pontos: Ponto[]) => void;
    setExibidoras: (exibidoras: Exibidora[]) => void;
    setStats: (stats: Stats) => void;
    setSelectedPonto: (ponto: Ponto | null) => void;
    setEditingPonto: (ponto: Ponto | null) => void;
    setSelectedExibidora: (exibidora: Exibidora | null) => void;
    setEditingExibidora: (exibidora: Exibidora | null) => void;
    setSelectedCliente: (cliente: Cliente | null) => void;
    setSelectedProposta: (proposta: Proposta | null) => void;
    setSidebarOpen: (open: boolean) => void;
    setModalOpen: (open: boolean) => void;
    setExibidoraModalOpen: (open: boolean) => void;
    setExhibitorDetailsOpen: (open: boolean) => void;
    setExibidoraFormMode: (mode: 'full' | 'contacts') => void;
    setMenuOpen: (open: boolean) => void;
    setCurrentView: (view: 'map' | 'exibidoras' | 'clientes' | 'propostas' | 'contas' | 'lixeira') => void;
    setStreetViewCoordinates: (coords: { lat: number; lng: number } | null) => void;
    setStreetViewRequest: (request: { lat: number; lng: number } | null) => void;
    setFilterCidade: (cidades: string[]) => void;
    setFilterUF: (ufs: string[]) => void;
    setFilterPais: (paises: string[]) => void;
    setFilterExibidora: (ids: number[]) => void;
    setFilterTipos: (tipos: string[]) => void;
    setFilterValorMin: (valor: number | null) => void;
    setFilterValorMax: (valor: number | null) => void;
    setSearchQuery: (query: string) => void;
    setFilterText: (text: string) => void;
    clearFilters: () => void;

    // Point Modal Actions
    setPointModalOpen: (open: boolean) => void;
    setPointModalIndex: (index: number) => void;
    setHoveredCartItemId: (id: number | null) => void;
    setHighlightedPointId: (id: number | null) => void;
    openPointModal: (ponto: Ponto, index?: number) => void;

    // Modal Navigation Actions
    setModalNavigationSource: (source: 'exhibitor' | 'point' | 'map' | null) => void;

    // Custom Layers
    customLayers: MapLayer[];
    setCustomLayers: (layers: MapLayer[]) => void;
    addCustomLayer: (layer: MapLayer) => void;
    toggleLayerVisibility: (layerId: string) => void;
    removeLayer: (layerId: string) => void;
    updateLayerColor: (layerId: string, color: string) => void;
    updateCustomMarkerPosition: (layerId: string, markerId: string, lat: number, lng: number) => void;
    updateLayerData: (layerId: string, updates: Partial<MapLayer>) => void;

    refreshProposta: (proposta: Proposta) => void;
}

export const useStore = create<AppState>()(
    persist(
        (set) => ({
            // Auth initial state
            user: null,
            token: null,
            isAuthenticated: false,

            // Initial state
            pontos: [],
            exibidoras: [],
            customLayers: [], // Initialize customLayers
            stats: null,
            selectedPonto: null,
            editingPonto: null,
            selectedExibidora: null,
            editingExibidora: null,
            selectedCliente: null,
            selectedProposta: null,
            isSidebarOpen: false,
            isModalOpen: false,
            isExibidoraModalOpen: false,
            exibidoraFormMode: 'full',
            isMenuOpen: false,
            currentView: 'map',
            streetViewCoordinates: null,
            streetViewRequest: null,

            // Exhibitor Details Modal State
            isExhibitorDetailsOpen: false,

            // Point Modal State
            isPointModalOpen: false,
            pointModalIndex: 0,
            hoveredCartItemId: null,
            highlightedPointId: null,
            modalNavigationSource: null,

            filterCidade: [],
            filterUF: [],
            filterPais: [],
            filterExibidora: [],
            filterTipos: [],
            filterValorMin: null,
            filterValorMax: null,
            searchQuery: '',
            filterText: '',

            // Auth Actions
            setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
            logout: () => set({
                user: null,
                token: null,
                isAuthenticated: false,
                pontos: [],
                exibidoras: [],
                customLayers: [],
                stats: null,
                selectedPonto: null,
                editingPonto: null,
                selectedExibidora: null,
                editingExibidora: null,
                selectedCliente: null,
                selectedProposta: null,
            }),

            // Actions
            setPontos: (pontos) => set({ pontos }),
            setExibidoras: (exibidoras) => set({ exibidoras }),
            setStats: (stats) => set({ stats }),

            // Custom Layers Actions
            setCustomLayers: (layers) => set({ customLayers: layers }),
            addCustomLayer: (layer) => set((state) => ({ customLayers: [...state.customLayers, layer] })),
            toggleLayerVisibility: (layerId) => set((state) => ({
                customLayers: state.customLayers.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l)
            })),
            removeLayer: (layerId) => set((state) => ({
                customLayers: state.customLayers.filter(l => l.id !== layerId)
            })),
            updateLayerColor: (layerId, color) => set((state) => ({
                customLayers: state.customLayers.map(l => l.id === layerId ? { ...l, color } : l)
            })),
            updateCustomMarkerPosition: (layerId, markerId, lat, lng) => set((state) => ({
                customLayers: state.customLayers.map(l =>
                    l.id === layerId
                        ? { ...l, markers: l.markers.map(m => m.id === markerId ? { ...m, lat, lng } : m) }
                        : l
                )
            })),
            updateLayerData: (layerId, updates) => set((state) => ({
                customLayers: state.customLayers.map(l => l.id === layerId ? { ...l, ...updates } : l)
            })),

            setSelectedPonto: (ponto) => {
                console.log('🔧 ZUSTAND setSelectedPonto called with:', ponto?.codigo_ooh || null);
                return set((state) => ({
                    selectedPonto: ponto,
                    // Manter sidebar aberta se há exibidora selecionada (para voltar aos detalhes dela)
                    isSidebarOpen: !!ponto || !!state.selectedExibidora,
                    // SEMPRE preservar selectedExibidora - não limpar quando ponto é fechado
                    // Isso permite voltar aos detalhes da exibidora após fechar detalhes do ponto
                    selectedExibidora: state.selectedExibidora,
                }));
            },
            setEditingPonto: (ponto) => set({ editingPonto: ponto }),
            setSelectedExibidora: (exibidora) => set({
                selectedExibidora: exibidora,
                isSidebarOpen: !!exibidora,
                selectedPonto: null,
            }),
            setEditingExibidora: (exibidora) => set({ editingExibidora: exibidora }),
            setSelectedCliente: (cliente) => set({ selectedCliente: cliente }),
            setSelectedProposta: (proposta) => set({ selectedProposta: proposta }),
            setSidebarOpen: (open) => set({
                isSidebarOpen: open,
                selectedPonto: open ? undefined : null,
                selectedExibidora: open ? undefined : null,
            }),
            setModalOpen: (open) => set((state) => ({
                isModalOpen: open,
                // Só limpa editingPonto ao FECHAR o modal
                editingPonto: open ? state.editingPonto : null,
            })),
            setExibidoraModalOpen: (open) => set((state) => ({
                isExibidoraModalOpen: open,
                // Só limpa editingExibidora ao FECHAR o modal
                editingExibidora: open ? state.editingExibidora : null,
                exibidoraFormMode: open ? state.exibidoraFormMode : 'full', // Reset to full on close
            })),
            setExhibitorDetailsOpen: (open) => set({ isExhibitorDetailsOpen: open, modalNavigationSource: open ? undefined : null }),
            setExibidoraFormMode: (mode) => set({ exibidoraFormMode: mode }),
            setMenuOpen: (open) => set({ isMenuOpen: open }),
            setCurrentView: (view) => set((state) => ({
                currentView: view,
                isMenuOpen: false,
                // Só limpa sidebar e seleções ao ir para view de exibidoras
                // Ao ir para o mapa, preserva selectedExibidora para abrir a gaveta
                isSidebarOpen: view === 'exibidoras' ? false : state.isSidebarOpen,
                selectedPonto: view === 'exibidoras' ? null : state.selectedPonto,
                selectedExibidora: view === 'exibidoras' ? null : state.selectedExibidora,
            })),
            setStreetViewCoordinates: (coords) => set({ streetViewCoordinates: coords }),
            setStreetViewRequest: (request) => set({ streetViewRequest: request }),
            setFilterCidade: (cidades) => set({ filterCidade: cidades }),
            setFilterUF: (ufs) => set({ filterUF: ufs }),
            setFilterPais: (paises) => set({ filterPais: paises }),
            setFilterExibidora: (ids) => set({ filterExibidora: ids }),
            setFilterTipos: (tipos) => set({ filterTipos: tipos }),
            setFilterValorMin: (valor) => set({ filterValorMin: valor }),
            setFilterValorMax: (valor) => set({ filterValorMax: valor }),
            setSearchQuery: (query) => set({ searchQuery: query }),
            setFilterText: (text) => set({ filterText: text }),
            clearFilters: () => set({
                filterCidade: [],
                filterUF: [],
                filterPais: [],
                filterExibidora: [],
                filterTipos: [],
                filterValorMin: null,
                filterValorMax: null,
                searchQuery: '',
                filterText: '',
            }),

            // Point Modal Actions
            setPointModalOpen: (open) => {
                console.log('🔧 ZUSTAND setPointModalOpen called with:', open);
                // CRITICAL: Only reset modalNavigationSource when CLOSING, not when opening!
                // When opening, preserve the value set by setModalNavigationSource
                if (open) {
                    set({ isPointModalOpen: open });
                } else {
                    set({ isPointModalOpen: open, modalNavigationSource: null });
                }
                console.log('🔧 ZUSTAND after set:', { isPointModalOpen: open, modalNavigationSource: useStore.getState().modalNavigationSource });
            },
            setPointModalIndex: (index) => set({ pointModalIndex: index }),
            setHoveredCartItemId: (id) => set({ hoveredCartItemId: id }),
            setHighlightedPointId: (id) => set({ highlightedPointId: id }),
            openPointModal: (ponto, index = 0) => set({
                selectedPonto: ponto,
                isPointModalOpen: true,
                pointModalIndex: index,
            }),

            // Modal Navigation Actions
            setModalNavigationSource: (source) => {
                console.log('🔧 ZUSTAND setModalNavigationSource called with:', source);
                set({ modalNavigationSource: source });
                console.log('🔧 ZUSTAND after set:', { modalNavigationSource: source });
            },

            refreshProposta: (proposta) => set({ selectedProposta: proposta }),
        }),
        {
            name: 'ooh-auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
