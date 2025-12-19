'use client';

import { useState, useEffect } from 'react';
import { X, Clock, History as HistoryIcon, User } from 'lucide-react';
import { api } from '@/lib/api';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'proposals' | 'points';
    id: number | string;
}

interface AuditLog {
    id: number;
    action: string;
    changed_by: number;
    user_type: string;
    changes: any;
    created_at: string;
    user_name?: string;
}

export default function HistoryModal({ isOpen, onClose, type, id }: HistoryModalProps) {
    const [history, setHistory] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && id) {
            fetchHistory();
        }
    }, [isOpen, id]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const data = await api.getHistory(type, id);
            setHistory(data || []);
        } catch (error) {
            console.error('Failed to fetch history', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <HistoryIcon size={20} /> Histórico de Alterações
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Nenhuma alteração registrada.</div>
                    ) : (
                        <div className="space-y-4">
                            {history.map((log) => (
                                <div key={log.id} className="relative pl-6 border-l-2 border-gray-200 pb-4 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white" />

                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Clock size={14} />
                                            {new Date(log.created_at).toLocaleString()}
                                            <span className="mx-1">•</span>
                                            <User size={14} />
                                            <span className="font-medium text-gray-700">{log.user_name || 'Usuário Desconhecido'}</span>
                                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full uppercase">{log.user_type}</span>
                                        </div>

                                        <div className="mt-1">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold uppercase mb-2 ${log.action === 'CREATE' ? 'bg-green-100 text-green-700' :
                                                    log.action === 'UPDATE' ? 'bg-blue-100 text-blue-700' :
                                                        log.action === 'DELETE' ? 'bg-red-100 text-red-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {log.action}
                                            </span>

                                            <div className="bg-gray-50 p-3 rounded-lg text-sm font-mono text-gray-700 overflow-x-auto">
                                                <pre className="whitespace-pre-wrap">
                                                    {JSON.stringify(log.changes, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
