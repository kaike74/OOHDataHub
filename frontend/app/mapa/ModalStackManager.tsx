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

    // React to store changes to automatically set top modal
    useEffect(() => {
        if (isPointOpen) setTopModal('point');
    }, [isPointOpen]);

    useEffect(() => {
        if (isExhibitorOpen) setTopModal('exhibitor');
    }, [isExhibitorOpen]);

    useEffect(() => {
        if (isExhibitorFormOpen) setTopModal('form');
    }, [isExhibitorFormOpen]);

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
