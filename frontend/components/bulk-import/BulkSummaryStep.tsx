'use client';

import { useBulkImportStore } from '@/stores/useBulkImportStore';
import { CheckCircle2, Home, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useStore } from '@/lib/store';

export default function BulkSummaryStep() {
    const session = useBulkImportStore((state) => state.session);
    const clearSession = useBulkImportStore((state) => state.clearSession);
    const setModalOpen = useBulkImportStore((state) => state.setModalOpen);
    const setSidebarOpen = useStore((state) => state.setSidebarOpen);
    const fetchPontos = useStore((state) => state.fetchPontos);

    if (!session) return null;

    const totalPoints = session.pontos?.length || 0;
    const pointsWithImages = session.pontos?.filter(p => (p.imagens?.length || 0) > 0).length || 0;

    const handleClose = () => {
        // Clear session and close modal
        clearSession();
        setModalOpen(false);

        // Close sidebar to refresh view
        setSidebarOpen(false);
    };

    const handleNewImport = () => {
        // Clear current session
        clearSession();

        // Keep modal open but reset to step 1
        // The modal will handle restarting the import
        window.location.reload(); // Simple approach - reload to reset everything
    };

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-12">
            {/* Success Icon */}
            <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="relative bg-gradient-to-br from-green-400 to-green-600 rounded-full p-6 shadow-2xl">
                    <CheckCircle2 size={64} className="text-white" />
                </div>
            </div>

            {/* Success Message */}
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-bold text-gray-900">
                    Importação Concluída!
                </h2>
                <p className="text-lg text-gray-600 max-w-md">
                    {totalPoints} ponto{totalPoints !== 1 ? 's foram cadastrados' : ' foi cadastrado'} com sucesso na exibidora <strong>{session.exibidoraNome}</strong>
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="bg-gradient-to-br from-plura-primary/10 to-plura-accent/10 rounded-xl p-4 border border-plura-primary/20">
                    <div className="text-3xl font-bold text-plura-primary">{totalPoints}</div>
                    <div className="text-sm text-gray-600 mt-1">Pontos Cadastrados</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <div className="text-3xl font-bold text-green-600">{pointsWithImages}</div>
                    <div className="text-sm text-gray-600 mt-1">Com Fotos</div>
                </div>
            </div>

            {/* Summary List */}
            <div className="w-full max-w-2xl bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Pontos Importados</h3>
                <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar">
                    {session.pontos?.map((ponto, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate">{ponto.codigo_ooh}</p>
                                <p className="text-xs text-gray-500 truncate">{ponto.endereco}</p>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                {(ponto.imagens?.length || 0) > 0 && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                        {ponto.imagens?.length} foto{ponto.imagens?.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                                {(ponto.produtos?.length || 0) > 0 && (
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                        {ponto.produtos?.length} produto{ponto.produtos?.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full max-w-md">
                <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                    leftIcon={<Home size={18} />}
                >
                    Voltar para Exibidoras
                </Button>
                <Button
                    onClick={handleNewImport}
                    variant="primary"
                    className="flex-1"
                    leftIcon={<Plus size={18} />}
                >
                    Nova Importação
                </Button>
            </div>

            {/* Tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md text-center">
                <p className="text-sm text-blue-900">
                    💡 <strong>Dica:</strong> Os pontos já estão disponíveis no mapa e podem ser adicionados a propostas.
                </p>
            </div>
        </div>
    );
}
