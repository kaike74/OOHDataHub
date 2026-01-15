'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Proposta, SharedUser } from '@/lib/types';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Copy, Globe, Lock, Settings, ChevronDown, Link, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/lib/store';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposta: Proposta | null;
    onUpdate?: () => void;
}

export default function ShareModal({ isOpen, onClose, proposta, onUpdate }: ShareModalProps) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'viewer' | 'editor' | 'admin'>('viewer'); // Default to viewer
    const [sendEmail, setSendEmail] = useState(true); // Default to send email

    const [loading, setLoading] = useState(false);
    const [publicAccess, setPublicAccess] = useState<'none' | 'view'>('none');
    const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);

    useEffect(() => {
        if (proposta) {
            setPublicAccess(proposta.public_access_level || 'none');
            setSharedUsers(proposta.sharedUsers || []);
        }
    }, [proposta]);

    const requests = proposta?.accessRequests || [];

    const handleApproveRequest = async (req: any) => {
        if (!proposta) return;
        setLoading(true);
        try {
            await api.shareProposal(proposta.id, { email: req.email, role: 'viewer' });
            toast.success('Acesso aprovado');
            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error('Erro ao aprovar');
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async () => {
        if (!proposta || !email) return;
        setLoading(true);
        try {
            await api.shareProposal(proposta.id, { email, role, sendEmail });
            toast.success(sendEmail ? 'Convite enviado por email' : 'Acesso concedido');

            // Optimistic update
            setSharedUsers(prev => [...prev, {
                email,
                role,
                name: '', // Will be updated on refresh
                id: 0
            } as SharedUser]);

            setEmail('');
            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error(e.message || 'Erro ao convidar');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePublicAccess = async (value: 'none' | 'view') => {
        if (!proposta) return;
        try {
            setPublicAccess(value);
            await api.shareProposal(proposta.id, { public_access_level: value });
            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error('Erro ao atualizar permissão');
            setPublicAccess(proposta.public_access_level || 'none');
        }
    };

    const handleUpdateUserRole = async (userEmail: string, newRole: string) => {
        if (!proposta) return;
        try {
            await api.shareProposal(proposta.id, { email: userEmail, role: newRole as any });
            toast.success('Permissão atualizada');

            // Optimistic update
            setSharedUsers(prev => prev.map(u =>
                u.email === userEmail ? { ...u, role: newRole as any } : u
            ));

            if (onUpdate) onUpdate();
        } catch (e: any) {
            toast.error('Erro ao atualizar permissão');
        }
    };

    const handleCopyLink = () => {
        if (!proposta) return;

        // Use different URLs based on public access level
        if (publicAccess === 'view') {
            // Public link - use app URL with token if available, or ID
            // User requested: /propostas?id=codigo (where codigo is likely the public token or hash)
            const idParam = proposta.public_token || proposta.id;
            url = `${window.location.origin}/propostas?id=${idParam}`;
        } else {
            // Restricted link - use app internal URL
            // User requested: /propostas/{idusuario}?id={codigo/id}
            // We use the current user's ID if available, or the proposal owner's ID regarding the "context".
            // However, the link is for OTHERS to access.
            // If I share with an internal user, they will view it under THEIR user ID? 
            // Or the share link should point to a canonical internal URL?
            // "eu utilizo {idusuario} pq ali eu identifico qual o usuario... se é interno ou externo"
            // If I send a link to another internal employee, they should probably see it in their context?
            // BUT specific URL is requested: /propostas/{idusuario}?id=codigo
            // If I generate a link for SOMEONE ELSE, whose ID goes there?
            // If I am sending to User B, I don't know User B's ID.
            // Thus, the link presumably contains MY ID (the sender/creator)?
            // OR the link is generic `/propostas/internal?id=...`?
            // The prompt says: "https://oohdatahub.pages.dev/propostas/{idusuario}?id=codigo ... eu utilizo {idusuario} pq ali eu identifico qual o usuario"
            // It seems the {idusuario} is the one VIEWING it?
            // If so, we can't put it in the link we copy, because we don't know who will click it.
            // UNLESS the link is meant to be opened by the specific user.
            // BUT, if I just "Copy Link", it's generic.
            // Maybe the user meant "When I browse, the URL looks like that".
            // If I share, I should probably share a link that REDIRECTS to the user's scoped URL.
            // So sharing `${origin}/propostas?id=${proposta.id}` (without public token if restricted) 
            // is probably correct for internal sharing too, and the PAGE will redirect to `propostas/{me}?id=...`

            // However, to satisfy the user's specific request about link formation:
            // "o link é formado como ... mas preciso reformular para ..."
            // This implies the link IN THE BROWSER BAR.
            // But if I copy the link to send to someone...

            // Let's assume for sharing INTERNAL access, we provide the generic entry point:
            // `${origin}/propostas?id=${proposta.id}`
            // And let the router handle the `{idusuario}` injection upon visit.

            // Wait, "Interno: ... Quero compartilhar a minha proposta com um externo... O caminho idusuario, ficará vazio"
            // This implies the URL structure differentiates the access type.

            // Let's stick to generating `${origin}/propostas?id=${proposta.id}` for now, 
            // and rely on the redirection logic we added in `app/propostas/page.tsx` (to be updated) to handle the routing.
            // If the user meant "The link I COPY should look like X", I might be missing something.
            // But I can't know the recipient's ID.
            // Maybe `{idusuario}` is the CREATOR's ID? "identifico qual o usuario... permissoes... daquela proposta"
            // "O caminho idusuario, ficará vazio, então o link vai ficar..." for anonymous.
            // If it identifies the viewer, we can't bake it in.
            // If it identifies the owner, we can. `proposta.id_usuario`?
            // "identifico qual o usuario... se é interno ou externo... permissoes... *ele* (the viewer) tem"
            // So it MUST be the viewer.
            // Therefore, the shared link MUST be generic, and the app must redirect.
            url = `${window.location.origin}/propostas?id=${proposta.id}`;
        }

        navigator.clipboard.writeText(url);

        if (publicAccess === 'view') {
            toast.success('Link público copiado - qualquer pessoa pode visualizar');
        } else {
            toast.success('Link copiado - apenas pessoas com acesso podem visualizar');
        }
    };

    if (!proposta) return null;

    const canManage = proposta.currentUserRole === 'admin' || !proposta.currentUserRole;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Compartilhar "${proposta.nome}"`}
            maxWidth="md"
            className="p-0 overflow-hidden rounded-xl" // Override default padding if needed, or rely on internal
        // Custom header actions if Modal supports it, otherwise generic title
        >
            <div className="flex flex-col gap-6">
                {/* Access Requests Section */}
                {requests.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                            <Lock size={16} /> Solicitações de Acesso ({requests.length})
                        </h3>
                        <div className="space-y-3">
                            {requests.map((req) => (
                                <div key={req.request_id} className="flex items-center justify-between bg-white p-2 rounded shadow-sm border border-yellow-100">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{req.name || req.email}</span>
                                        <span className="text-xs text-gray-500">{req.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleApproveRequest(req)}
                                            disabled={loading}
                                            className="px-3 py-1.5 bg-yellow-600 text-white text-xs font-semibold rounded hover:bg-yellow-700 transition-colors"
                                        >
                                            Aprovar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input Section */}
                <div className="space-y-3">
                    <div className="relative">
                        <div className="flex rounded-md border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 overflow-hidden">
                            <input
                                type="text"
                                placeholder="Adicionar participantes, grupos, espaços e eventos da agenda"
                                className="flex-1 w-full border-none px-4 py-3 text-base text-gray-900 placeholder:text-gray-500 focus:ring-0 outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                disabled={!canManage}
                            />
                            {email && (
                                <button
                                    onClick={handleInvite}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
                                >
                                    Enviar
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Send Email Checkbox */}
                    {email && (
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={sendEmail}
                                onChange={(e) => setSendEmail(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Enviar notificação por email</span>
                        </label>
                    )}
                </div>

                {/* People List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-gray-900">Pessoas com acesso</h3>
                    </div>

                    <div className="flex flex-col gap-4 max-h-[300px] overflow-y-auto">
                        {/* Owner (Simulated for now if not in list, usually separate in real Sheets) */}
                        {/* If we knew the owner name/email from backend, we'd list it first. 
                            For now, assuming sharedUsers contains only invites. */}

                        {/* Current User Me (if owner/creator logic known) */}
                        <div className="flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-blue-700 text-white flex items-center justify-center text-sm font-medium">
                                    {/* Placeholder for 'You' */}
                                    VC
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-gray-900">Você</span>
                                    <span className="text-xs text-gray-500">owner@example.com</span>
                                </div>
                            </div>
                            <span className="text-sm text-gray-400 italic">Proprietário</span>
                        </div>


                        {sharedUsers.map((user) => (
                            <div key={user.email} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-medium uppercase">
                                        {user.name ? user.name.slice(0, 1) : user.email.slice(0, 1)}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium text-gray-900">{user.name || user.email.split('@')[0]}</span>
                                        <span className="text-xs text-gray-500">{user.email}</span>
                                    </div>
                                </div>

                                {canManage ? (
                                    <div className="relative">
                                        <select
                                            className="appearance-none bg-transparent text-sm font-medium text-gray-600 hover:text-black cursor-pointer pr-6 text-right focus:outline-none focus:ring-0 border-none"
                                            value={user.role}
                                            onChange={(e) => handleUpdateUserRole(user.email, e.target.value)}
                                        >
                                            <option value="viewer">Leitor</option>
                                            <option value="editor">Editor</option>
                                            <option value="admin">Administrador</option>
                                            <option value="remove">Remover acesso</option>
                                        </select>
                                        {/* Chevron overlay hack if needed, native select usually enough */}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500 capitalize">{user.role}</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* General Access */}
                <div className="space-y-4 pt-2">
                    <h3 className="text-base font-medium text-gray-900">Acesso geral</h3>
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${publicAccess === 'none' ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'}`}>
                            {publicAccess === 'none' ? <Lock size={20} /> : <Globe size={20} />}
                        </div>
                        <div className="flex flex-col flex-1">
                            <div className="relative inline-block w-fit">
                                <select
                                    className="appearance-none bg-transparent text-sm font-medium text-gray-900 pr-8 cursor-pointer focus:outline-none border-none p-0"
                                    value={publicAccess}
                                    onChange={(e) => handleUpdatePublicAccess(e.target.value as any)}
                                    disabled={!canManage}
                                >
                                    <option value="none">Restrito</option>
                                    <option value="view">Qualquer pessoa com o link</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                            <span className="text-xs text-gray-500 mt-0.5">
                                {publicAccess === 'none'
                                    ? 'Somente pessoas adicionadas podem acessar com este link.'
                                    : 'Qualquer pessoa na internet com este link pode ver.'}
                            </span>
                        </div>
                        {publicAccess === 'view' && (
                            <div className="text-sm text-gray-600 font-medium">
                                Leitor
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-6 mt-2">
                    <button
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-gray-300 text-blue-600 font-medium hover:bg-blue-50 hover:border-blue-400 transition-colors text-sm"
                    >
                        <Link size={18} />
                        Copiar link
                    </button>

                    <button
                        onClick={onClose}
                        className="px-8 py-2.5 bg-blue-700 text-white rounded-full font-medium hover:bg-blue-800 transition-colors text-sm"
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </Modal>
    );
}
