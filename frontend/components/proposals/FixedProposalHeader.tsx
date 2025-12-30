import { useProposalStore } from '@/stores/useProposalStore';
import { Button } from '@/components/ui/Button';
import { Share2, Save, Settings, ChevronLeft, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

export default function FixedProposalHeader() {
    const router = useRouter();
    const { selectedProposal, proposalItems } = useProposalStore();

    const stats = useMemo(() => {
        const totalItems = proposalItems.length;
        const totalValue = proposalItems.reduce((acc, item) => acc + (item.total_investimento || 0), 0);
        const totalImpacts = proposalItems.reduce((acc, item) => acc + (item.impactos || 0), 0);

        return { totalItems, totalValue, totalImpacts };
    }, [proposalItems]);

    if (!selectedProposal) return null;

    return (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-50 shadow-sm">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/propostas')}
                    className="p-1 text-gray-400 hover:text-gray-700"
                >
                    <ArrowLeft size={20} />
                </Button>

                <div>
                    <h1 className="text-sm font-semibold text-gray-900">{selectedProposal.nome}</h1>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span>🎯 {stats.totalItems} pontos</span>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span>💰 {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalValue)}</span>
                        <span className="w-px h-3 bg-gray-300"></span>
                        <span>👥 {new Intl.NumberFormat('pt-BR', { notation: 'compact' }).format(stats.totalImpacts)} impactos</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                    <Share2 size={14} />
                    Compartilhar
                </Button>
                <Button variant="primary" size="sm" className="gap-2">
                    <Save size={14} />
                    Salvar
                </Button>
                <div className="w-px h-6 bg-gray-200 mx-2"></div>
                <Button variant="ghost" size="sm" className="p-2">
                    <Settings size={18} className="text-gray-500" />
                </Button>
            </div>
        </div>
    );
}
