import { create } from 'zustand';
import { Ponto, Exibidora, Stats } from './types';

interface AppState {
    // Data
    pontos: Ponto[];
    exibidoras: Exibidora[];
    stats: Stats | null;

    // UI State
    selectedPonto: Ponto | null;
    isSidebarOpen: boolean;
    isModalOpen: boolean;
    streetViewCoordinates: { lat: number; lng: number } | null;

    // Filters
    filterCidade: string | null;
    filterUF: string | null;
    filterExibidora: number | null;
    searchQuery: string;

    // Actions
    setPontos: (pontos: Ponto[]) => void;
    setExibidoras: (exibidoras: Exibidora[]) => void;
    setStats: (stats: Stats) => void;
    setSelectedPonto: (ponto: Ponto | null) => void;
    setSidebarOpen: (open: boolean) => void;
    setModalOpen: (open: boolean) => void;
    setStreetViewCoordinates: (coords: { lat: number; lng: number } | null) => void;
    setFilterCidade: (cidade: string | null) => void;
    setFilterUF: (uf: string | null) => void;
    setFilterExibidora: (id: number | null) => void;
    setSearchQuery: (query: string) => void;
    clearFilters: () => void;
}

export const useStore = create<AppState>((set) => ({
    // Initial state
    pontos: [],
    exibidoras: [],
    stats: null,
    selectedPonto: null,
    isSidebarOpen: false,
    isModalOpen: false,
    streetViewCoordinates: null,
    filterCidade: null,
    filterUF: null,
    filterExibidora: null,
    searchQuery: '',

    // Actions
    setPontos: (pontos) => set({ pontos }),
    setExibidoras: (exibidoras) => set({ exibidoras }),
    setStats: (stats) => set({ stats }),
    setSelectedPonto: (ponto) => set({
        selectedPonto: ponto,
        isSidebarOpen: !!ponto,
    }),
    setSidebarOpen: (open) => set({
        isSidebarOpen: open,
        selectedPonto: open ? undefined : null,
    }),
    setModalOpen: (open) => set({ isModalOpen: open }),
    setStreetViewCoordinates: (coords) => set({ streetViewCoordinates: coords }),
    setFilterCidade: (cidade) => set({ filterCidade: cidade }),
    setFilterUF: (uf) => set({ filterUF: uf }),
    setFilterExibidora: (id) => set({ filterExibidora: id }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    clearFilters: () => set({
        filterCidade: null,
        filterUF: null,
        filterExibidora: null,
        searchQuery: '',
    }),
}));
