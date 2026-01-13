'use client';

import { Exibidora } from '@/lib/types';
import { api } from '@/lib/api';
import { SafeImage } from '@/components/ui/SafeImage';
import { Building2, MapPin, Edit2, Trash2 } from 'lucide-react';

interface ExhibitorsTableProps {
    exibidoras: (Exibidora & { totalPontos?: number; cidades?: string[] })[];
    isLoading: boolean;
    onRowClick: (exibidora: Exibidora) => void;
    onEdit: (exibidora: Exibidora, e: React.MouseEvent) => void;
    // onDelete: (exibidora: Exibidora, e: React.MouseEvent) => void; 
    // Commented out delete as it wasn't explicitly requested/visible in previous grid view actions? 
    // Actually previous view didn't show delete button on card? Let's check ExibidorasView. 
    // It didn't seem to have delete button in the card. Just click to filter/view.
    // I will add Edit if available, otherwise just View.
}

export default function ExhibitorsTable({ exibidoras, isLoading, onRowClick, onEdit }: ExhibitorsTableProps) {
    if (isLoading) {
        return (
            <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emidias-accent"></div>
            </div>
        );
    }

    if (exibidoras.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-gray-100 text-center">
                <Building2 size={48} className="text-gray-200 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhuma exibidora encontrada</h3>
                <p className="text-sm text-gray-500 mt-1">Cadastre novas exibidoras para vê-las aqui.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[80px]">
                                Logo
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Exibidora
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                CNPJ
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Pontos
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Atuação
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Ações
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {exibidoras.map((exibidora) => (
                            <tr
                                key={exibidora.id}
                                onClick={() => onRowClick(exibidora)}
                                className="group hover:bg-gray-50/80 transition-colors cursor-pointer"
                            >
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 overflow-hidden">
                                        {exibidora.logo_r2_key ? (
                                            <SafeImage
                                                src={api.getImageUrl(exibidora.logo_r2_key)}
                                                alt={exibidora.nome}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <Building2 size={20} className="text-gray-300" />
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="font-medium text-gray-900 group-hover:text-emidias-primary transition-colors">
                                        {exibidora.nome}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="font-mono text-xs text-gray-500">
                                        {exibidora.cnpj || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {exibidora.totalPontos || 0}
                                    </span>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap">
                                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                                        {exibidora.cidades && exibidora.cidades.slice(0, 2).map((city, i) => (
                                            <span key={i} className="text-xs text-gray-500 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                                {city}
                                            </span>
                                        ))}
                                        {exibidora.cidades && exibidora.cidades.length > 2 && (
                                            <span className="text-xs text-gray-400 px-1">+{exibidora.cidades.length - 2}</span>
                                        )}
                                        {(!exibidora.cidades || exibidora.cidades.length === 0) && '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {/* Assuming Edit functionality exists or will be hooked */}
                                        <button
                                            onClick={(e) => onEdit && onEdit(exibidora, e)}
                                            className="p-2 text-gray-400 hover:text-emidias-accent hover:bg-emidias-accent/5 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
