'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Building2, Eye, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

interface MapTooltipProps {
  ponto: Ponto;
  position: { x: number; y: number };
  onStreetViewClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function MapTooltip({ ponto, position, onStreetViewClick, onMouseEnter, onMouseLeave }: MapTooltipProps) {
  const exibidoras = useStore((state) => state.exibidoras);
  const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
  const setFilterExibidora = useStore((state) => state.setFilterExibidora);
  const setCurrentView = useStore((state) => state.setCurrentView);
  const selectedProposta = useStore((state) => state.selectedProposta);
  const refreshProposta = useStore((state) => state.refreshProposta);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 288, height: 192 }); // Default: w-72 h-48
  const [isAdding, setIsAdding] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const imagens = ponto.imagens || [];

  const nextImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
  }, [imagens.length]);

  const prevImage = useCallback(() => {
    setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
  }, [imagens.length]);

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    const aspectRatio = img.naturalWidth / img.naturalHeight;
    const height = 180;
    const width = Math.min(Math.max(height * aspectRatio, 240), 320);
    setImageSize({ width, height });
  }, []);

  const handleExibidoraClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (ponto.id_exibidora) {
      const exibidora = exibidoras.find(ex => ex.id === ponto.id_exibidora);
      if (exibidora) {
        // Aplicar filtro da exibidora
        setFilterExibidora([exibidora.id]);
        // Selecionar exibidora (abre ExibidoraSidebar)
        setSelectedExibidora(exibidora);
        // Garantir que está na view de mapa
        setCurrentView('map');
      }
    }
  }, [ponto.id_exibidora, exibidoras, setFilterExibidora, setSelectedExibidora, setCurrentView]);

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selectedProposta) {
      return; // Silently do nothing if no proposal selected
    }

    setIsAdding(true);
    try {
      // Check if already in cart
      const cartItens = selectedProposta.itens || [];
      const isInCart = cartItens.some((i: any) => i.id_ooh === ponto.id);

      if (isInCart) {
        // Remove from cart
        const updatedItens = cartItens.filter((i: any) => i.id_ooh !== ponto.id);
        await api.updateCart(selectedProposta.id, updatedItens);
        const updatedProposta = await api.getProposta(selectedProposta.id);
        refreshProposta(updatedProposta);
        return;
      }
      // Helper function to calculate value with commission
      const calcularValorComissao = (valorBase: number, comissao: string): number => {
        const v2 = valorBase * 1.25;
        if (comissao === 'V2') return parseFloat(v2.toFixed(2));

        const v3 = v2 * 1.25;
        if (comissao === 'V3') return parseFloat(v3.toFixed(2));

        const v4 = v3 * 1.25;
        return parseFloat(v4.toFixed(2));
      };

      // Find products by type (case-insensitive)
      const papelProduto = ponto.produtos?.find(p =>
        p.tipo.toLowerCase().includes('papel')
      );
      const lonaProduto = ponto.produtos?.find(p =>
        p.tipo.toLowerCase().includes('lona')
      );
      const locacaoProduto = ponto.produtos?.find(p =>
        p.tipo.toLowerCase().includes('locação') ||
        p.tipo.toLowerCase().includes('locacao') ||
        p.tipo.toLowerCase().includes('bissemanal') ||
        p.tipo.toLowerCase().includes('mensal')
      );

      // Calculate values with proper rounding to 2 decimal places
      const valorPapel = papelProduto ? parseFloat((papelProduto.valor * 1.25).toFixed(2)) : 0;
      const valorLona = lonaProduto ? parseFloat((lonaProduto.valor * 1.25).toFixed(2)) : 0;
      const valorLocacao = locacaoProduto ? calcularValorComissao(locacaoProduto.valor, selectedProposta.comissao) : 0;

      // Default item structure
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

      // Fetch current items
      const data = await api.getProposta(selectedProposta.id);
      const currentItens = data.itens || [];

      // Check if already in cart
      if (currentItens.some((i: any) => i.id_ooh === ponto.id)) {
        return; // Silently do nothing if already in cart
      }

      const newItens = [...currentItens, item];
      await api.updateCart(selectedProposta.id, newItens);

      // Reload proposal to update UI in real-time
      const updatedProposta = await api.getProposta(selectedProposta.id);
      refreshProposta(updatedProposta);

    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setIsAdding(false);
    }
  }, [ponto, selectedProposta, refreshProposta]);

  // Auto-rotate imagens a cada 3 segundos
  useEffect(() => {
    if (imagens.length <= 1) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [imagens.length]);

  // Reset quando o ponto mudar
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [ponto.id]);

  // Format address with line breaks
  const formatAddress = (address: string) => {
    // Break address at commas for better readability
    const parts = address.split(',').map(p => p.trim());
    return parts;
  };

  const addressParts = formatAddress(ponto.endereco);

  return (
    <div
      className="absolute z-40 pointer-events-auto"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-20px)',
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden card-shadow animate-[tooltip-appear_0.2s_ease-out_forwards]">
        {/* Imagens com Carrossel */}
        {imagens.length > 0 && (
          <div
            className="relative bg-gray-200"
            style={{
              width: 'auto',
              maxWidth: '320px',
              minWidth: '240px',
              height: '180px'
            }}
          >
            <img
              src={api.getImageUrl(imagens[currentImageIndex])}
              alt={ponto.codigo_ooh}
              className="w-full h-full object-cover"
              onLoad={handleImageLoad}
            />

            {/* Indicador de imagens */}
            {imagens.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                {currentImageIndex + 1}/{imagens.length}
              </div>
            )}

            {/* Gradiente overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-4" style={{ maxWidth: imageSize.width + 'px' }}>
          {/* Código OOH */}
          <h3 className="font-bold text-emidias-primary text-base mb-1">
            {ponto.codigo_ooh}
          </h3>

          {/* Endereço com quebra de linha */}
          <div className="text-sm text-gray-600 mb-2">
            {addressParts.map((part, idx) => (
              <div key={idx} className="leading-tight">
                {part}{idx < addressParts.length - 1 ? ',' : ''}
              </div>
            ))}
          </div>

          {/* Exibidora */}
          {ponto.exibidora_nome && (
            <div className="flex items-center gap-2 text-xs mb-3">
              <Building2 size={14} className="text-emidias-accent flex-shrink-0" />
              <button
                onClick={handleExibidoraClick}
                className="truncate text-gray-500 hover:text-emidias-accent hover:underline transition text-left"
              >
                {ponto.exibidora_nome}
              </button>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-2">
            {/* Botão Street View */}
            {ponto.latitude && ponto.longitude && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStreetViewClick?.();
                }}
                className="flex-1 py-2 px-3 bg-emidias-primary hover:bg-emidias-primary-light text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition hover-lift"
              >
                <Eye size={14} />
                Street View
              </button>
            )}

            {/* Botão Adicionar/Remover do Carrinho - Dynamic */}
            {selectedProposta && (() => {
              const isInCart = selectedProposta.itens?.some((i: any) => i.id_ooh === ponto.id) || false;
              return (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition hover-lift disabled:opacity-50 disabled:cursor-not-allowed ${isInCart
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  title={isInCart ? 'Tirar do carrinho' : `Adicionar à ${selectedProposta.nome}`}
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                      {isInCart ? 'Removendo...' : 'Adicionando...'}
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={14} />
                      {isInCart ? 'Tirar do carrinho' : 'Adicionar'}
                    </>
                  )}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Seta do tooltip */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full"
          style={{
            width: 0,
            height: 0,
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '8px solid white',
          }}
        />
      </div>
    </div>
  );
}
