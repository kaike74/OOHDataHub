'use client';

import { useStore } from '@/lib/store';
import PointDetailsModal from '@/components/PointDetailsModal';
import ExhibitorDetailsModal from '@/components/exhibitors/ExhibitorDetailsModal';
import ExibidoraModal from '@/components/ExibidoraModal';
import { useState, useEffect } from 'react';

export function ModalStackManager() {
    const isPointOpen = useStore((state) => state.isPointModalOpen);
    const isExhibitorOpen = useStore((state) => state.isExhibitorDetailsOpen);
    const isExhibitorFormOpen = useStore((state) => state.isExibidoraModalOpen);

    // Track which modal should be on top
    // 'point', 'exhibitor', 'form'
    const [topModal, setTopModal] = useState<'point' | 'exhibitor' | 'form' | null>(null);

    // Function to bring a modal to front
    const bringToFront = (modal: 'point' | 'exhibitor' | 'form') => {
        setTopModal(modal);
    };

    // React to store changes - when a modal opens, it should be on top
    // CRITICAL: Use direct state updates in useEffect to ensure immediate reaction
    useEffect(() => {
        if (isPointOpen && topModal !== 'point') {
            setTopModal('point');
        } else if (!isPointOpen && topModal === 'point') {
            // If point closed, fall back to exhibitor if it's open
            if (isExhibitorOpen) setTopModal('exhibitor');
            else if (isExhibitorFormOpen) setTopModal('form');
            else setTopModal(null);
        }
    }, [isPointOpen, topModal, isExhibitorOpen, isExhibitorFormOpen]);

    useEffect(() => {
        if (isExhibitorOpen && topModal !== 'exhibitor' && !isPointOpen) {
            setTopModal('exhibitor');
        }
    }, [isExhibitorOpen, topModal, isPointOpen]);

    useEffect(() => {
        if (isExhibitorFormOpen && topModal !== 'form' && !isPointOpen && !isExhibitorOpen) {
            setTopModal('form');
        }
    }, [isExhibitorFormOpen, topModal, isPointOpen, isExhibitorOpen]);

    // Base Z-Indices
    const BASE_Z = 2000;

    const getZIndex = (modal: 'point' | 'exhibitor' | 'form') => {
        if (topModal === modal) return BASE_Z + 20; // Active is highest
        // Conflict resolution if multiple are open but not top
        // Default hierarchy if not top: Form > Exhibitor > Point
        if (modal === 'form') return BASE_Z + 15;
        if (modal === 'exhibitor') return BASE_Z + 10;
        return BASE_Z;
    };

    return (
        <>
            {/* Point Modal */}
            <div onClickCapture={() => isPointOpen && bringToFront('point')}>
                <PointDetailsModal
                    zIndex={getZIndex('point')}
                />
            </div>

            {/* Exhibitor Details Modal */}
            <div onClickCapture={() => isExhibitorOpen && bringToFront('exhibitor')}>
                <ExhibitorDetailsModal
                    zIndex={getZIndex('exhibitor')}
                />
            </div>

            {/* Exhibitor Form (Always high usually, but let's manage it too) */}
            <ExibidoraModal
                zIndex={getZIndex('form')}
            />
        </>
    );
}
