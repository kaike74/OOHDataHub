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
    isMenuOpen: boolean;
    currentView: 'map' | 'exibidoras' | 'clientes' | 'propostas' | 'contas';
    selectedCliente: Cliente | null;
    selectedProposta: Proposta | null;
    streetViewCoordinates: { lat: number; lng: number } | null;
    streetViewRequest: { lat: number; lng: number } | null;

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
    setMenuOpen: (open: boolean) => void;
    setCurrentView: (view: 'map' | 'exibidoras' | 'clientes' | 'propostas' | 'contas') => void;
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
            isMenuOpen: false,
            currentView: 'map',
            streetViewCoordinates: null,
            streetViewRequest: null,
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

            setSelectedPonto: (ponto) => set((state) => ({
                selectedPonto: ponto,
                // Manter sidebar aberta se há exibidora selecionada (para voltar aos detalhes dela)
                isSidebarOpen: !!ponto || !!state.selectedExibidora,
                // SEMPRE preservar selectedExibidora - não limpar quando ponto é fechado
                // Isso permite voltar aos detalhes da exibidora após fechar detalhes do ponto
                selectedExibidora: state.selectedExibidora,
            })),
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
            })),
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
