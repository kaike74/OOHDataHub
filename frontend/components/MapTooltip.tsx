'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { formatCurrency } from '@/lib/utils';
import { User, ShoppingCart, Building2 } from 'lucide-react';

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

      // Get the next valid bi-weekly start date from tomorrow
      const { getNextValidBiWeeklyStartDate, getSuggestedBiWeeklyEndDate, formatDateForInput, getTomorrow } = await import('@/lib/periodUtils');
      const tomorrow = getTomorrow();
      const validStartDate = getNextValidBiWeeklyStartDate(tomorrow);
      const validEndDate = getSuggestedBiWeeklyEndDate(validStartDate);

      const item = {
        id_proposta: selectedProposta.id,
        id_ooh: ponto.id,
        periodo_inicio: formatDateForInput(validStartDate),
        periodo_fim: validEndDate ? formatDateForInput(validEndDate) : formatDateForInput(new Date(validStartDate.getTime() + 13 * 24 * 60 * 60 * 1000)),
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

  // Collision Detection and Smart Positioning
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedStyle, setAdjustedStyle] = useState<React.CSSProperties>({
    left: `${position.x}px`,
    top: `${position.y}px`,
    opacity: 0, // Start invisible to calculate position
    pointerEvents: 'none'
  });
  const [bridgeStyle, setBridgeStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const width = 240; // Fixed width
    const height = rect.height || 380; // Approximate height if not rendered yet
    const gap = 15; // Gap between pin and tooltip

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Cart Table Collision Check
    const cartTable = document.querySelector('[data-cart-table]');
    let cartRect = null;
    if (cartTable) {
      cartRect = cartTable.getBoundingClientRect();
    }

    // Possible positions around the pin (0,0 is pin position)
    // Priorities: Top > TopRight > TopLeft > Bottom > BottomRight > BottomLeft > Right > Left
    const positions = [
      { name: 'top', x: -width / 2, y: -height - gap, origin: 'bottom center' },
      { name: 'top-right', x: gap, y: -height - gap, origin: 'bottom left' },
      { name: 'top-left', x: -width - gap, y: -height - gap, origin: 'bottom right' },
      { name: 'bottom', x: -width / 2, y: gap, origin: 'top center' },
      { name: 'bottom-right', x: gap, y: gap, origin: 'top left' },
      { name: 'bottom-left', x: -width - gap, y: gap, origin: 'top right' },
      { name: 'right', x: gap, y: -height / 2, origin: 'center left' },
      { name: 'left', x: -width - gap, y: -height / 2, origin: 'center right' },
    ];

    let bestPosition = positions[0];
    let maxScore = -Infinity;

    // Evaluate each position
    positions.forEach(pos => {
      let score = 1000; // Base score

      // Calculate absolute screen coordinates
      const absX = position.x + pos.x;
      const absY = position.y + pos.y;
      const absRight = absX + width;
      const absBottom = absY + height;

      // 1. Viewport Collision Penalty
      if (absX < 10) score -= 10000; // Left edge
      if (absY < 80) score -= 10000; // Top edge (header)
      if (absRight > viewportWidth - 10) score -= 10000; // Right edge
      if (absBottom > viewportHeight - 10) score -= 10000; // Bottom edge

      // 2. Cart Table Collision Penalty
      if (cartRect) {
        // Simple AABB check
        const overlap = !(absRight < cartRect.left ||
          absX > cartRect.right ||
          absBottom < cartRect.top ||
          absY > cartRect.bottom);

        if (overlap) {
          score -= 50000; // Huge penalty for overlapping cart table
        }
      }

      // 3. Preference Bonuses (slightly prefer Top and Right if safe)
      if (pos.name === 'top') score += 500;
      if (pos.name === 'right') score += 200;

      if (score > maxScore) {
        maxScore = score;
        bestPosition = pos;
      }
    });

    // Apply Best Position
    setAdjustedStyle({
      left: `${position.x}px`,
      top: `${position.y}px`,
      transform: `translate(${bestPosition.x}px, ${bestPosition.y}px)`,
      opacity: 1,
      pointerEvents: 'none' // Container doesn't capture events, content does
    });

    // Calculate Bridge (invisible connection)
    // This is complex for 8 directions, simplifying to just ensure gap coverage
    // If tooltip is far, just make a big circle behind pointer? Or specific rect?
    // Let's rely on a large transparent area around the tooltip content

    setIsReady(true);

    // Arrow positioning based on chosen side
    // (Simplification: Just center for top/bottom, adjust for others if needed)
    // For now we omit the arrow or make it dynamic. 
    // Let's use a simpler approach for arrow: hide it for corner/side positions to avoid complexity,
    // or just render it for Top/Bottom specific cases.

    // For this iteration, let's keep the arrow simple or remove if complicating layout.
    // The "Bridge" is more important for UX.

  }, [position, ponto.id]); // Re-run when position or point changes


  // Extract rental value and period information
  const getRentalInfo = () => {
    const locacaoProduto = ponto.produtos?.find(p =>
      p.tipo.toLowerCase().includes('locação') ||
      p.tipo.toLowerCase().includes('locacao') ||
      p.tipo.toLowerCase().includes('bissemanal') ||
      p.tipo.toLowerCase().includes('mensal')
    );

    if (!locacaoProduto) return null;

    // Determine period type
    let periodoTipo = 'Bissemanal';
    const tipoLower = locacaoProduto.tipo.toLowerCase();
    if (tipoLower.includes('mensal')) {
      periodoTipo = 'Mensal';
    } else if (tipoLower.includes('unitário') || tipoLower.includes('unitario')) {
      periodoTipo = 'Unitário';
    }

    return {
      valor: locacaoProduto.valor,
      periodo: periodoTipo
    };
  };

  const rentalInfo = getRentalInfo();

  return (
    <div
      ref={tooltipRef}
      className="absolute z-[9999]"
      style={adjustedStyle}
    >
      {/* Invisible Bridge - Expanded Area around tooltip to catch mouse movement */}
      <div
        className="absolute inset-0 -m-8 bg-transparent"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ pointerEvents: 'auto' }} // Capture events around the tooltip
      />

      {/* Google Maps Style Card - Ultra Compact */}
      <div
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={(e) => {
          e.stopPropagation(); // Prevent map click
          if (props.onClick) props.onClick();
        }}
        className="relative w-[240px] bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform transition-transform hover:scale-[1.02] active:scale-[0.98]"
        style={{ pointerEvents: 'auto' }}
      >

        {/* Image Section with Código OOH Overlay */}
        {imagens.length > 0 ? (
          <div className="relative w-full h-[100px] bg-gray-200">
            <img
              src={currentImageUrl}
              alt={ponto.codigo_ooh}
              className="w-full h-full object-cover"
            />
            {/* Código OOH Overlay */}
            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-sm font-semibold px-2 py-1 rounded">
              {ponto.codigo_ooh}
            </div>
            {/* Image counter */}
            {imagens.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                {currentImageIndex + 1}/{imagens.length}
              </div>
            )}
          </div>
        ) : (
          <div className="relative w-full h-[100px] bg-gray-200 flex items-center justify-center">
            <Building2 size={32} className="text-gray-400" />
            {/* Código OOH Overlay */}
            <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm text-white text-sm font-semibold px-2 py-1 rounded">
              {ponto.codigo_ooh}
            </div>
          </div>
        )}

        {/* Information Section - Ultra Compact with Inline Buttons */}
        <div className="p-3 flex flex-col gap-1.5">
          {/* Address and Action Buttons Row */}
          <div className="flex items-center gap-2 justify-between">
            <p className="text-xs text-gray-600 line-clamp-1 flex-1">
              {ponto.endereco}
            </p>

            {/* Action Buttons - Inline */}
            <div className="flex gap-1 flex-shrink-0">
              {/* Street View Button */}
              {ponto.latitude && ponto.longitude && (
                <button
                  onClick={(e) => { e.stopPropagation(); onStreetViewClick?.(); }}
                  className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
                  title="Street View"
                >
                  <User size={14} />
                </button>
              )}

              {/* Add/Remove Cart Button */}
              {showProposalActions && !readOnly && selectedProposta && (() => {
                const isInCart = selectedProposta.itens?.some((i: any) => i.id_ooh === ponto.id) || false;
                return (
                  <button
                    onClick={handleAddToCart}
                    disabled={isAdding}
                    className={`p-1.5 rounded transition-colors ${isInCart
                      ? 'bg-red-50 hover:bg-red-100 text-red-600'
                      : 'bg-[#FC1E75] hover:bg-[#E01A6A] text-white'
                      }`}
                    title={isInCart ? 'Remover do carrinho' : 'Adicionar ao carrinho'}
                  >
                    {isAdding ? (
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full" />
                    ) : (
                      <ShoppingCart size={14} />
                    )}
                  </button>
                );
              })()}
            </div>
          </div>

          {/* Exibidora */}
          {ponto.exibidora_nome && (
            <div className="flex items-center gap-1 text-gray-500">
              <Building2 size={11} />
              <span className="text-[10px]">{ponto.exibidora_nome}</span>
            </div>
          )}

          {/* Rental Value and Period */}
          {rentalInfo && (
            <div className="mt-0.5 pt-1.5 border-t border-gray-200">
              <div className="flex items-baseline gap-1.5">
                <span className="text-sm font-bold text-[#FC1E75]">
                  {formatCurrency(rentalInfo.valor)}
                </span>
                <span className="text-[10px] text-gray-500">
                  / {rentalInfo.periodo}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
