import { useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CorrectionDiff {
    field: string;
    original: string;
    corrected: string;
    type: 'normalized' | 'fixed' | 'warning';
}

interface CorrectionTooltipProps {
    corrections: CorrectionDiff[];
    children: React.ReactNode;
}

export function CorrectionTooltip({ corrections, children }: CorrectionTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (corrections.length === 0) {
        return <>{children}</>;
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {children}

            {/* Indicator badge */}
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle2 size={10} className="text-white" />
            </div>

            {/* Tooltip */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-80 bg-gray-900 text-white text-xs rounded-lg shadow-2xl p-3 animate-in fade-in zoom-in duration-200">
                    <div className="font-semibold mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={12} className="text-blue-400" />
                        Correções Automáticas
                    </div>
                    <div className="space-y-2">
                        {corrections.map((correction, idx) => (
                            <div key={idx} className="border-l-2 border-blue-400 pl-2">
                                <div className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">
                                    {correction.field}
                                </div>
                                <div className="flex items-start gap-2">
                                    <div className="flex-1">
                                        <div className="line-through text-red-300 opacity-75">
                                            {correction.original || '(vazio)'}
                                        </div>
                                        <div className="text-green-300 font-medium">
                                            → {correction.corrected}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-400">
                        💡 Valores normalizados automaticamente
                    </div>
                </div>
            )}
        </div>
    );
}

interface DiffBadgeProps {
    hasCorrections: boolean;
    count: number;
}

export function DiffBadge({ hasCorrections, count }: DiffBadgeProps) {
    if (!hasCorrections || count === 0) return null;

    return (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">
            <CheckCircle2 size={10} />
            {count}
        </div>
    );
}

interface CellDiffProps {
    original: string | number | null;
    corrected: string | number | null;
    isEditing?: boolean;
}

export function CellDiff({ original, corrected, isEditing }: CellDiffProps) {
    const [isHovered, setIsHovered] = useState(false);
    const hasChange = original !== corrected && original != null && corrected != null;

    if (!hasChange || isEditing) {
        return <span>{corrected || <span className="text-gray-300 italic">vazio</span>}</span>;
    }

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span className="border-b-2 border-dashed border-blue-400 cursor-help">
                {corrected}
            </span>

            {/* Tooltip positioned above */}
            {isHovered && (
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-[9999] bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-2xl pointer-events-none whitespace-nowrap">
                    <div className="line-through text-red-300 opacity-75 text-[10px]">
                        {String(original)}
                    </div>
                    <div className="text-green-300 font-medium">
                        → {String(corrected)}
                    </div>
                    {/* Arrow */}
                    <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-px">
                        <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                </div>
            )}
        </div>
    );
}
