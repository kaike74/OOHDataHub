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
import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Plus, Filter, Menu, MapPin, Building2, Loader2 } from 'lucide-react';

export default function HomePage() {
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
  const exibidoras = useStore((state) => state.exibidoras);
  const filterExibidora = useStore((state) => state.filterExibidora);
  const filterCidade = useStore((state) => state.filterCidade);
  const filterTipos = useStore((state) => state.filterTipos);

  // Count active filters
  const activeFiltersCount = [
    filterExibidora.length > 0,
    filterCidade.length > 0,
    filterTipos.length > 0,
  ].filter(Boolean).length;

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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-emidias-gray-50">
      {/* Header */}
      <header className="gradient-primary px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-40 fixed top-0 left-0 right-0 h-[70px] border-b-4 border-emidias-accent shadow-emidias-xl">
        {/* Logo OOH Data Hub - Left */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex w-10 h-10 bg-white/10 rounded-xl items-center justify-center backdrop-blur-sm">
            <MapPin size={22} className="text-emidias-accent" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              OOH Data Hub
            </h1>
            <p className="text-[10px] sm:text-xs text-white/60 hidden sm:block">
              {pontos.length} pontos cadastrados
            </p>
          </div>
        </div>

        {/* Logo E-MÍDIAS - Center */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
          <img
            src="https://raw.githubusercontent.com/kaike74/distribuicaoemidias/main/logo%20E-MIDIAS%20png%20fundo%20escuro%20HORIZONTAL%20(1).png"
            alt="E-MÍDIAS Logo"
            className="h-10 lg:h-12 object-contain drop-shadow-lg animate-pulse-gentle"
          />
        </div>

        {/* Actions - Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentView === 'map' && (
            <>
              <button
                onClick={() => setIsFiltersOpen(true)}
                className="relative px-3 sm:px-4 py-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl flex items-center gap-2 transition-all"
              >
                <Filter size={20} />
                <span className="hidden sm:inline font-medium">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emidias-accent text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce-gentle">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="px-3 sm:px-5 py-2.5 bg-emidias-accent text-white rounded-xl hover:bg-emidias-accent-dark flex items-center gap-2 transition-all font-semibold hover-lift shadow-accent"
              >
                <Plus size={20} strokeWidth={2.5} />
                <span className="hidden sm:inline">Novo Ponto</span>
              </button>
            </>
          )}

          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title="Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Search Bar - Map View Only */}
      {currentView === 'map' && !isLoading && (
        <div className="fixed top-[86px] left-4 sm:left-6 z-30 w-full max-w-xl px-4 animate-fade-in-down">
          <div className="relative">
            <AddressSearch
              onLocationSelect={(location) => setSearchLocation(location)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 relative mt-[70px]">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-emidias-gray-50 z-20">
            <div className="text-center animate-fade-in-up">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-emidias-gray-200 border-t-emidias-accent animate-spin mx-auto" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin size={28} className="text-emidias-accent animate-pulse" />
                </div>
              </div>
              <p className="text-emidias-gray-600 text-lg mt-6 font-medium">Carregando sistema...</p>
              <p className="text-emidias-gray-400 text-sm mt-2">Preparando mapa e dados</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-emidias-gray-50 z-20">
            <div className="card-base p-8 max-w-md mx-4 text-center animate-shake">
              <div className="w-16 h-16 bg-emidias-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin size={32} className="text-emidias-danger" />
              </div>
              <h3 className="text-emidias-gray-900 font-bold text-xl mb-2">Erro ao carregar</h3>
              <p className="text-emidias-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="btn-base btn-primary px-6 py-3"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        {/* Views */}
        {currentView === 'map' && !isLoading && !error && (
          <div className="h-full relative">
            {/* Map Container with subtle shadow */}
            <div className="absolute inset-0">
              <GoogleMap searchLocation={searchLocation} />
            </div>

            {/* Stats Badge - Bottom Left */}
            <div className="absolute bottom-6 left-6 z-10 hidden lg:flex items-center gap-3">
              <div className="glass-light px-4 py-2.5 rounded-xl shadow-emidias-lg flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emidias-accent rounded-full animate-pulse" />
                  <span className="text-sm font-semibold text-emidias-gray-900">{pontos.length}</span>
                  <span className="text-sm text-emidias-gray-500">pontos</span>
                </div>
                <div className="w-px h-4 bg-emidias-gray-300" />
                <div className="flex items-center gap-2">
                  <Building2 size={14} className="text-emidias-primary" />
                  <span className="text-sm font-semibold text-emidias-gray-900">{exibidoras.length}</span>
                  <span className="text-sm text-emidias-gray-500">exibidoras</span>
                </div>
              </div>
            </div>

            {/* Sidebars */}
            <Sidebar />
            <ExibidoraSidebar />
          </div>
        )}

        {currentView === 'exibidoras' && !isLoading && !error && <ExibidorasView />}

        {/* Global Components */}
        <CreatePointModal />
        <ExibidoraModal />
        <MapFilters isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />
        <NavigationMenu />
      </main>
    </div>
  );
}
