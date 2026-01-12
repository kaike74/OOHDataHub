'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Eye, ShoppingCart, Building2 } from 'lucide-react';

interface MapTooltipProps {
  ponto: Ponto;
  position: { x: number; y: number };
  onStreetViewClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  readOnly?: boolean;
  showProposalActions?: boolean;
}

export default function MapTooltip({
  ponto,
  position,
  onStreetViewClick,
  onMouseEnter,
  onMouseLeave,
  readOnly = false,
  showProposalActions = true,
  ...props
}: MapTooltipProps) {
  const exibidoras = useStore((state) => state.exibidoras);
  const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
  const setFilterExibidora = useStore((state) => state.setFilterExibidora);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const selectedProposta = useStore((state) => state.selectedProposta);
  const refreshProposta = useStore((state) => state.refreshProposta);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imagens = ponto.imagens || [];

  // --- Logic Preserved ---

  const handleExibidoraClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (ponto.id_exibidora) {
      const exibidora = exibidoras.find(ex => ex.id === ponto.id_exibidora);
      if (exibidora) {
        setFilterExibidora([exibidora.id]);
        setSelectedExibidora(exibidora);
        setCurrentView('map');
      }
    }
  }, [ponto.id_exibidora, exibidoras, setFilterExibidora, setSelectedExibidora, setCurrentView]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedProposta) return;

    setIsAdding(true);
    try {
      const cartItens = selectedProposta.itens || [];
      const isInCart = cartItens.some((i: any) => i.id_ooh === ponto.id);

      if (isInCart) {
        const updatedItens = cartItens.filter((i: any) => i.id_ooh !== ponto.id);
        await api.updateCart(selectedProposta.id, updatedItens);
        const updatedProposta = await api.getProposta(selectedProposta.id);
        refreshProposta(updatedProposta);
        return;
      }

      const calcularValorComissao = (valorBase: number, comissao: string): number => {
        if (comissao === 'V0') return parseFloat((valorBase * 2).toFixed(2));
        const v2 = valorBase * 1.25;
        if (comissao === 'V2') return parseFloat(v2.toFixed(2));
        const v3 = v2 * 1.25;
        if (comissao === 'V3') return parseFloat(v3.toFixed(2));
        const v4 = v3 * 1.25;
        return parseFloat(v4.toFixed(2));
      };

      const papelProduto = ponto.produtos?.find(p => p.tipo.toLowerCase().includes('papel'));
      const lonaProduto = ponto.produtos?.find(p => p.tipo.toLowerCase().includes('lona'));
      const locacaoProduto = ponto.produtos?.find(p =>
        p.tipo.toLowerCase().includes('locação') ||
        p.tipo.toLowerCase().includes('locacao') ||
        p.tipo.toLowerCase().includes('bissemanal') ||
        p.tipo.toLowerCase().includes('mensal')
      );

      const valorPapel = papelProduto ? parseFloat((papelProduto.valor * 1.25).toFixed(2)) : 0;
      const valorLona = lonaProduto ? parseFloat((lonaProduto.valor * 1.25).toFixed(2)) : 0;
      const valorLocacao = locacaoProduto ? calcularValorComissao(locacaoProduto.valor, selectedProposta.comissao) : 0;

      const item = {
        id_proposta: selectedProposta.id,
        id_ooh: ponto.id,
        periodo_inicio: new Date().toISOString().split('T')[0],
        periodo_fim: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        valor_locacao: valorLocacao,
        valor_papel: valorPapel,
        valor_lona: valorLona,
        periodo_comercializado: 'bissemanal',
        observacoes: '',
        fluxo_diario: ponto.fluxo || 0
      };

      const data = await api.getProposta(selectedProposta.id);
      const currentItens = data.itens || [];
      if (currentItens.some((i: any) => i.id_ooh === ponto.id)) return;

      const newItens = [...currentItens, item];
      await api.updateCart(selectedProposta.id, newItens);
      const updatedProposta = await api.getProposta(selectedProposta.id);
      refreshProposta(updatedProposta);

    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setIsAdding(false);
    }
  }, [ponto, selectedProposta, refreshProposta]);

  // Image Rotation
  useEffect(() => {
    if (imagens.length <= 1) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [imagens.length]);

  useEffect(() => { setCurrentImageIndex(0); }, [ponto.id]);

  const currentImageUrl = imagens.length > 0
    ? api.getImageUrl(imagens[currentImageIndex])
    : '/assets/placeholder_ooh.png'; // Fallback if needed, logic handled in image rendering usually

  const formatAddress = (address: string) => {
    return address.split(',').map(p => p.trim());
  };
  const addressParts = formatAddress(ponto.endereco);
  const mainAddress = addressParts[0] + (addressParts[1] ? `, ${addressParts[1]}` : '');

  // --- Render ---

  // Collision Detection
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedStyle, setAdjustedStyle] = useState<React.CSSProperties>({
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: 'translate(-50%, -100%) translateY(-45px)'
  });

  useEffect(() => {
    if (!tooltipRef.current) return;

    const rect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default above
    let newTransform = 'translate(-50%, -100%) translateY(-45px)';

    // Check Right Edge
    if (rect.right > viewportWidth - 20) {
      newTransform = 'translate(-100%, -100%) translateY(-45px) translateX(-10px)';
    }
    // Check Left Edge
    if (rect.left < 20) {
      newTransform = 'translate(0%, -100%) translateY(-45px) translateX(10px)';
    }
    // Check Top Edge (if too close to top, flip to bottom)
    if (rect.top < 80) {
      // Flip to bottom (clear pin downwards)
      // Pin height approx 40px, so shift down by 20px from point is likely safe overlap at bottom, but let's clear it: 45px
      newTransform = newTransform.replace('-100%) translateY(-45px)', '0%) translateY(45px)');
    }

    setAdjustedStyle({
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: newTransform
    });

  }, [position]);


  return (
    <div
      ref={tooltipRef}
      className="absolute z-[9999] pointer-events-auto"
      style={adjustedStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={props.onClick}
    >
      {/* 
        Card Container 
        Matches the "Card" UX request: 
        - Fixed size
        - Image background
        - Hover blur effect
        - TextBox overlay with transition
        - Added onClick handler to container
      */}
      <div
        onClick={(e) => {
          // If clicking buttons inside, stop propagation is handled there.
          // If clicking the card itself:
          if (props.onClick) props.onClick();
        }}
        className="group relative w-[220px] h-[280px] bg-[#313131] rounded-[20px] shadow-2xl overflow-hidden cursor-pointer transition-all duration-300 ease-in-out hover:scale-105"
      >

        {/* Layer 1: Image (Background) */}
        {imagens.length > 0 && (
          <div className="absolute inset-0 z-0 h-full w-full transition-all duration-300 ease-in-out group-hover:blur-[3px] group-hover:scale-110">
            <img
              src={currentImageUrl}
              alt={ponto.codigo_ooh}
              className="w-full h-full object-cover"
            />
            {/* Dark gradient for text readability (always present but stronger on bottom) */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          </div>
        )}

        {/* Layer 2: TextBox (Content Overlay) */}
        <div className="absolute inset-x-2 bottom-2 z-10 flex flex-col justify-end p-3 gap-2 bg-black/60 backdrop-blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 ease-in-out translate-y-4 group-hover:translate-y-0">

          {/* Header Info */}
          <div className="flex flex-col gap-0.5">
            <span className="text-xl font-bold text-white tracking-wide drop-shadow-md">
              {ponto.codigo_ooh}
            </span>
            <span className="text-xs text-gray-200 font-light line-clamp-2 drop-shadow-sm">
              {ponto.endereco}
            </span>
            {ponto.exibidora_nome && (
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 size={12} className="text-gray-300" />
                <span className="text-[10px] text-gray-300 uppercase tracking-wider">{ponto.exibidora_nome}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-2 w-full">
            {/* Street View Button */}
            {ponto.latitude && ponto.longitude && (
              <button
                onClick={(e) => { e.stopPropagation(); onStreetViewClick?.(); }}
                className="flex items-center justify-center gap-2 w-full py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 rounded-xl text-white text-xs font-bold transition-all"
              >
                <Eye size={14} />
                Street View
              </button>
            )}

            {/* Add/Remove Cart Button */}
            {showProposalActions && !readOnly && selectedProposta && (() => {
              const isInCart = selectedProposta.itens?.some((i: any) => i.id_ooh === ponto.id) || false;
              return (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold transition-all ${isInCart
                    ? 'bg-red-500/80 hover:bg-red-500 text-white backdrop-blur-md'
                    : 'bg-green-500/80 hover:bg-green-500 text-white backdrop-blur-md'
                    }`}
                >
                  {isAdding ? (
                    <div className="animate-spin h-3 w-3 border-2 border-white/50 border-t-white rounded-full" />
                  ) : (
                    <ShoppingCart size={14} />
                  )}
                  {isInCart ? 'Remover' : 'Adicionar'}
                </button>
              );
            })()}
          </div>

        </div>

        {/* Default State (Visible when NOT hovering) - Optional */}
        {/* The user requested "hover moves image up / reveals info". 
            But typically users need to see *at least* the code to know what they are hovering.
            The user's example shows "TextBox opacity 0" initially. 
            I will keep it 0 as requested to match the reference exactly, 
            so it looks just like an image tile until interaction. 
            
            However, for a map pin tooltip, completely blank image might be confusing?
            No, the pin itself is on the map. The tooltip appears when hovering the pin.
            So showing just the image is fine.
        */}
      </div>

      {/* Seta do tooltip (Optional, style-dependent. The card user showed doesn't have one, but for a map tooltip it's useful to point to location) */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          width: 0,
          height: 0,
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid #313131', // Matches card bg
        }}
      />
    </div>
  );
}
