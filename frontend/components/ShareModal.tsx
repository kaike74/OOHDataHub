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

// ... inside component ...

const fetchClientUsers = async () => {
    // Fetch ALL users to allow cross-client sharing if needed, 
    // resolving the issue where only specific client users were shown.
    try {
        const users = await api.getAllClientUsers();
        setClientUsers(users || []);
    } catch (error) {
        console.error('Failed to fetch client users', error);
    }
}

// ... render ...
<select
    value={selectedUserId}
    onChange={(e) => setSelectedUserId(e.target.value === 'new' ? 'new' : Number(e.target.value))}
    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-emidias-primary focus:ring focus:ring-emidias-primary/20 p-2.5 text-gray-700"
>
    <option value="">Selecione um usuário...</option>
    {clientUsers.map(u => (
        <option key={u.id} value={u.id}>
            {u.name} ({u.client_name || 'Sem cliente'}) - {u.email}
        </option>
    ))}
    <option value="new" className="font-medium text-emidias-primary">+ Cadastrar Novo Usuário</option>
</select>
                                </div >

    { selectedUserId === 'new' && (
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

{
    successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium animate-in zoom-in">
            <Check size={18} />
            {successMessage}
        </div>
    )
}

{
    errorMessage && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center animate-in zoom-in">
            {errorMessage}
        </div>
    )
}

<button
    onClick={handlePortalShare}
    disabled={isLoading || (!selectedUserId && selectedUserId !== 'new')}
    className="w-full py-3 bg-emidias-primary hover:bg-emidias-primary-dark text-white rounded-xl font-semibold shadow-lg shadow-blue-500/10 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
>
    {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Share2 size={20} />}
    {selectedUserId === 'new' ? 'Cadastrar e Compartilhar' : 'Compartilhar Acesso'}
</button>
                            </div >
                        </div >
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
            <button
                onClick={generatePublicLink}
                disabled={isLoading}
                className="w-full py-3 bg-white border-2 border-emidias-primary text-emidias-primary hover:bg-blue-50 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <LinkIcon size={20} />}
                Gerar Link Público
            </button>
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
                </div >
            </div >
        </div >
    );
}
