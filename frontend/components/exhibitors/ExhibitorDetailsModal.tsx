'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Building2, Phone, Mail, Pencil, Tag, Calendar, Upload, TrendingUp, DollarSign, MapPin } from 'lucide-react';
import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { Contato } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { SafeImage } from '@/components/ui/SafeImage';
import { useBulkImportStore } from '@/stores/useBulkImportStore';
import BulkImportModal from '@/components/bulk-import/BulkImportModal';
import { UnifiedStandardModal } from '@/components/ui/UnifiedStandardModal';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';

// Componente para exibir contatos da exibidora
function ContatosExibidora({ idExibidora }: { idExibidora: number | null | undefined }) {
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!idExibidora) return;
        const fetchContatos = async () => {
            setLoading(true);
            try { setContatos(await api.getContatos(idExibidora)); }
            catch (error) { console.error('Erro ao buscar contatos:', error); }
            finally { setLoading(false); }
        };
        fetchContatos();
    }, [idExibidora]);

    if (loading) return <div className="p-4"><div className="h-6 bg-gray-50 rounded animate-pulse" /></div>;
    if (contatos.length === 0) return <p className="text-xs text-gray-400 p-4 font-normal italic">Nenhum contato cadastrado</p>;

    return (
        <div className="space-y-2">
            {contatos.map((contato) => (
                <div key={contato.id} className="p-3 bg-white rounded-lg border border-gray-100 flex flex-col gap-1 hover:border-gray-300 transition-colors">
                    {contato.nome && <p className="font-bold text-gray-900 text-xs">{contato.nome}</p>}
                    <div className="flex flex-col gap-1">
                        {contato.telefone && <a href={`tel:${contato.telefone}`} className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-600"><Phone size={10} />{contato.telefone}</a>}
                        {contato.email && <a href={`mailto:${contato.email}`} className="flex items-center gap-1.5 text-[11px] text-gray-600 hover:text-blue-600"><Mail size={10} />{contato.email}</a>}
                    </div>
                </div>
            ))}
        </div>
    );
}

interface ExhibitorDetailsModalProps {
    zIndex?: number;
}

