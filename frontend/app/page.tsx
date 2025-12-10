'use client';

import { useEffect, useState } from 'react';
import GoogleMap from '@/components/map/GoogleMap';
import Sidebar from '@/components/Sidebar';
import ExibidoraSidebar from '@/components/ExibidoraSidebar';
import CreatePointModal from '@/components/CreatePointModal';
import ExibidoraModal from '@/components/ExibidoraModal';
import MapFilters from '@/components/MapFilters';
import AddressSearch from '@/components/AddressSearch';
import NavigationMenu from '@/components/NavigationMenu';
import ExibidorasView from '@/components/ExibidorasView';
import UserMenu from '@/components/UserMenu';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Plus, Filter, Menu } from 'lucide-react';

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
    </ProtectedRoute>
  );
}

function HomePageContent() {
  const [isPontos, setIsPontos] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);

  const setPontos = useStore((state) => state.setPontos);
  const setExibidoras = useStore((state) => state.setExibidoras);
  const setModalOpen = useStore((state) => state.setModalOpen);
  const setMenuOpen = useStore((state) => state.setMenuOpen);
  const currentView = useStore((state) => state.currentView);
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
      <header className="gradient-primary px-6 py-3 flex items-center justify-between flex-shrink-0 z-10 fixed top-0 left-0 right-0 h-[70px] border-b-4 border-emidias-accent shadow-lg">
        {/* Logo OOH Data Hub - Esquerda */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            OOH Data Hub
          </h1>
        </div>

        {/* Logo E-MÍDIAS - Centro */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <img
            src="https://raw.githubusercontent.com/kaike74/distribuicaoemidias/main/logo%20E-MIDIAS%20png%20fundo%20escuro%20HORIZONTAL%20(1).png"
            alt="E-MÍDIAS Logo"
            className="h-12 object-contain"
          />
        </div>

        {/* Ações - Direita */}
        <div className="flex items-center gap-3">
          {currentView === 'map' && (
            <>
              <button
                onClick={() => setIsFiltersOpen(true)}
                className="px-4 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-2 transition"
              >
                <Filter size={20} />
                <span className="hidden sm:inline">Filtros</span>
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 bg-emidias-accent text-white rounded-lg hover:bg-[#E01A6A] flex items-center gap-2 transition font-medium hover-lift shadow-lg"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Novo Ponto</span>
              </button>
            </>
          )}

          {/* User Menu */}
          <UserMenu />

          {/* Menu Hambúrguer */}
          <button
            onClick={() => setMenuOpen(true)}
            className="px-3 py-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Search Bar - Apenas no mapa */}
      {currentView === 'map' && (
        <div className="fixed top-[90px] left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-4">
          <AddressSearch
            onLocationSelect={(location) => setSearchLocation(location)}
          />
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative mt-[70px]">
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

        {/* Views */}
        {currentView === 'map' && (
          <>
            <GoogleMap searchLocation={searchLocation} />
            <Sidebar />
            <ExibidoraSidebar />
          </>
        )}

        {currentView === 'exibidoras' && <ExibidorasView />}

        {/* Componentes Globais */}
        <CreatePointModal />
        <ExibidoraModal />
        <MapFilters isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />
        <NavigationMenu />
      </main>
    </div>
  );
}
