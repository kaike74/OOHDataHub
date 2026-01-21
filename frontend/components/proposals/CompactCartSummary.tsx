import { useProposalStore } from '@/stores/useProposalStore';
import CartTable from '@/components/CartTable';
import { ChevronUp, ChevronDown, ShoppingCart } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useMemo } from 'react';

export default function CompactCartSummary() {
    const {
        ui,
        toggleCart,
        proposalItems,
        selectedProposal
    } = useProposalStore();

    const { totalValue, itemCount } = useMemo(() => {
        const total = proposalItems.reduce((acc, item) => acc + (item.total_investimento || 0), 0);
        return { totalValue: total, itemCount: proposalItems.length };
    }, [proposalItems]);

    // Handle toggle
    const handleToggle = () => {
        toggleCart();
    };

    if (!selectedProposal) return null;

    return (
        <div
            className={cn(
                "fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex flex-col bg-white",
                ui.isCartOpen ? "translate-y-0 h-[400px]" : "translate-y-[calc(100%-48px)] h-[400px]"
            )}
        >
            {/* Toggle Handle / Summary Header */}
            <div
                onClick={handleToggle}
                className="h-12 bg-white border-t border-gray-200 hover:bg-gray-50 cursor-pointer flex items-center justify-between px-6 z-50 relative transition-colors group"
            >
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-plura-primary font-bold">
                        <ShoppingCart size={18} />
                        <span>{itemCount} itens selecionados</span>
                    </div>
                    <span className="w-px h-4 bg-gray-300"></span>
                    <span className="text-gray-600 font-medium">
                        Total: <span className="text-gray-900 font-bold">{formatCurrency(totalValue)}</span>
                    </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 group-hover:text-gray-600">
                    {ui.isCartOpen ? 'Ocultar Itens' : 'Ver Detalhes'}
                    {ui.isCartOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                </div>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-hidden relative bg-white">
                <CartTable
                    isOpen={ui.isCartOpen}
                    onToggle={handleToggle}
                    proposta={selectedProposal}
                    readOnly={false}
                // Pass items directly if CartTable supports it, currently it fetches from store or prop
                // Ideally check CartTable implementation to ensure it uses the prop if provided clearly
                />
            </div>
        </div>
    );
}
