import React from 'react';

export interface StatusBadgeProps {
    status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
    let bgColor, textColor, dotColor;
    switch (status) {
        case 'aprovado':
        case 'aprovada':
            bgColor = 'bg-plura-accent/10 border-plura-accent/20';
            textColor = 'text-plura-accent-dark';
            dotColor = 'bg-plura-accent';
            break;
        case 'em_negociacao':
            bgColor = 'bg-blue-50 border-blue-100';
            textColor = 'text-blue-700';
            dotColor = 'bg-blue-500';
            break;
        default: // Rascunho, etc.
            bgColor = 'bg-gray-100 border-gray-200';
            textColor = 'text-gray-600';
            dotColor = 'bg-gray-400';
    }

    return (
        <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 ${bgColor} ${textColor}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
            {status?.replace(/_/g, ' ') || 'Rascunho'}
        </span>
    );
}
