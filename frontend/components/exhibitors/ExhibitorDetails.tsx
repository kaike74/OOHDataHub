'use client';

import { useStore } from '@/lib/store';
import { api } from '@/lib/api';
import { Building2, FileText, MapPin, Phone, Mail, Pencil, Tag, Calendar, User } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import type { Contato } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';

interface ExhibitorDetailsProps {
    exhibitor: any; // Using any to match existing store type for now, but should ideally be Exhibitor type
    onEdit?: () => void;
    showEditButton?: boolean;
    showHeader?: boolean;
    className?: string;
}

// Internal component for contacts
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
        <div className="mt-4 space-y-2 w-full">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User size={12} />
                Contatos
            </p>
            {contatos.map((contato) => (
                <div key={contato.id} className="p-3 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-emidias-accent/30 transition-all flex flex-col gap-1.5 group">
                    <div className="flex justify-between items-start">
                        {contato.nome && (
                            <p className="font-semibold text-gray-900 text-sm">{contato.nome}</p>
                        )}
                        {/* Edit Contact Button (Future Implementation) */}
                        {/* <button className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-emidias-primary transition-opacity">
                            <Pencil size={12} />
                        </button> */}
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {contato.telefone && (
                            <a
                                href={`tel:${contato.telefone}`}
                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Phone size={12} />
                                {contato.telefone}
                            </a>
                        )}
                        {contato.email && (
                            <a
                                href={`mailto:${contato.email}`}
                                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-emidias-accent transition-colors"
                            >
                                <Mail size={12} />
                                {contato.email}
                            </a>
                        )}
                    </div>
                    {contato.observacoes && (
                        <p className="text-xs text-gray-500 mt-1 italic border-l-2 border-gray-200 pl-2">"{contato.observacoes}"</p>
                    )}
                </div>
            ))}
        </div>
    );
}

export default function ExhibitorDetails({ exhibitor, onEdit, showEditButton = true, showHeader = true, className = '' }: ExhibitorDetailsProps) {
    const puntos = useStore((state) => state.pontos);

    // Stats calculation
    const stats = useMemo(() => {
        if (!exhibitor) return null;
        const pontosExibidora = puntos.filter((p) => p.id_exibidora === exhibitor.id);
        const cidades = [...new Set(pontosExibidora.map((p) => p.cidade).filter(Boolean))];
        const ufs = [...new Set(pontosExibidora.map((p) => p.uf).filter(Boolean))];

        return {
            totalPontos: pontosExibidora.length,
            cidades: cidades as string[],
            ufs: ufs as string[],
        };
    }, [exhibitor, puntos]);

    if (!exhibitor) return null;

    return (
        <div className={`flex flex-col h-full ${className}`}>
            {showHeader && (
                <div className="relative h-44 bg-gray-100 flex-shrink-0 group">
                    {exhibitor.logo_r2_key ? (
                        <>
                            <SafeImage
                                src={api.getImageUrl(exhibitor.logo_r2_key)}
                                alt={exhibitor.nome}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <div className="text-center">
                                <Building2 size={40} className="text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-xs">Sem logo</p>
                            </div>
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-4 pt-10 text-white leading-tight">
                        <h2 className="text-xl font-bold mb-1 drop-shadow-md tracking-tight">
                            {exhibitor.nome}
                        </h2>
                        {exhibitor.created_at && (
                            <div className="flex items-center gap-1.5 text-xs text-white/90 font-medium">
                                <Calendar size={12} />
                                <span>Desde {formatDate(exhibitor.created_at)}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-5 space-y-6">
                    {/* Stats Badge */}
                    {stats && stats.totalPontos > 0 && (
                        <div className="p-3 bg-gradient-to-r from-emidias-accent/5 to-transparent rounded-xl border border-emidias-accent/10 flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-600">Total de Pontos</p>
                            <p className="text-2xl font-bold text-emidias-accent">
                                {stats.totalPontos}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* CNPJ */}
                        {exhibitor.cnpj && (
                            <div className="flex gap-3">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                    <FileText size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">CNPJ</p>
                                    <p className="text-gray-900 font-medium text-sm mt-0.5 font-mono">{exhibitor.cnpj}</p>
                                </div>
                            </div>
                        )}

                        {/* Razão Social */}
                        {exhibitor.razao_social && (
                            <div className="flex gap-3">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                    <Building2 size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Razão Social</p>
                                    <p className="text-gray-900 font-medium text-sm mt-0.5 leading-snug">{exhibitor.razao_social}</p>
                                </div>
                            </div>
                        )}

                        {/* Endereço */}
                        {exhibitor.endereco && (
                            <div className="flex gap-3">
                                <div className="mt-0.5 p-1.5 rounded-lg bg-gray-100 text-gray-500">
                                    <MapPin size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Endereço</p>
                                    <p className="text-gray-900 font-medium text-sm mt-0.5 leading-snug">{exhibitor.endereco}</p>
                                </div>
                            </div>
                        )}

                        {/* Regiões de Atuação */}
                        {stats && stats.cidades.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Tag size={14} className="text-gray-400" />
                                    <h3 className="font-bold text-xs uppercase text-gray-400 tracking-widest">Atuação</h3>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                    {stats.cidades.map((cidade, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium border border-gray-200"
                                        >
                                            {cidade}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contatos */}
                        {exhibitor.id && (
                            <div className="pt-2 border-t border-gray-100">
                                <ContatosExibidora idExibidora={exhibitor.id} />
                            </div>
                        )}
                    </div>
                    <div className="h-12"></div>
                </div>
            </div>

            {showEditButton && onEdit && (
                <div className="flex-shrink-0 p-3 border-t border-gray-100 bg-white/80 backdrop-blur-md">
                    <Button
                        onClick={onEdit}
                        variant="primary"
                        className="w-full shadow-md hover:shadow-lg transition-all rounded-xl"
                        leftIcon={<Pencil size={18} />}
                    >
                        Editar Exibidora
                    </Button>
                </div>
            )}
        </div>
    );
}
