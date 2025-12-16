'use client';

import { useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { Ponto, Exibidora } from '@/lib/types';
import { getImageUrl } from '@/lib/api';
import { X, ExternalLink, Plus, MapPin, Phone, Mail, Building2, Router } from 'lucide-react';
import { PointDetailsSidebar } from './PointDetailsSidebar';
import { ExibidoraSidebar } from './ExibidoraSidebar';
import { api } from '@/lib/api';

export default function Sidebar() {
    const selectedPonto = useStore((state) => state.selectedPonto);
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const selectedProposta = useStore((state) => state.selectedProposta);
    const isSidebarOpen = useStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useStore((state) => state.setSidebarOpen);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);
    const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const refreshProposta = useStore((state) => state.refreshProposta);
    const exibidoras = useStore((state) => state.exibidoras);

    const handleClose = () => {
        if (selectedPonto && selectedExibidora) {
            // Caso: vendo detalhes do ponto após ter filtrado por exibidora
            // Voltar para detalhes da exibidora
            setSelectedPonto(null);
        } else {
            // Caso: fechar totalmente
            setSidebarOpen(false);
        }
    };

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isSidebarOpen) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isSidebarOpen, selectedPonto, selectedExibidora]);

    // Auto filtrar por exibidora quando selecionada via Gerenciar Exibidoras
    useEffect(() => {
        if (selectedPonto) {
            const exibidora = exibidoras.find(e => e.id === selectedPonto.id_exibidora);
            if (exibidora) {
                setFilterExibidora([exibidora.id]);
                setSelectedExibidora(exibidora);
                setCurrentView('map');
            }
        }
    }, [selectedPonto, exibidoras, setSidebarOpen, setFilterExibidora, setSelectedExibidora, setCurrentView]);

    const handleAddToProposal = async () => {
        if (!selectedPonto || !selectedProposta) return;

        try {
            console.log('=== DEBUG: Adding to cart ===');
            console.log('Selected Ponto:', selectedPonto);
            console.log('Produtos:', selectedPonto.produtos);

            // Commission Logic
            const comissao = selectedProposta.comissao || 'V2';

            // Find base values from produtos
            const locacaoProduto = selectedPonto.produtos?.find(p => {
                console.log('Checking produto tipo:', p.tipo, 'toLowerCase:', p.tipo?.toLowerCase());
                return p.tipo?.toLowerCase() === 'locação' || p.tipo?.toLowerCase() === 'locacao';
            });
            const papelProduto = selectedPonto.produtos?.find(p => p.tipo?.toLowerCase() === 'papel');
            const lonaProduto = selectedPonto.produtos?.find(p => p.tipo?.toLowerCase() === 'lona');

            console.log('Found locacaoProduto:', locacaoProduto);
            console.log('Found papelProduto:', papelProduto);
            console.log('Found lonaProduto:', lonaProduto);

            const baseValor = locacaoProduto?.valor || 0;

            // Calculate rental value with commission
            let valorLocacao = baseValor;
            if (comissao === 'V2') {
                valorLocacao = baseValor * 1.25;
            } else if (comissao === 'V3') {
                valorLocacao = baseValor * 1.25 * 1.25; // V2 + 25%
            } else if (comissao === 'V4') {
                valorLocacao = baseValor * 1.25 * 1.25 * 1.25; // V3 + 25%
            }

            // For Papel and Lona: always base + 25%, independent of commission
            // Find papel/lona from produtos by tipo
            const basePapel = papelProduto?.valor || 0;
            const baseLona = lonaProduto?.valor || 0;

            const valorPapel = basePapel * 1.25; // Always +25% regardless of commission
            const valorLona = baseLona * 1.25; // Always +25% regardless of commission

            console.log('Calculated values:', {
                valorLocacao,
                valorPapel,
                valorLona
            });

            const item = {
                id_proposta: selectedProposta.id,
                id_ooh: selectedPonto.id,
                periodo_inicio: new Date().toISOString().split('T')[0],
                periodo_fim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                valor_locacao: Math.round(valorLocacao * 100) / 100,
                valor_papel: Math.round(valorPapel * 100) / 100,
                valor_lona: Math.round(valorLona * 100) / 100,
                periodo_comercializado: 'bissemanal',
                observacoes: '',
                fluxo_diario: selectedPonto.fluxo || 0
            };

            console.log('Final item:', item);

            // Fetch current items
            const data = await api.getProposta(selectedProposta.id);
            const currentItens = data.itens || [];

            // Check if already in cart
            if (currentItens.some((i: any) => i.id_ooh === selectedPonto.id)) {
                // Silently return or show a toast (future feature)
                console.log('Item already in cart');
                return;
            }

            const newItens = [...currentItens, item];
            await api.updateCart(selectedProposta.id, newItens);

            // Refetch to get updated proposal with normalized data
            const updatedProposta = await api.getProposta(selectedProposta.id);
            // Update global store to trigger UI updates (Map pins, CartTable)
            useStore.getState().refreshProposta(updatedProposta);

        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
        }
    };

    if (!isSidebarOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40 transition-opacity duration-300"
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-full sm:w-[420px] bg-white shadow-emidias-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col animate-slide-in-right">
                {/* Close Button - Floating */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-50 p-2 bg-white hover:bg-gray-100 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 group"
                    title="Fechar"
                >
                    <X size={20} className="text-gray-600 group-hover:text-gray-900" />
                </button>

                {selectedPonto ? (
                    <>
                        <PointDetailsSidebar
                            ponto={selectedPonto}
                            onAddToProposal={selectedProposta ? handleAddToProposal : undefined}
                        />
                    </>
                ) : selectedExibidora ? (
                    <ExibidoraSidebar exibidora={selectedExibidora} />
                ) : null}
            </div>
        </>
    );
}
