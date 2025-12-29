import { create } from 'zustand';
import { Proposta, PropostaItem, SharedUser } from '@/lib/types';

interface ProposalUiState {
    isSidebarOpen: boolean;
    isCartOpen: boolean;
    sidebarTab: 'filter' | 'list' | 'details'; // filter = search, list = results, details = selected point
    viewMode: 'map' | 'list'; // Mobile toggle
    expandedCart: boolean; // Full screen cart mode
}

interface ProposalStore {
    // Data
    selectedProposal: Proposta | null;
    proposalItems: PropostaItem[];
    collaborators: SharedUser[];

    // UI State
    ui: ProposalUiState;

    // Actions
    setProposal: (proposal: Proposta | null) => void;
    setItems: (items: PropostaItem[]) => void;
    updateItem: (itemId: number, updates: Partial<PropostaItem>) => void;
    toggleSidebar: (isOpen?: boolean) => void;
    toggleCart: (isOpen?: boolean) => void;
    setSidebarTab: (tab: ProposalUiState['sidebarTab']) => void;
    setCollaborators: (users: SharedUser[]) => void;
    reset: () => void;
}

export const useProposalStore = create<ProposalStore>((set) => ({
    selectedProposal: null,
    proposalItems: [],
    collaborators: [],

    ui: {
        isSidebarOpen: true,
        isCartOpen: true,
        sidebarTab: 'filter',
        viewMode: 'map',
        expandedCart: false
    },

    setProposal: (proposal) => set({
        selectedProposal: proposal,
        proposalItems: proposal?.itens || [],
        collaborators: proposal?.sharedUsers || []
    }),

    setItems: (items) => set({ proposalItems: items }),

    updateItem: (itemId, updates) => set((state) => ({
        proposalItems: state.proposalItems.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        )
    })),

    toggleSidebar: (isOpen) => set((state) => ({
        ui: { ...state.ui, isSidebarOpen: isOpen ?? !state.ui.isSidebarOpen }
    })),

    toggleCart: (isOpen) => set((state) => ({
        ui: { ...state.ui, isCartOpen: isOpen ?? !state.ui.isCartOpen }
    })),

    setSidebarTab: (tab) => set((state) => ({
        ui: { ...state.ui, sidebarTab: tab }
    })),

    setCollaborators: (users) => set({ collaborators: users }),

    reset: () => set({
        selectedProposal: null,
        proposalItems: [],
        collaborators: [],
        ui: {
            isSidebarOpen: true,
            isCartOpen: true,
            sidebarTab: 'filter',
            viewMode: 'map',
            expandedCart: false
        }
    })
}));
