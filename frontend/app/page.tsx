'use client';

import { useEffect, useState } from 'react';
import GoogleMap from '@/components/map/GoogleMap';
import Sidebar from '@/components/Sidebar';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { MapPin, Plus, Filter, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const [isPontos, setIsPontos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setPontos = useStore((state) => state.setPontos);
  const setExibidoras = useStore((state) => state.setExibidoras);
  const setModalOpen = useStore((state) => state.setModalOpen);
  const pontos = useStore((state) => state.pontos);

  // Carregar dados iniciais
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [pontosData, exibidorasData] = await Promise.all([
          api.getPontos(),
          api.getExibidoras(),
        ]);

        setPontos(pontosData);
        setExibidoras(exibidorasData);
        setError(null);
      } catch (err: any) {
        console.error('Erro ao carregar dados:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [setPontos, setExibidoras]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <MapPin className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Sistema OOH</h1>
            <p className="text-sm text-gray-500">
              {pontos.length} pontos cadastrados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition">
            <Filter size={20} />
            <span className="hidden sm:inline">Filtros</span>
          </button>

          <button className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg flex items-center gap-2 transition">
            <BarChart3 size={20} />
            <span className="hidden sm:inline">Stats</span>
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition font-medium"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Novo Ponto</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 text-lg">Carregando sistema...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
              <h3 className="text-red-800 font-bold text-lg mb-2">Erro ao carregar</h3>
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <GoogleMap />
        <Sidebar />
      </main>
    </div>
  );
}
