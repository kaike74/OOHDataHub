'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Share2, Users, UserPlus, Mail, Link as LinkIcon, Search, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Proposta } from '@/lib/types';
import { useStore } from '@/lib/store';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

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
    const user = useStore(state => state.user);
    const [mode, setMode] = useState<'public' | 'portal'>('public'); // Default to public

    // ... (state)

    const isOwner = user && proposta && (user.role !== 'client' || user.id === proposta.created_by);
    const canInvite = !!isOwner;

    // Force public mode if not owner
    useEffect(() => {
        if (!canInvite) {
            setMode('public');
        } else {
            // If owner, maybe default to portal? or keep public. 
            // Let's keep existing logic or default to portal if owner opens it?
            // User didn't specify default. 'portal' is fine if owner.
            setMode('portal');
        }
    }, [canInvite, isOpen]);

    // ... (rest of effects)

    // ... (generatePublicLink, toggleUserSelection)

    // ... (handlePortalShare)

    // ... (copyToClipboard)

    return (
        <Modal
        // ... (props)
        >
            <div className="flex flex-col h-full">
                {/* Tabs - Only show if canInvite (Owner/Internal) */}
                {canInvite && (
                    <div className="flex border-b border-gray-100 mb-6 -mx-6 px-6 bg-gray-50/50">
                        <button
                            onClick={() => setMode('portal')}
                            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${mode === 'portal' ? 'text-emidias-primary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                        >
                            <Users size={18} />
                            Portal do Cliente
                            {mode === 'portal' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emidias-primary to-emidias-accent" />}
                        </button>
                        <button
                            onClick={() => setMode('public')}
                            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${mode === 'public' ? 'text-emidias-primary' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                        >
                            <LinkIcon size={18} />
                            Link Público
                            {mode === 'public' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emidias-primary to-emidias-accent" />}
                        </button>
                    </div>
                )}

                {/* Content */}
                {/* ... */}

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {mode === 'portal' ? (
                        <div className="space-y-6 pb-2">
                            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-900 flex gap-3">
                                <Share2 className="flex-shrink-0 mt-0.5 text-blue-600" size={18} />
                                <p>
                                    Compartilhe via <strong>Portal do Cliente</strong>. O cliente recebe um email com login e senha para acessar essa e outras propostas em um painel seguro.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Quem tem acesso</label>

                                    {/* Selected Users Chips */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {selectedUserIds.map((id) => {
                                            const user = clientUsers.find(u => u.id === id);
                                            if (!user) return null;
                                            return (
                                                <div key={id} className="flex items-center gap-1 pl-3 pr-1 py-1 rounded-full bg-emidias-primary/10 border border-emidias-primary/20 text-sm text-emidias-primary font-medium animate-fade-in-scale">
                                                    <span>{user.name}</span>
                                                    <button
                                                        onClick={() => toggleUserSelection(user.id)}
                                                        className="p-0.5 hover:bg-emidias-primary/20 rounded-full transition-colors ml-1"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Search / Add Input */}
                                    <div className="relative group">
                                        <Input
                                            icon={<Search size={18} />}
                                            placeholder="Adicionar pessoas (nome ou email)..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-gray-50/50"
                                        />

                                        {/* Dropdown Results */}
                                        {searchQuery && (
                                            <div className="absolute z-20 mt-1 w-full bg-white shadow-emidias-xl max-h-60 rounded-xl py-1 overflow-auto border border-gray-100 animate-fade-in-up">
                                                {filteredUsers.length > 0 ? (
                                                    filteredUsers.map((user) => (
                                                        <div
                                                            key={user.id}
                                                            onClick={() => {
                                                                toggleUserSelection(user.id);
                                                                setSearchQuery('');
                                                            }}
                                                            className="cursor-pointer select-none relative py-3 pl-4 pr-4 hover:bg-gray-50 transition-colors flex items-center gap-3 border-b border-gray-50 last:border-0"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-gradient-subtle flex items-center justify-center text-sm font-bold text-gray-600 uppercase border border-gray-200">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="block font-medium text-gray-900">{user.name}</span>
                                                                <span className="block truncate text-xs text-gray-500">{user.email}</span>
                                                            </div>
                                                            {selectedUserIds.includes(user.id) && (
                                                                <div className="text-emidias-success">
                                                                    <Check size={18} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div
                                                        className="cursor-pointer select-none relative py-4 px-4 hover:bg-gray-50 transition-colors text-gray-500"
                                                        onClick={() => {
                                                            setIsAddingNew(true);
                                                            setNewUser(prev => ({ ...prev, email: searchQuery }));
                                                            setSearchQuery('');
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="p-2 bg-emidias-primary/10 rounded-lg text-emidias-primary">
                                                                <UserPlus size={20} />
                                                            </div>
                                                            <div>
                                                                <span className="block font-medium text-gray-900">Convidar "{searchQuery}"</span>
                                                                <span className="block text-xs text-gray-500">Clique para cadastrar este novo usuário</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {isAddingNew && (
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4 animate-fade-in-up">
                                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                                            <div className="w-8 h-8 rounded-lg bg-emidias-accent/10 flex items-center justify-center text-emidias-accent">
                                                <UserPlus size={16} />
                                            </div>
                                            Convidar Novo Usuário
                                        </div>
                                        <Input
                                            label="Email Corporativo"
                                            placeholder="joao@empresa.com"
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="bg-white"
                                        />
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Mail size={12} />
                                            O usuário receberá um convite por email para se cadastrar e acessar a proposta.
                                        </p>
                                    </div>
                                )}

                                {successMessage && (
                                    <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-xl text-sm font-medium border border-green-100 animate-fade-in-scale">
                                        <Check size={18} />
                                        {successMessage}
                                    </div>
                                )}

                                {errorMessage && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 animate-fade-in-scale">
                                        {errorMessage}
                                    </div>
                                )}

                                <Button
                                    onClick={handlePortalShare}
                                    disabled={isLoading || (selectedUserIds.length === 0 && !isAddingNew)}
                                    isLoading={isLoading}
                                    className="w-full"
                                    leftIcon={!isLoading && <Share2 size={18} />}
                                >
                                    {isAddingNew && selectedUserIds.length === 0 ? 'Cadastrar e Compartilhar' : `Compartilhar (${selectedUserIds.length + (isAddingNew ? 1 : 0)})`}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 py-4">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-sm">
                                    <ExternalLink className="text-emidias-primary" size={32} />
                                </div>
                                <h3 className="font-bold text-xl text-gray-900">Link Público</h3>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                    Gere um link direto onde qualquer pessoa pode visualizar a proposta (sem valores de custo).
                                </p>
                            </div>

                            {!shareUrl ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                                    <div className="w-8 h-8 border-2 border-emidias-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                                    <span className="text-sm font-medium">Gerando link seguro...</span>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-2">Link de Acesso</label>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={shareUrl}
                                                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 focus:outline-none font-mono"
                                            />
                                            <Button
                                                onClick={copyToClipboard}
                                                variant={copied ? "secondary" : "outline"}
                                                className={copied ? "text-green-600 border-green-200 bg-green-50" : ""}
                                                leftIcon={copied ? <Check size={18} /> : <Copy size={18} />}
                                            >
                                                {copied ? 'Copiado!' : 'Copiar'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex justify-center">
                                        <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emidias-primary hover:text-emidias-accent transition-colors flex items-center gap-1">
                                            Testar link em nova aba <ExternalLink size={12} />
                                        </a>
                                    </div>
                                </div>
                            )}

                            {errorMessage && mode === 'public' && (
                                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl text-center border border-red-100 animate-fade-in-scale">
                                    {errorMessage}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
