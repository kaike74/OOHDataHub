'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';
import { Building2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface MapTooltipProps {
  ponto: Ponto;
  position: { x: number; y: number };
  onStreetViewClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function MapTooltip({ ponto, position, onStreetViewClick, onMouseEnter, onMouseLeave }: MapTooltipProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageSize, setImageSize] = useState({ width: 288, height: 192 }); // Default: w-72 h-48
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

            {/* Botões de navegação do carrossel */}
            {imagens.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevImage();
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextImage();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition"
                >
                  <ChevronRight size={16} />
                </button>
              </>
            )}

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
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
              <Building2 size={14} className="text-emidias-accent flex-shrink-0" />
              <span className="truncate">{ponto.exibidora_nome}</span>
            </div>
          )}

          {/* Botão Street View */}
          {ponto.latitude && ponto.longitude && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onStreetViewClick?.();
              }}
              className="w-full py-2 px-3 bg-emidias-primary hover:bg-emidias-primary-light text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition hover-lift"
            >
              <Eye size={14} />
              Ver no Street View
            </button>
          )}
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
