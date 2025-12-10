'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { X, MapPin, Building2, Ruler, Users, FileText, Pencil, History, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const selectedPonto = useStore((state) => state.selectedPonto);
    const selectedExibidora = useStore((state) => state.selectedExibidora);
    const isSidebarOpen = useStore((state) => state.isSidebarOpen);
    const setSidebarOpen = useStore((state) => state.setSidebarOpen);
    const setModalOpen = useStore((state) => state.setModalOpen);
    const setEditingPonto = useStore((state) => state.setEditingPonto);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    const handleEdit = () => {
        if (selectedPonto) {
            setEditingPonto(selectedPonto);
            setModalOpen(true);
            setSidebarOpen(false);
        }
    };

    const handleHistory = () => {
        // TODO: Implementar modal de histórico
        alert('Funcionalidade de histórico será implementada em breve');
    };

    const setStreetViewPosition = useStore((state) => state.setStreetViewPosition);

    const handleStreetView = () => {
        if (selectedPonto && selectedPonto.latitude && selectedPonto.longitude) {
            setStreetViewPosition({
                lat: selectedPonto.latitude,
                lng: selectedPonto.longitude
            });
        }
    };

    // Só mostra se tiver ponto selecionado (não exibidora)
    if (!selectedPonto || !isSidebarOpen || selectedExibidora) return null;

    const imagens = selectedPonto.imagens || [];
    const produtos = selectedPonto.produtos || [];

    const nextImage = () => {
        setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
    };

    const prevImage = () => {
        setCurrentImageIndex((prev) => (prev - 1 + imagens.length) % imagens.length);
    };

    // Auto-rotate images every 3 seconds
    useEffect(() => {
        if (imagens.length <= 1) return;

        const interval = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % imagens.length);
        }, 3000);

        return () => clearInterval(interval);
    }, [imagens.length]);

    // Reset image index when ponto changes
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [selectedPonto?.id]);

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/20 z-20 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-[70px] h-[calc(100vh-70px)] w-full sm:w-96 bg-white shadow-2xl z-30 transform transition-transform duration-300 ease-in-out overflow-y-auto">
                {/* Botão Fechar - Sticky no topo */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="sticky top-0 right-0 z-50 float-right m-3 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full shadow-lg hover:scale-105 transition-all"
                    title="Fechar"
                >
                    <X size={20} strokeWidth={2} />
                </button>

                {/* Header com imagens */}
                {imagens.length > 0 && (
                    <div className="relative h-64 bg-gray-200 -mt-12">
                        <img
                            src={api.getImageUrl(imagens[currentImageIndex])}
                            alt={`Imagem ${currentImageIndex + 1}`}
                            className="w-full h-full object-cover"
                        />

                        {imagens.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                                >
                                    ◄
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                                >
                                    ►
                                </button>
                                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {imagens.length}
                                </div>
                            </>
                        )}
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
                                <div>
                                    <p className="font-medium text-gray-700">Exibidora</p>
                                    <p className="text-gray-900">{selectedPonto.exibidora_nome}</p>
                                    {selectedPonto.exibidora_cnpj && (
                                        <p className="text-sm text-gray-500">
                                            CNPJ: {selectedPonto.exibidora_cnpj}
                                        </p>
                                    )}
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
