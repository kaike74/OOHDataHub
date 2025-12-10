'use client';

import { useEffect, useState } from 'react';
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
  const imagens = ponto.imagens || [];

  // Auto-rotate imagens a cada 3 segundos
  useEffect(() => {
    if (imagens.length <= 1) return undefined;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [imagens.length]);

  // Reset quando o ponto mudar
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [ponto.id]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
  };

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
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden card-shadow min-w-[250px] max-w-[400px] animate-in fade-in zoom-in-95 duration-200 ease-out">
        {/* Imagens com Carrossel */}
        {imagens.length > 0 && (
          <div className="relative h-48 w-full bg-gray-200">
            <img
              src={api.getImageUrl(imagens[currentImageIndex])}
              alt={ponto.codigo_ooh}
              className="w-full h-full object-cover"
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
        <div className="p-4">
          {/* Código OOH */}
          <h3 className="font-bold text-emidias-primary text-base mb-1">
            {ponto.codigo_ooh}
          </h3>

          {/* Endereço com quebra de linha */}
          <p className="text-sm text-gray-600 mb-2 break-words whitespace-normal line-clamp-3">
            {ponto.endereco}
          </p>

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
