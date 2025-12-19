'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, ExternalLink, Loader2, Share2, Users, UserPlus, Mail, Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { Proposta } from '@/lib/types';
// import { toast } from 'sonner';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposta: Proposta | null;
}

interface ClientUser {
    id: number;
    name: string;
    email: string;
    client_name?: string;
}

export default function ShareModal({ isOpen, onClose, proposta }: ShareModalProps) {
    const [mode, setMode] = useState<'public' | 'portal'>('portal');
    const [isLoading, setIsLoading] = useState(false);

    // Public Link State
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);

    // Portal State
    const [clientUsers, setClientUsers] = useState<ClientUser[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<(string | number)[]>([]); // Array of IDs or 'new'
    const [newUser, setNewUser] = useState({ name: '', email: '' });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setErrorMessage('');
            setSuccessMessage('');
            setSelectedUserIds([]); // Reset selection on open
            setIsAddingNew(false);
        }
        if (isOpen && proposta && mode === 'portal') {
            fetchClientUsers();
        }
    }, [isOpen, proposta, mode]);

    // Auto-generate link when switching to public mode
    useEffect(() => {
        if (isOpen && proposta && mode === 'public' && !shareUrl && !isLoading) {
            generatePublicLink();
        }
    }, [mode, isOpen, proposta, shareUrl]);

    const fetchClientUsers = async () => {
        // Fetch ALL users to allow cross-client sharing if needed
        try {
            const users = await api.getAllClientUsers();
            setClientUsers(users || []);
        } catch (error) {
            console.error('Failed to fetch client users', error);
        }
    }

    const generatePublicLink = async () => {
        if (!proposta) return;
        setIsLoading(true);
        setErrorMessage('');
        try {
            const res = await api.shareProposta(proposta.id);
            if (res.success && res.token) {
                const url = `${window.location.origin}/portal/view?token=${res.token}`;
                setShareUrl(url);
            } else {
                setErrorMessage('Falha ao gerar link');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Erro ao conectar');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleUserSelection = (id: string | number) => {
        setSelectedUserIds(prev =>
            prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
        );
    };

    const handlePortalShare = async () => {
        if (!proposta) return;
        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        const usersToShare: number[] = [];

        try {
            // First, handle new user creation if active
            if (isAddingNew) {
                if (!newUser.name || !newUser.email) {
                    setErrorMessage('Preencha nome e email para o novo usuário');
                    setIsLoading(false);
                    return;
                }
                const res = await api.registerClientUser({
                    client_id: proposta.id_cliente,
                    name: newUser.name,
                    email: newUser.email
                });
                if (res.success && res.userId) {
                    usersToShare.push(Number(res.userId));
                    // Add to list and select visually? Actually we just share below.
                } else {
                    throw new Error(res.error || 'Falha ao criar usuário');
                }
            }

            // Combine with selected existing users
            const existingIds = selectedUserIds.filter(id => typeof id === 'number').map(Number);
            usersToShare.push(...existingIds);

            if (usersToShare.length === 0) throw new Error('Selecione pelo menos um usuário');

            // Iterate and share
            let successCount = 0;
            for (const userId of usersToShare) {
                try {
                    const shareRes = await api.shareProposalWithUser(proposta.id, userId);
                    if (shareRes.success) {
                        successCount++;
                    }
                } catch (e) {
                    console.error(`Falha ao compartilhar com usuário ${userId}`, e);
                }
            }

            if (successCount > 0) {
                setSuccessMessage(isAddingNew && successCount === 1
                    ? `Convite enviado para ${newUser.email} com acesso à proposta!`
                    : `Proposta compartilhada com ${successCount} usuário(s)!`);

                if (isAddingNew) {
                    setNewUser({ name: '', email: '' });
                    setIsAddingNew(false);
                    fetchClientUsers(); // Refresh list
                }
                setSelectedUserIds([]); // Reset selection
            } else {
                throw new Error('Falha ao compartilhar proposta');
            }

        } catch (err: any) {
            setErrorMessage(err.message || 'Erro ao compartilhar');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Share2 className="text-emidias-primary" size={24} />
                        Compartilhar Proposta
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setMode('portal')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${mode === 'portal' ? 'text-emidias-primary bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <Users size={18} />
                        Portal do Cliente
                        {mode === 'portal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emidias-primary" />}
                    </button>
                    <button
                        onClick={() => setMode('public')}
                        className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${mode === 'public' ? 'text-emidias-primary bg-blue-50/50' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <LinkIcon size={18} />
                        Link Público
                        {mode === 'public' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emidias-primary" />}
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    {mode === 'portal' ? (
                        <div className="space-y-6">
                            <div className="bg-blue-50 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
                                <Share2 className="flex-shrink-0 mt-0.5" size={18} />
                                <p>
                                    Compartilhe via <strong>Portal do Cliente</strong>. O cliente recebe um email com login e senha para acessar essa e outras propostas em um painel seguro.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Usuários</label>
                                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50/50 space-y-1 custom-scrollbar">
                                        {clientUsers.length === 0 && <p className="text-sm text-gray-500 p-2 text-center">Nenhum usuário encontrado.</p>}
                                        {clientUsers.map(u => (
                                            <div
                                                key={u.id}
                                                onClick={() => toggleUserSelection(u.id)}
                                                className={`flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors ${selectedUserIds.includes(u.id) ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-100 border border-transparent'}`}
                                            >
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedUserIds.includes(u.id) ? 'bg-emidias-primary border-emidias-primary text-white' : 'bg-white border-gray-300'}`}>
                                                    {selectedUserIds.includes(u.id) && <Check size={12} />}
                                                </div>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="text-sm font-medium text-gray-900 truncate">{u.name}</div>
                                                    <div className="text-xs text-gray-500 truncate">{u.email}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setIsAddingNew(!isAddingNew)}
                                        className={`mt-3 text-sm font-medium flex items-center gap-1.5 transition-colors ${isAddingNew ? 'text-emidias-primary' : 'text-gray-500 hover:text-emidias-primary'}`}
                                    >
                                        <UserPlus size={16} />
                                        {isAddingNew ? 'Cancelar Cadastro' : 'Cadastrar Novo Usuário'}
                                    </button>
                                </div>

                                {isAddingNew && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800 mb-2">
                                            <UserPlus size={16} /> Novo Cadastro
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Nome Completo</label>
                                            <input
                                                type="text"
                                                value={newUser.name}
                                                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                placeholder="Ex: João Silva"
                                                className="w-full rounded-md border-gray-300 text-sm p-2 focus:border-emidias-primary focus:ring-1 focus:ring-emidias-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Email Corporativo</label>
                                            <input
                                                type="email"
                                                value={newUser.email}
                                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                placeholder="joao@empresa.com"
                                                className="w-full rounded-md border-gray-300 text-sm p-2 focus:border-emidias-primary focus:ring-1 focus:ring-emidias-primary"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                            <Mail size={12} />
                                            As credenciais de acesso serão enviadas para este email.
                                        </p>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium animate-in zoom-in">
                                        <Check size={18} />
                                        {successMessage}
                                    </div>
                                )}

                                {errorMessage && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-in zoom-in">
                                        {errorMessage}
                                    </div>
                                )}

                                <button
                                    onClick={handlePortalShare}
                                    disabled={isLoading || (selectedUserIds.length === 0 && !isAddingNew)}
                                    className="w-full py-3 bg-emidias-primary hover:bg-emidias-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                                    {isAddingNew && selectedUserIds.length === 0 ? 'Cadastrar e Compartilhar' : `Compartilhar (${selectedUserIds.length + (isAddingNew ? 1 : 0)})`}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <ExternalLink className="text-blue-600" size={24} />
                                </div>
                                <h3 className="font-medium text-gray-900">Link Público</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                    Gera um link direto onde qualquer pessoa com o link pode visualizar a proposta (sem valores de custo).
                                </p>
                            </div>

                            {!shareUrl ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <Loader2 className="animate-spin mb-2 text-emidias-primary" size={24} />
                                    <span className="text-sm">Gerando link público...</span>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider block">Link de Acesso</label>
                                    <div className="flex gap-2">
                                        <input
                                            readOnly
                                            value={shareUrl}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"
                                        />
                                        <button
                                            onClick={copyToClipboard}
                                            className={`px-3 py-2 rounded-lg border flex items-center gap-2 transition-all ${copied ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                        >
                                            {copied ? <Check size={18} /> : <Copy size={18} />}
                                        </button>
                                    </div>
                                    <div className="flex justify-center mt-2">
                                        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-emidias-primary hover:underline flex items-center gap-1">
                                            Abir link <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {errorMessage && mode === 'public' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-in zoom-in">
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
