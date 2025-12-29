import { useEffect, useRef, useState } from 'react';
import { useProposalStore } from '@/stores/useProposalStore';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';

export function useProposalSync() {
    const {
        selectedProposal,
        proposalItems,
        setItems
    } = useProposalStore();

    // Legacy store access to keep CartTable in sync
    const refreshGlobalProposta = useStore(state => state.refreshProposta);

    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedItems, setLastSavedItems] = useState<string>('');
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const isFirstRender = useRef(true);

    // Initialize lastSavedItems on load
    useEffect(() => {
        if (selectedProposal && isFirstRender.current) {
            setLastSavedItems(JSON.stringify(selectedProposal.itens || []));
            isFirstRender.current = false;
        }
    }, [selectedProposal]);

    useEffect(() => {
        if (!selectedProposal) return;

        const currentItemsStr = JSON.stringify(proposalItems);

        // Skip if identical to last save (prevents loops)
        if (currentItemsStr === lastSavedItems) return;

        // Skip if empty on first render/load to avoid wiping
        if (proposalItems.length === 0 && isFirstRender.current) return;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        setIsSaving(true);

        debounceRef.current = setTimeout(async () => {
            try {
                // Ensure we have valid items
                const validItems = proposalItems.map(item => ({
                    ...item,
                    // Ensure dates are strings YYYY-MM-DD
                    periodo_inicio: item.periodo_inicio?.split('T')[0],
                    periodo_fim: item.periodo_fim?.split('T')[0],
                }));

                await api.updateCart(selectedProposal.id, validItems);

                // Update local tracking
                setLastSavedItems(JSON.stringify(proposalItems));

                // Refresh legacy store so CartTable updates
                const updatedProposta = { ...selectedProposal, itens: proposalItems };
                refreshGlobalProposta(updatedProposta);

            } catch (error) {
                console.error("Failed to sync proposal items:", error);
                // Revert? Alert? For now just log.
            } finally {
                setIsSaving(false);
            }
        }, 1000); // 1s debounce

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [proposalItems, selectedProposal, refreshGlobalProposta, lastSavedItems]);

    return { isSaving };
}
