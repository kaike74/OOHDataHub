'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Check, QrCode, ExternalLink, Loader2, Share2, Users, UserPlus, Mail, Link as LinkIcon, Plus } from 'lucide-react';
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

    // Multi-select state
    const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
    const [currentSelection, setCurrentSelection] = useState('');
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    const [newUser, setNewUser] = useState({ name: '', email: '' });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setErrorMessage('');
            setSuccessMessage('');
            setSelectedUserIds([]);
            setCurrentSelection('');
            setIsCreatingNew(false);
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

    const handleAddUser = (id: number) => {
        if (!selectedUserIds.includes(id)) {
            setSelectedUserIds([...selectedUserIds, id]);
        }
        setCurrentSelection('');
    };

    const handleRemoveUser = (id: number) => {
        setSelectedUserIds(selectedUserIds.filter(uid => uid !== id));
    };

    const handleCreateUser = async () => {
        if (!proposta || !newUser.name || !newUser.email) return;
        setIsLoading(true);
        try {
            const res = await api.registerClientUser({
                client_id: proposta.id_cliente,
                name: newUser.name,
                email: newUser.email
            });
            if (res.success && res.userId) {
                // Refresh list and add to selection
                await fetchClientUsers();
                handleAddUser(Number(res.userId));
                setNewUser({ name: '', email: '' });
                setIsCreatingNew(false);
                setSuccessMessage('Usuário criado e selecionado!');
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setErrorMessage(res.error || 'Falha ao criar usuário');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Erro ao criar usuário');
        } finally {
            setIsLoading(false);
        }
    };

    const handlePortalShare = async () => {
        if (!proposta) return;
        if (selectedUserIds.length === 0) {
            setErrorMessage('Selecione pelo menos um usuário');
            return;
        }

        setIsLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            // Sequential sharing (could be Promise.all but let's do sequential to track errors if needed)
            // or just trigger all.
            const results = await Promise.all(
                selectedUserIds.map(userId => api.shareProposalWithUser(proposta.id, userId))
            );

            const failures = results.filter(r => !r.success);

            if (failures.length === 0) {
                setSuccessMessage(`Proposta compartilhada com ${selectedUserIds.length} usuário(s)!`);
                setSelectedUserIds([]); // Reset selection
            } else {
                throw new Error(`Falha ao compartilhar com ${failures.length} usuário(s)`);
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Selecionar Clientes</label>
                                    <div className="flex gap-2 mb-2">
                                        <select
                                            value={currentSelection}
                                            onChange={(e) => {
                                                if (e.target.value === 'new') {
                                                    setIsCreatingNew(true);
                                                    setCurrentSelection('');
                                                } else if (e.target.value) {
                                                    handleAddUser(Number(e.target.value));
                                                }
                                            }}
                                            className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-emidias-primary focus:ring focus:ring-emidias-primary/20 p-2.5 text-gray-700"
                                        >
                                            <option value="">Adicionar usuário...</option>
                                            {clientUsers
                                                .filter(u => !selectedUserIds.includes(u.id))
                                                .map(u => (
                                                    <option key={u.id} value={u.id}>
                                                        {u.name} - {u.email}
                                                    </option>
                                                ))}
                                            <option value="new" className="font-medium text-emidias-primary">+ Cadastrar Novo Usuário</option>
                                        </select>
                                    </div>

                                    {/* Selected Users List */}
                                    {selectedUserIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {selectedUserIds.map(id => {
                                                const user = clientUsers.find(u => u.id === id);
                                                if (!user) return null;
                                                return (
                                                    <div key={id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 border border-blue-100">
                                                        <span>{user.name}</span>
                                                        <button
                                                            onClick={() => handleRemoveUser(id)}
                                                            className="hover:text-blue-900 focus:outline-none"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {isCreatingNew && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3 animate-in fade-in slide-in-from-top-2 relative">
                                        <button
                                            onClick={() => setIsCreatingNew(false)}
                                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16} />
                                        </button>
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

                                        <button
                                            onClick={handleCreateUser}
                                            disabled={isLoading || !newUser.name || !newUser.email}
                                            className="w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                                            Cadastrar e Selecionar
                                        </button>

                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Mail size={12} />
                                            As credenciais serão enviadas por email.
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
                                    disabled={isLoading || selectedUserIds.length === 0}
                                    className="w-full py-3 bg-emidias-primary hover:bg-emidias-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
                                    Compartilhar com {selectedUserIds.length > 0 ? `${selectedUserIds.length} usuário(s)` : 'Selecionados'}
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