export default function ExhibitorDetailsModal({ zIndex }: ExhibitorDetailsModalProps) {
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const isExhibitorDetailsOpen = useStore((state) => state.isExhibitorDetailsOpen);
    const setExhibitorDetailsOpen = useStore((state) => state.setExhibitorDetailsOpen);
    const setExibidoraModalOpen = useStore((state) => state.setExibidoraModalOpen);
    const pontos = useStore((state) => state.pontos);
    const setPointModalOpen = useStore((state) => state.setPointModalOpen);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);

    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<any[]>([]);

    const [proposals, setProposals] = useState<any[]>([]);
    const [selectedCities, setSelectedCities] = useState<string[]>([]);
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);

    const stats = useMemo(() => {
        if (!selectedExibidora) return null;
        const pontosExibidora = pontos.filter((p) => p.id_exibidora === selectedExibidora.id);
        const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))]; // Unique cities
        const tipos = [...new Set(pontosExibidora.map((p) => p.tipo).filter(Boolean))]; // Unique types
        return { totalPontos: pontosExibidora.length, cidades: cidades as string[], pontos: pontosExibidora, tipos: tipos as string[] };
    }, [selectedExibidora, pontos]);

    // Fetch Proposals
    useEffect(() => {
        if (!selectedExibidora || !stats?.pontos.length) {
            setProposals([]);
            return;
        }
        const fetchProposals = async () => {
            try {
                const all = await api.getAdminProposals();
                // Filter proposals that contain ANY point from this exhibitor
                const pointIds = new Set(stats.pontos.map(p => p.id));
                const filtered = all.filter((prop: any) =>
                    prop.itens?.some((item: any) => pointIds.has(item.id_ooh))
                );
                setProposals(filtered);
            } catch (e) {
                console.error("Error fetching exhibited proposals", e);
            }
        };
        fetchProposals();
    }, [selectedExibidora, stats?.pontos]);

    const handleClose = useCallback(() => {
        setExhibitorDetailsOpen(false);
        setProposals([]);
        setSelectedCities([]);
        setSelectedTypes([]);
        setIsTypeFilterOpen(false);
    }, [setExhibitorDetailsOpen]);

    const handleEdit = useCallback(() => {
        if (!selectedExibidora) return;
        setEditingExibidora(selectedExibidora);
        setExibidoraModalOpen(true);
    }, [selectedExibidora, setEditingExibidora, setExibidoraModalOpen]);

    const startImport = useBulkImportStore((state) => state.startImport);
    const handleBulkImport = useCallback(() => { if (!selectedExibidora) return; startImport(selectedExibidora.id, selectedExibidora.nome); }, [selectedExibidora, startImport]);

    // Filter Logic
    const toggleCity = (city: string) => {
        setSelectedCities(prev => prev.includes(city) ? prev.filter(c => c !== city) : [...prev, city]);
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    };

    const filteredPontos = useMemo(() => {
        if (!stats?.pontos) return [];
        let filtered = stats.pontos;

        if (selectedCities.length > 0) {
            filtered = filtered.filter(p => p.cidade && selectedCities.includes(p.cidade));
        }

        if (selectedTypes.length > 0) {
            filtered = filtered.filter(p => p.tipo && selectedTypes.includes(p.tipo));
        }

        return filtered;
    }, [stats?.pontos, selectedCities, selectedTypes]);

    // Map Initialization
    useEffect(() => {
        if (!selectedExibidora || !isExhibitorDetailsOpen || !stats?.pontos.length) return;

        const initMap = async () => {
            try {
                const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
                setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '', v: "weekly" });
                await importLibrary("maps");
                const { AdvancedMarkerElement } = await importLibrary("marker") as any;

                if (!mapRef.current) return;

                if (!googleMapRef.current) {
                    googleMapRef.current = new google.maps.Map(mapRef.current, {
                        center: { lat: -23.550520, lng: -46.633308 },
                        zoom: 10,
                        mapId: "EXHIBITOR_DETAILS_MAP",
                        disableDefaultUI: true, // We will add custom controls
                        gestureHandling: 'cooperative'
                    });
                }

                // Clear markers
                markersRef.current.forEach(m => m.map = null);
                markersRef.current = [];

                const bounds = new google.maps.LatLngBounds();

                filteredPontos.forEach(p => {
                    if (p.latitude && p.longitude) {
                        const pin = document.createElement('div');
                        pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24" fill="#FC1E75"><path d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z M192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80s-80 35.8-80 80s35.8 80 80 80z"/></svg>`;

                        const marker = new AdvancedMarkerElement({
                            position: { lat: p.latitude, lng: p.longitude },
                            map: googleMapRef.current,
                            content: pin,
                            title: p.codigo_ooh
                        });

                        // Click listener to open point details
                        marker.addListener("click", () => {
                            setSelectedPonto(p);
                            setPointModalOpen(true);
                        });

                        markersRef.current.push(marker);
                        bounds.extend({ lat: p.latitude, lng: p.longitude });
                    }
                });

                if (!bounds.isEmpty() && googleMapRef.current) {
                    googleMapRef.current.fitBounds(bounds);
                }

            } catch (e) {
                console.error("Error loading map", e);
            }
        };

        const timer = setTimeout(initMap, 500);
        return () => clearTimeout(timer);

    }, [selectedExibidora, isExhibitorDetailsOpen, filteredPontos, stats?.pontos.length]);

    const isOpen = !!selectedExibidora && isExhibitorDetailsOpen;
    if (!selectedExibidora) return null;

    // 1. Hero Content
    const HeroContent = (
        <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-white border border-gray-100 p-2 flex items-center justify-center shadow-sm">
                {selectedExibidora.logo_r2_key ? (
                    <SafeImage src={api.getImageUrl(selectedExibidora.logo_r2_key)} alt={selectedExibidora.nome} className="w-full h-full object-contain" />
                ) : (
                    <Building2 size={32} className="text-gray-300" />
                )}
            </div>
            <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">{selectedExibidora.nome}</h1>
                <div className="flex flex-col gap-1 text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">CNPJ</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="font-mono text-gray-700 bg-gray-50 px-1.5 py-0.5 rounded cursor-help border border-gray-100 hover:border-blue-200 transition-colors">
                                        {selectedExibidora.cnpj || 'N/A'}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="font-bold">{selectedExibidora.razao_social || 'Razão Social não informada'}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    {selectedExibidora.endereco && (
                        <div className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400" />
                            <span className="text-gray-600">{selectedExibidora.endereco}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // 2. Visual Content (Map with Zoom Controls)
    const VisualContent = (
        <div className="w-full h-full min-h-[300px] bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200 shadow-sm group">
            <div ref={mapRef} className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm z-10">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <MapPin size={12} className="text-plura-primary" />
                    Mapa de Abrangência
                </span>
            </div>

            {/* Custom Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
                <button
                    onClick={() => googleMapRef.current?.setZoom((googleMapRef.current?.getZoom() || 10) + 1)}
                    className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all"
                >
                    <div className="text-lg font-bold leading-none">+</div>
                </button>
                <button
                    onClick={() => googleMapRef.current?.setZoom((googleMapRef.current?.getZoom() || 10) - 1)}
                    className="bg-white p-2 rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-200 transition-all"
                >
                    <div className="text-lg font-bold leading-none">-</div>
                </button>
            </div>
        </div>
    );

    // 3. Info Content (Points List + Filters) - CENTER COLUMN
    const InfoContent = (
        <div className="flex flex-col gap-4 h-full">
            {/* Points List with Filters */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-[500px] overflow-hidden">
                <div className="flex flex-col border-b border-gray-100">
                    <div className="px-4 py-3 flex items-center justify-between bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-gray-400" />
                                <span className="text-xs font-bold text-gray-500 uppercase">Pontos</span>
                            </div>
                            <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">{filteredPontos.length}/{stats?.totalPontos}</span>

                            {/* Type Filter Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}
                                    className={`
                                        flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold uppercase tracking-wide transition-all
                                        ${selectedTypes.length > 0 ? 'bg-plura-primary text-white border-plura-primary' : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'}
                                    `}
                                >
                                    <Tag size={10} />
                                    Tipos {selectedTypes.length > 0 && `(${selectedTypes.length})`}
                                </button>

                                {isTypeFilterOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setIsTypeFilterOpen(false)} />
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-2 z-20 flex flex-col gap-1 max-h-[200px] overflow-y-auto custom-scrollbar">
                                            {stats?.tipos.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={(e) => { e.stopPropagation(); toggleType(type); }}
                                                    className={`
                                                        text-left px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center justify-between
                                                        ${selectedTypes.includes(type) ? 'bg-plura-primary/10 text-plura-primary' : 'hover:bg-gray-50 text-gray-700'}
                                                    `}
                                                >
                                                    {type}
                                                    {selectedTypes.includes(type) && <div className="w-1.5 h-1.5 rounded-full bg-plura-primary" />}
                                                </button>
                                            ))}
                                            {(!stats?.tipos || stats.tipos.length === 0) && (
                                                <span className="text-[10px] text-gray-400 italic p-2">Nenhum tipo disponível</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* City Filters */}
                    {stats?.cidades && stats.cidades.length > 0 && (
                        <div className="px-4 py-2 flex gap-2 overflow-x-auto custom-scrollbar bg-white shadow-[inset_0_-1px_4px_rgba(0,0,0,0.02)]">
                            {stats.cidades.map(city => {
                                const isSelected = selectedCities.includes(city);
                                return (
                                    <button
                                        key={city}
                                        onClick={() => toggleCity(city)}
                                        className={`
                                            px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap transition-all border
                                            ${isSelected
                                                ? 'bg-plura-primary text-white border-plura-primary shadow-sm'
                                                : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-gray-300'
                                            }
                                        `}
                                    >
                                        {city}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                    {filteredPontos.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {filteredPontos.map((p) => (
                                <div
                                    key={p.id}
                                    onClick={() => {
                                        setSelectedPonto(p);
                                        setPointModalOpen(true);
                                    }}
                                    className="p-3 hover:bg-gray-50 flex justify-between items-center group cursor-pointer transition-colors"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{p.codigo_ooh}</p>
                                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{p.endereco}</p>
                                    </div>
                                    <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{p.tipo}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-xs text-gray-400 italic">
                            {(selectedCities.length > 0 || selectedTypes.length > 0) ? 'Nenhum ponto com esses filtros' : 'Nenhum ponto encontrado'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // 4. List Content (Contacts + Proposals) - RIGHT COLUMN
    const ListContent = (
        <div className="flex flex-col gap-4 h-full">
            {/* Contacts (Top) */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-[150px]">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                    <Phone size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Contatos</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    <ContatosExibidora idExibidora={selectedExibidora.id} />
                </div>
            </div>

            {/* Proposals (Bottom) */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col flex-[1.5] min-h-[200px]">
                <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg"><Upload size={16} /></div>
                        <span className="text-[10px] uppercase font-bold text-gray-400">Propostas</span>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{proposals.length}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {proposals.length > 0 ? proposals.map(prop => (
                        <div key={prop.id} className="p-2 border border-gray-100 rounded-lg hover:border-indigo-200 transition-colors bg-gray-50/50">
                            <p className="text-xs font-bold text-gray-900 truncate">{prop.nome}</p>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-[10px] text-gray-500">{formatDate(prop.created_at)}</span>
                                <span className="text-[9px] px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-400 font-mono">{prop.status}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-1 pb-4">
                            <p className="text-[10px] italic">Nenhuma proposta vinculada</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <UnifiedStandardModal
                isOpen={isOpen}
                onClose={handleClose}
                title="Detalhes da Exibidora"
                hero={HeroContent}
                visualContent={VisualContent}
                infoContent={InfoContent}
                listContent={ListContent}
                actions={[
                    {
                        icon: Upload,
                        label: "Cadastro em Massa",
                        onClick: handleBulkImport,
                        variant: 'default'
                    },
                    {
                        icon: Pencil,
                        label: "Editar",
                        onClick: handleEdit,
                        variant: 'primary'
                    }
                ]}
                zIndex={zIndex}
            />
            <BulkImportModal />
        </>
    );
}
