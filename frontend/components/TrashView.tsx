'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useStore } from '@/lib/store';
import { Trash2, RefreshCw, FileText, MapPin, Loader2, Search } from 'lucide-react';
import HistoryModal from './HistoryModal';

type TrashType = 'proposals' | 'points';

export default function TrashView() {
    const [activeTab, setActiveTab] = useState<TrashType>('proposals');
    const [items, setItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null);

    const fetchTrash = async () => {
        setIsLoading(true);
        try {
            const data = await api.getTrash(activeTab);
            setItems(data || []);
        } catch (error) {
            console.error('Failed to fetch trash', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, [activeTab]);

    const handleRestore = async (id: number) => {
        if (!confirm('Deseja restaurar este item?')) return;
        setProcessingId(id);
        try {
            await api.restoreTrash(activeTab, id);
            setItems(items.filter(i => i.id !== id));
            alert('Item restaurado com sucesso!');
        } catch (error) {
            console.error('Error restoring item', error);
            alert('Erro ao restaurar item.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleDeletePermanent = async (id: number) => {
        if (!confirm('ATENÇÃO: Isso excluirá permanentemente o item e seu histórico. Deseja continuar?')) return;
        setProcessingId(id);
        try {
            await api.deleteTrash(activeTab, id);
            setItems(items.filter(i => i.id !== id));
        } catch (error) {
            console.error('Error deleting item', error);
            alert('Erro ao excluir item permanentemente.');
        } finally {
            setProcessingId(null);
        }
    };

    const handleViewHistory = (id: number) => {
        setSelectedHistoryId(id);
        setHistoryModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col bg-emidias-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-emidias-gray-200 px-6 py-8">
                <h1 className="text-2xl font-bold text-emidias-gray-900 flex items-center gap-2">
                    <Trash2 className="text-emidias-danger" />
                    Lixeira / Arquivo
                </h1>
                <p className="text-emidias-gray-500 mt-1">
                    Itens excluídos permanecem aqui por 30 dias antes da exclusão permanente.
                </p>

                <div className="flex gap-4 mt-6">
                    <button
                        onClick={() => setActiveTab('proposals')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'proposals'
                                ? 'bg-emidias-primary text-white shadow-md'
                                : 'bg-white text-emidias-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Propostas
                    </button>
                    <button
                        onClick={() => setActiveTab('points')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === 'points'
                                ? 'bg-emidias-primary text-white shadow-md'
                                : 'bg-white text-emidias-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        Pontos OOH
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="animate-spin text-emidias-primary" size={32} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-20 text-emidias-gray-400">
                        <Trash2 size={48} className="mx-auto mb-4 opacity-20" />
                        <p>A lixeira está vazia.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-emidias-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase">
                                <tr>
                                    <th className="px-6 py-4">Item</th>
                                    <th className="px-6 py-4">Detalhes</th>
                                    <th className="px-6 py-4">Deletado em</th>
                                    <th className="px-6 py-4 text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${activeTab === 'proposals' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                                                    }`}>
                                                    {activeTab === 'proposals' ? <FileText size={20} /> : <MapPin size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {activeTab === 'proposals' ? item.nome : item.codigo_ooh}
                                                    </p>
                                                    <p className="text-xs text-gray-500">ID: {item.id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {activeTab === 'proposals' ? (
                                                <span>Cliente: {item.client_name || 'N/A'}</span>
                                            ) : (
                                                <span>{item.cidade} - {item.uf}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(item.deleted_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleRestore(item.id)}
                                                    disabled={processingId === item.id}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                                                    title="Restaurar"
                                                >
                                                    {processingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeletePermanent(item.id)}
                                                    disabled={processingId === item.id}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Excluir Permanentemente"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <HistoryModal
                isOpen={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
                type={activeTab}
                id={selectedHistoryId || 0}
            />
        </div>
    );
}
