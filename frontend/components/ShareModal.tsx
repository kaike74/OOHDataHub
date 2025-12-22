'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Proposta, SharedUser } from '@/lib/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Copy, Globe, Lock, Mail, Check, X, User } from 'lucide-react';
import { toast } from 'sonner';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposta: Proposta | null;
    onUpdate?: () => void; // Trigger refresh
}

export default function ShareModal({ isOpen, onClose, proposta, onUpdate }: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer');
    const [loading, setLoading] = useState(false);
    const [publicAccess, setPublicAccess] = useState<'none' | 'view'>('none');
    const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);

    useEffect(() => {
        if (proposta) {
            setPublicAccess(proposta.public_access_level || 'none');
            setSharedUsers(proposta.sharedUsers || []);
        }
    }, [proposta]);

    const handleInvite = async () => {
        if (!proposta || !email) return;
        setLoading(true);
        try {
            await api.shareProposal(proposta.id, { email, role });
            toast.success('Convite enviado/atualizado com sucesso');
            setEmail('');
            if (onUpdate) onUpdate();

            // Optimistically update list if it's a new user or update
            // Ideally onUpdate re-fetches, but for UX:
            // (Logic to match onUpdate which should be passed from CartTable to refresh proposal)
        } catch (e: any) {
            toast.error(e.message || 'Erro ao convidar');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePublicAccess = async (value: 'none' | 'view') => {
        if (!proposta) return;
        try {
            // Optimistic update
            setPublicAccess(value);
            await api.shareProposal(proposta.id, { public_access_level: value });
            toast.success('Permissão de acesso público atualizada');
            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error('Erro ao atualizar permissão');
            setPublicAccess(proposta.public_access_level || 'none'); // Revert
        }
    };

    const handleUpdateUserRole = async (userEmail: string, newRole: string) => {
        if (!proposta) return;
        try {
            // If newRole is 'remove', we might need a specific delete endpoint or handle it here.
            // My backend currently supports upsert. 'remove' is not handled in backend yet?
            // Wait, I didn't verify DELETE or 'remove' logic in backend. 
            // I should add 'remove' to backend or just set role to 'none'?
            // Let's assume for now I only update roles. Removal might need separate button or backend update.
            // Proceeding with role update.

            await api.shareProposal(proposta.id, { email: userEmail, role: newRole as any });
            toast.success('Permissão atualizada');
            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error('Erro ao atualizar permissão');
        }
    };

    const handleCopyLink = () => {
        if (!proposta) return;
        let url = `${window.location.origin}/propostas/${proposta.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link copiado para a área de transferência');
    };

    if (!proposta) return null;

    // Determine current user permissions (Admin can manage)
    const canManage = proposta.currentUserRole === 'admin' || !proposta.currentUserRole; // Fallback if undefined (e.g. creator)
    // Actually, backend sets currentUserRole.

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Compartilhar Proposta"
            subtitle={proposta.nome}
            maxWidth="md"
            footer={
                <div className="flex justify-between w-full items-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyLink}
                        leftIcon={<Copy size={14} />}
                        className="text-blue-600 hover:bg-blue-50"
                    >
                        Copiar link
                    </Button>
                    <Button variant="primary" onClick={onClose}>
                        Concluído
                    </Button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Invite Section */}
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                placeholder="Adicionar pessoas (email)"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!canManage}
                            />
                        </div>
                        <div className="w-32">
                            <select
                                className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-50 disabled:text-gray-400"
                                value={role}
                                onChange={(e) => setRole(e.target.value as any)}
                                disabled={!canManage}
                            >
                                <option value="viewer">Leitor</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button
                            onClick={handleInvite}
                            disabled={!email || loading || !canManage}
                            isLoading={loading}
                            size="sm"
                        >
                            Enviar
                        </Button>
                    </div>
                </div>

                {/* General Access */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700">Acesso geral</h4>
                    <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className={`p-2 rounded-full ${publicAccess === 'none' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'}`}>
                            {publicAccess === 'none' ? <Lock size={20} /> : <Globe size={20} />}
                        </div>
                        <div className="flex-1">
                            <select
                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer"
                                value={publicAccess}
                                onChange={(e) => handleUpdatePublicAccess(e.target.value as any)}
                                disabled={!canManage}
                            >
                                <option value="none">Restrito</option>
                                <option value="view">Qualquer pessoa com o link (Leitor)</option>
                            </select>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {publicAccess === 'none'
                                    ? 'Somente pessoas adicionadas podem acessar com este link'
                                    : 'Qualquer pessoa na internet com este link pode ver'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* User List */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700">Pessoas com acesso</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                        {/* Owner implicit / derived? Backend returns sharedUsers. We should verify if owner is in list or separate. 
                            Usually separate. For now listing sharedUsers. */}

                        {sharedUsers.map((user) => (
                            <div key={user.email} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold uppercase">
                                        {user.name ? user.name.slice(0, 2) : user.email.slice(0, 2)}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-gray-800">{user.name || user.email.split('@')[0]}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                                <div>
                                    <select
                                        className="text-xs text-gray-600 bg-transparent border-none focus:ring-0 cursor-pointer hover:bg-gray-100 rounded px-2 py-1 transition-colors text-right disabled:opacity-50"
                                        value={user.role}
                                        onChange={(e) => handleUpdateUserRole(user.email, e.target.value)}
                                        disabled={!canManage}
                                    >
                                        <option value="viewer">Leitor</option>
                                        <option value="editor">Editor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                        ))}

                        {sharedUsers.length === 0 && (
                            <p className="text-sm text-gray-400 italic text-center py-2">Nenhum usuário convidado.</p>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
