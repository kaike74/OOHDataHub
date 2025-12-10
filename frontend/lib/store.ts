import { create } from 'zustand';
import { Ponto, Exibidora, Stats } from './types';

interface AppState {
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
    currentView: 'map' | 'exibidoras';
    streetViewCoordinates: { lat: number; lng: number } | null;
    streetViewRequest: { lat: number; lng: number } | null;

    // Filters
    filterCidade: string | null;
    filterUF: string | null;
    filterPais: string | null;
    filterExibidora: number | null;
    filterTipos: string[];
    filterValorMin: number | null;
    filterValorMax: number | null;
    searchQuery: string;

    // Actions
    setPontos: (pontos: Ponto[]) => void;
    setExibidoras: (exibidoras: Exibidora[]) => void;
    setStats: (stats: Stats) => void;
    setSelectedPonto: (ponto: Ponto | null) => void;
    setEditingPonto: (ponto: Ponto | null) => void;
    setSelectedExibidora: (exibidora: Exibidora | null) => void;
    setEditingExibidora: (exibidora: Exibidora | null) => void;
    setSidebarOpen: (open: boolean) => void;
    setModalOpen: (open: boolean) => void;
    setExibidoraModalOpen: (open: boolean) => void;
    setMenuOpen: (open: boolean) => void;
    setCurrentView: (view: 'map' | 'exibidoras') => void;
    setStreetViewCoordinates: (coords: { lat: number; lng: number } | null) => void;
    setStreetViewRequest: (request: { lat: number; lng: number } | null) => void;
    setFilterCidade: (cidade: string | null) => void;
    setFilterUF: (uf: string | null) => void;
    setFilterPais: (pais: string | null) => void;
    setFilterExibidora: (id: number | null) => void;
    setFilterTipos: (tipos: string[]) => void;
    setFilterValorMin: (valor: number | null) => void;
    setFilterValorMax: (valor: number | null) => void;
    setSearchQuery: (query: string) => void;
    clearFilters: () => void;
}

export const useStore = create<AppState>((set) => ({
    // Initial state
    pontos: [],
    exibidoras: [],
    stats: null,
    selectedPonto: null,
    editingPonto: null,
    selectedExibidora: null,
    editingExibidora: null,
    isSidebarOpen: false,
    isModalOpen: false,
    isExibidoraModalOpen: false,
    isMenuOpen: false,
    currentView: 'map',
    streetViewCoordinates: null,
    streetViewRequest: null,
    filterCidade: null,
    filterUF: null,
    filterPais: null,
    filterExibidora: null,
    filterTipos: [],
    filterValorMin: null,
    filterValorMax: null,
    searchQuery: '',

    // Actions
    setPontos: (pontos) => set({ pontos }),
    setExibidoras: (exibidoras) => set({ exibidoras }),
    setStats: (stats) => set({ stats }),
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
    setFilterCidade: (cidade) => set({ filterCidade: cidade }),
    setFilterUF: (uf) => set({ filterUF: uf }),
    setFilterPais: (pais) => set({ filterPais: pais }),
    setFilterExibidora: (id) => set({ filterExibidora: id }),
    setFilterTipos: (tipos) => set({ filterTipos: tipos }),
    setFilterValorMin: (valor) => set({ filterValorMin: valor }),
    setFilterValorMax: (valor) => set({ filterValorMax: valor }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    clearFilters: () => set({
        filterCidade: null,
        filterUF: null,
        filterPais: null,
        filterExibidora: null,
        filterTipos: [],
        filterValorMin: null,
        filterValorMax: null,
        searchQuery: '',
    }),
}));
