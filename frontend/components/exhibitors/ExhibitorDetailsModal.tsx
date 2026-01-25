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

export default function ExhibitorDetailsModal() {
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const setEditingExibidora = useStore((state) => state.setEditingExibidora);
    const isExhibitorDetailsOpen = useStore((state) => state.isExhibitorDetailsOpen);
    const setExhibitorDetailsOpen = useStore((state) => state.setExhibitorDetailsOpen);
    const setExibidoraModalOpen = useStore((state) => state.setExibidoraModalOpen);
    const pontos = useStore((state) => state.pontos);

    const mapRef = useRef<HTMLDivElement>(null);
    const googleMapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<any[]>([]);

    const stats = useMemo(() => {
        if (!selectedExibidora) return null;
        const pontosExibidora = pontos.filter((p) => p.id_exibidora === selectedExibidora.id);
        const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))];
        return { totalPontos: pontosExibidora.length, cidades: cidades as string[], pontos: pontosExibidora };
    }, [selectedExibidora, pontos]);

    const handleClose = useCallback(() => {
        setExhibitorDetailsOpen(false);
    }, [setExhibitorDetailsOpen]);

    const handleEdit = useCallback(() => {
        if (!selectedExibidora) return;
        setEditingExibidora(selectedExibidora);
        setExibidoraModalOpen(true);
    }, [selectedExibidora, setEditingExibidora, setExibidoraModalOpen]);

    const startImport = useBulkImportStore((state) => state.startImport);
    const handleBulkImport = useCallback(() => { if (!selectedExibidora) return; startImport(selectedExibidora.id, selectedExibidora.nome); }, [selectedExibidora, startImport]);

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
                        disableDefaultUI: true,
                        gestureHandling: 'cooperative'
                    });
                }

                // Clear markers
                markersRef.current.forEach(m => m.map = null);
                markersRef.current = [];

                const bounds = new google.maps.LatLngBounds();

                stats.pontos.forEach(p => {
                    if (p.latitude && p.longitude) {
                        const pin = document.createElement('div');
                        pin.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="24" height="24" fill="#FC1E75"><path d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z M192 272c44.2 0 80-35.8 80-80s-35.8-80-80-80s-80 35.8-80 80s35.8 80 80 80z"/></svg>`;

                        const marker = new AdvancedMarkerElement({
                            position: { lat: p.latitude, lng: p.longitude },
                            map: googleMapRef.current,
                            content: pin,
                            title: p.codigo_ooh
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

        const timer = setTimeout(initMap, 500); // Slight delay for modal animation
        return () => clearTimeout(timer);

    }, [selectedExibidora, isExhibitorDetailsOpen, stats?.pontos]);


    const isOpen = !!selectedExibidora && isExhibitorDetailsOpen;
    if (!selectedExibidora) return null;

    // 1. Hero
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
                <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {selectedExibidora.created_at ? formatDate(selectedExibidora.created_at) : 'N/A'}</span>
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded-full">{stats?.totalPontos || 0} Pontos</span>
                </div>
            </div>
        </div>
    );

    // 2. Visual Content (Map of Points)
    const VisualContent = (
        <div className="w-full h-full min-h-[300px] bg-gray-100 rounded-2xl overflow-hidden relative border border-gray-200 shadow-sm group">
            <div ref={mapRef} className="w-full h-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500" />
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm z-10">
                <span className="text-xs font-bold text-gray-700 flex items-center gap-2">
                    <MapPin size={12} className="text-plura-primary" />
                    Mapa de Abrangência
                </span>
            </div>
        </div>
    );

    // 3. Info Content (Stats + Data)
    const InfoContent = (
        <div className="flex flex-col gap-4 h-full">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><TrendingUp size={12} /> Performance Média</span>
                    <span className="text-xl font-black text-gray-900">{stats?.totalPontos ? '12.5k' : '-'} <span className="text-[10px] font-normal text-gray-400">imp/dia</span></span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-[100px]">
                    <span className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><DollarSign size={12} /> Faturamento Est.</span>
                    <span className="text-xl font-black text-gray-900">R$ 450k</span>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex-1">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-purple-50 text-purple-700 rounded-lg"><Building2 size={16} /></div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dados da Empresa</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Razão Social</span>
                        <p className="text-sm font-medium text-gray-900">{selectedExibidora.razao_social || '-'}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">CNPJ</span>
                        <p className="text-sm font-mono text-gray-900 bg-gray-50 inline-block px-1.5 rounded">{selectedExibidora.cnpj || '-'}</p>
                    </div>
                    <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Endereço</span>
                        <p className="text-sm text-gray-600">{selectedExibidora.endereco || '-'}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    // 4. List Content (List of Points + Contacts)
    const ListContent = (
        <div className="flex flex-col gap-4 h-full">
            {/* Points List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 min-h-[200px] overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Pontos Cadastrados</span>
                    </div>
                    <span className="text-[10px] font-bold bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600">{stats?.totalPontos || 0}</span>
                </div>
                <div className="p-0 overflow-y-auto flex-1 custom-scrollbar">
                    {stats?.pontos && stats.pontos.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {stats.pontos.map((p) => (
                                <div key={p.id} className="p-3 hover:bg-gray-50 flex justify-between items-center group cursor-pointer transition-colors">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 group-hover:text-blue-600">{p.codigo_ooh}</p>
                                        <p className="text-[10px] text-gray-500 truncate max-w-[200px]">{p.endereco}</p>
                                    </div>
                                    <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{p.tipo}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-xs text-gray-400 italic">Nenhum ponto encontrado</div>
                    )}
                </div>
            </div>

            {/* Contacts & Cities Grid */}
            <div className="grid grid-cols-2 gap-4 h-[250px]">
                {/* Cities */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <Tag size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Cidades</span>
                    </div>
                    <div className="p-4 flex flex-wrap gap-2 overflow-y-auto custom-scrollbar content-start">
                        {stats?.cidades.map((c, i) => <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-100 rounded text-[10px] font-medium">{c}</span>)}
                    </div>
                </div>

                {/* Contacts */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                        <Phone size={14} className="text-gray-400" />
                        <span className="text-xs font-bold text-gray-500 uppercase">Contatos</span>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        <ContatosExibidora idExibidora={selectedExibidora.id} />
                    </div>
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
            />
            <BulkImportModal />
        </>
    );
}
