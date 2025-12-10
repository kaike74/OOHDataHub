'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, Pencil, History, Eye, ChevronLeft, ChevronRight, Phone, Mail } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import type { Contato } from '@/lib/types';

// Componente para exibir contatos da exibidora
function ContatosExibidora({ idExibidora }: { idExibidora: number | null | undefined }) {
    const [contatos, setContatos] = useState<Contato[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!idExibidora) return;

        const fetchContatos = async () => {
            setLoading(true);
            try {
                const data = await api.getContatos(idExibidora);
                setContatos(data);
            } catch (error) {
                console.error('Erro ao buscar contatos:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchContatos();
    }, [idExibidora]);

    if (loading || contatos.length === 0) return null;

    return (
        <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-gray-600">Contatos:</p>
            {contatos.map((contato) => (
                <div key={contato.id} className="bg-gray-50 p-2 rounded text-sm">
                    {contato.nome && (
                        <p className="font-medium text-gray-900">{contato.nome}</p>
                    )}
                    {contato.telefone && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                            <Phone size={12} />
                            <span className="text-xs">{contato.telefone}</span>
                        </div>
                    )}
                    {contato.email && (
                        <div className="flex items-center gap-1 text-gray-600 mt-1">
                            <Mail size={12} />
                            <span className="text-xs">{contato.email}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function Sidebar() {
    const selectedPonto = useStore((state) => state.selectedPonto);
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const isSidebarOpen = useStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useStore((state) => state.setSidebarOpen);
    const setModalOpen = useStore((state) => state.setModalOpen);
    const setEditingPonto = useStore((state) => state.setEditingPonto);
    const setStreetViewRequest = useStore((state) => state.setStreetViewRequest);
    const setSelectedPonto = useStore((state) => state.setSelectedPonto);
    const setSelectedExibidora = useStore((state) => state.setSelectedExibidora);
    const setFilterExibidora = useStore((state) => state.setFilterExibidora);
    const setCurrentView = useStore((state) => state.setCurrentView);
    const exibidoras = useStore((state) => state.exibidoras);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Precisa estar antes do return condicional
    const imagens = selectedPonto?.imagens || [];
    const produtos = selectedPonto?.produtos || [];

    const handleEdit = useCallback(() => {
        if (selectedPonto) {
            setEditingPonto(selectedPonto);
            setModalOpen(true);
            setSidebarOpen(false);
        }
    }, [selectedPonto, setEditingPonto, setModalOpen, setSidebarOpen]);

    const handleHistory = useCallback(() => {
        // TODO: Implementar modal de histórico
        alert('Funcionalidade de histórico será implementada em breve');
    }, []);

    const handleStreetView = useCallback(() => {
        if (selectedPonto && selectedPonto.latitude && selectedPonto.longitude) {
            setStreetViewRequest({ lat: selectedPonto.latitude, lng: selectedPonto.longitude });
        }
    }, [selectedPonto, setStreetViewRequest]);

    const handleClose = useCallback(() => {
        // Se há uma exibidora selecionada, voltar para os detalhes dela
        if (selectedExibidora) {
            setSelectedPonto(null);
            // Sidebar permanece aberta mostrando ExibidoraSidebar
        } else {
            // Se não há exibidora, fechar completamente
            setSidebarOpen(false);
        }
    }, [selectedExibidora, setSelectedPonto, setSidebarOpen]);

    const handleExibidoraClick = useCallback(() => {
        if (selectedPonto && selectedPonto.id_exibidora) {
            const exibidora = exibidoras.find(ex => ex.id === selectedPonto.id_exibidora);
            if (exibidora) {
                // Fechar sidebar do ponto
                setSidebarOpen(false);
                // Aplicar filtro da exibidora
                setFilterExibidora([exibidora.id]);
                // Selecionar exibidora (abre ExibidoraSidebar)
                setSelectedExibidora(exibidora);
                // Garantir que está na view de mapa
                setCurrentView('map');
            }
        }
    }, [selectedPonto, exibidoras, setSidebarOpen, setFilterExibidora, setSelectedExibidora, setCurrentView]);

    const nextImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    }, [imagens.length]);

    const prevImage = useCallback(() => {
        setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
    }, [imagens.length]);

    // Auto-rotate de imagens a cada 3 segundos
    useEffect(() => {
        if (!selectedPonto || !isSidebarOpen || imagens.length <= 1) return;

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
    }, [imagens.length, selectedPonto, isSidebarOpen]);

    // Reset quando o ponto mudar
    useEffect(() => {
        if (selectedPonto) {
            setCurrentImageIndex(0);
        }
    }, [selectedPonto?.id]);

    // Só mostra se tiver ponto selecionado
    if (!selectedPonto || !isSidebarOpen) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 z-20 lg:hidden"
                onClick={handleClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-full sm:w-96 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-in-out overflow-y-auto">
                {/* Botão Fechar - Sticky (aparece sempre) */}
                <button
                    onClick={handleClose}
                    className="sticky top-3 right-3 ml-auto mr-3 z-50 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-all flex items-center justify-center"
                    title="Fechar"
                >
                    <X size={20} strokeWidth={2} />
                </button>

                {/* Header com imagens */}
                {imagens.length > 0 ? (
                    <div className="relative h-64 bg-gray-200 -mt-11">
                        <img
                            src={api.getImageUrl(imagens[currentImageIndex])}
                            alt={`Imagem ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                        />

                        {imagens.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition"
                                >
                                    <ChevronRight size={20} />
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-medium">
                                    {currentImageIndex + 1} / {imagens.length}
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="relative h-48 bg-gradient-to-br from-emidias-primary to-emidias-accent flex items-center justify-center -mt-11">
                        <MapPin size={64} className="text-white/30" />
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {/* Header */}
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {selectedPonto.codigo_ooh}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            {formatDate(selectedPonto.created_at)}
                        </p>
                    </div>

                    {/* Informações */}
                    <div className="space-y-4">
                        {/* Endereço */}
                        <div className="flex items-start gap-3">
                            <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <p className="font-medium text-gray-700">Endereço</p>
                                <p className="text-gray-900">{selectedPonto.endereco}</p>
                                {selectedPonto.cidade && selectedPonto.uf && (
                                    <p className="text-sm text-gray-500">
                                        {selectedPonto.cidade} - {selectedPonto.uf}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Exibidora */}
                        {selectedPonto.exibidora_nome && (
                            <div className="flex items-start gap-3">
                                <Building2 className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-700">Exibidora</p>
                                    <button
                                        onClick={handleExibidoraClick}
                                        className="text-gray-900 hover:text-emidias-accent hover:underline text-left font-medium transition"
                                    >
                                        {selectedPonto.exibidora_nome}
                                    </button>
                                    {selectedPonto.exibidora_cnpj && (
                                        <p className="text-sm text-gray-500">
                                            CNPJ: {selectedPonto.exibidora_cnpj}
                                        </p>
                                    )}

                                    {/* Contatos da Exibidora */}
                                    <ContatosExibidora idExibidora={selectedPonto.id_exibidora} />
                                </div>
                            </div>
                        )}

                        {/* Medidas */}
                        {selectedPonto.medidas && (
                            <div className="flex items-start gap-3">
                                <Ruler className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">Medidas</p>
                                    <p className="text-gray-900">{selectedPonto.medidas}</p>
                                </div>
                            </div>
                        )}

                        {/* Fluxo */}
                        {selectedPonto.fluxo && (
                            <div className="flex items-start gap-3">
                                <Users className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">Fluxo</p>
                                    <p className="text-gray-900">{selectedPonto.fluxo.toLocaleString()} pessoas/dia</p>
                                </div>
                            </div>
                        )}

                        {/* Tipo */}
                        {selectedPonto.tipo && (
                            <div className="flex items-start gap-3">
                                <FileText className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">Tipo</p>
                                    <p className="text-gray-900">{selectedPonto.tipo}</p>
                                </div>
                            </div>
                        )}

                        {/* Produtos */}
                        {produtos.length > 0 && (
                            <div>
                                <p className="font-medium text-gray-700 mb-2">Produtos e Valores</p>
                                <div className="space-y-2">
                                    {produtos.map((produto, idx) => (
                                        <div key={idx} className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium text-gray-900">{produto.tipo}</span>
                                                <span className="text-blue-600 font-bold">
                                                    {formatCurrency(produto.valor)}
                                                </span>
                                            </div>
                                            {produto.periodo && (
                                                <p className="text-sm text-gray-500 mt-1">{produto.periodo}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Observações */}
                        {selectedPonto.observacoes && (
                            <div className="flex items-start gap-3">
                                <FileText className="text-blue-600 mt-1 flex-shrink-0" size={20} />
                                <div>
                                    <p className="font-medium text-gray-700">Observações</p>
                                    <p className="text-gray-900 whitespace-pre-wrap">{selectedPonto.observacoes}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ações */}
                    <div className="mt-8 space-y-3">
                        {/* Street View - Destaque */}
                        {selectedPonto.latitude && selectedPonto.longitude && (
                            <button
                                onClick={handleStreetView}
                                className="w-full bg-emidias-accent text-white py-3 rounded-lg font-medium hover:bg-[#E01A6A] transition flex items-center justify-center gap-2 shadow-lg hover-lift"
                            >
                                <Eye size={18} />
                                Ver no Street View
                            </button>
                        )}

                        {/* Editar e Histórico */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleEdit}
                                className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <Pencil size={18} />
                                Editar
                            </button>
                            <button
                                onClick={handleHistory}
                                className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition flex items-center justify-center gap-2"
                            >
                                <History size={18} />
                                Histórico
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
