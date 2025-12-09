'use client';

import { useEffect, useState } from 'react';
import { Ponto } from '@/lib/types';
import { api } from '@/lib/api';
import { Building2, Eye } from 'lucide-react';

interface MapTooltipProps {
  ponto: Ponto;
  position: { x: number; y: number };
  onStreetViewClick?: () => void;
  onClose?: () => void;
}

export default function MapTooltip({ ponto, position, onStreetViewClick, onClose }: MapTooltipProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const imagens = ponto.imagens || [];

  // Auto-rotate imagens a cada 3 segundos
  useEffect(() => {
    if (imagens.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [imagens.length]);

  // Reset quando o ponto mudar
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [ponto.id]);

  return (
    <div
      className="absolute z-40"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%) translateY(-20px)',
      }}
      onMouseLeave={onClose}
    >
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden card-shadow animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto">
        {/* Imagens com Carrossel */}
        {imagens.length > 0 && (
          <div className="relative h-32 w-56 bg-gray-200">
            <img
              src={api.getImageUrl(imagens[currentImageIndex])}
              alt={ponto.codigo_ooh}
              className="w-full h-full object-cover"
            />

            {/* Indicador de imagens */}
            {imagens.length > 1 && (
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs font-medium">
                {currentImageIndex + 1}/{imagens.length}
              </div>
            )}

            {/* Gradiente overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}

        {/* Conteúdo */}
        <div className="p-4">
          {/* Código OOH */}
          <h3 className="font-bold text-emidias-primary text-base mb-1">
            {ponto.codigo_ooh}
          </h3>

          {/* Endereço */}
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
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
