// API client para comunicação com Cloudflare Worker

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

// Função helper para obter o token do localStorage
function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const storage = localStorage.getItem('ooh-auth-storage');
        if (!storage) return null;

        const parsed = JSON.parse(storage);
        return parsed?.state?.token || null;
    } catch {
        return null;
    }
}

async function fetchAPI(endpoint: string, options?: RequestInit) {
    const token = getToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options?.headers as Record<string, string> || {}),
    };

    // Adiciona o token se existir
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
        const error: any = new Error(errorData.error || `HTTP ${response.status}`);
        error.status = response.status;
        error.canRequestAccess = errorData.canRequestAccess;
        throw error;
    }

    return response.json();
}

export const api = {
    // Auth
    login: (email: string, password: string) =>
        fetchAPI('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        }),

    getCurrentUser: () => fetchAPI('/api/users/me'),

    changePassword: (currentPassword: string, newPassword: string) =>
        fetchAPI('/api/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword }),
        }),

    forgotPassword: (email: string) =>
        fetchAPI('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        }),

    resetPassword: (token: string, newPassword: string) =>
        fetchAPI('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, newPassword }),
        }),

    // Users (master only)
    getUsers: () => fetchAPI('/api/users'),

    inviteUser: (email: string, name: string, role: 'master' | 'editor' | 'viewer') =>
        fetchAPI('/api/users/invite', {
            method: 'POST',
            body: JSON.stringify({ email, name, role }),
        }),

    deleteUser: (id: number) => fetchAPI(`/api/users/${id}`, {
        method: 'DELETE',
    }),

    updateUserRole: (id: number, role: 'master' | 'editor' | 'viewer') =>
        fetchAPI(`/api/users/${id}/role`, {
            method: 'PATCH',
            body: JSON.stringify({ role }),
        }),

    // Pontos
    getPontos: () => fetchAPI('/api/pontos'),
    getPonto: (id: number) => fetchAPI(`/api/pontos/${id}`),
    createPonto: (data: any) => fetchAPI('/api/pontos', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updatePonto: (id: number, data: any) => fetchAPI(`/api/pontos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deletePonto: (id: number) => fetchAPI(`/api/pontos/${id}`, {
        method: 'DELETE',
    }),

    // Exibidoras
    getExibidoras: () => fetchAPI('/api/exibidoras'),
    createExibidora: (data: any) => fetchAPI('/api/exibidoras', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateExibidora: (id: number, data: any) => fetchAPI(`/api/exibidoras/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    getExhibitorProposals: (id: number) => fetchAPI(`/api/exibidoras/${id}/propostas`),


    // Upload
    uploadImage: async (file: File, pontoId?: string, ordem?: number, ehCapa?: boolean) => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        if (pontoId) formData.append('pontoId', pontoId);
        if (ordem !== undefined) formData.append('ordem', String(ordem));
        if (ehCapa) formData.append('ehCapa', 'true');

        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/upload`, {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    },

    uploadExibidoraLogo: async (file: File, exibidoraId: string) => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('exibidoraId', exibidoraId);

        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/upload-logo`, {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    },

    uploadClientLogo: async (file: File, clienteId: string) => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clienteId', clienteId);

        const headers: Record<string, string> = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/upload-client-logo`, {
            method: 'POST',
            body: formData,
            headers,
        });

        if (!response.ok) {
            throw new Error('Upload failed');
        }

        return response.json();
    },

    // Contatos
    getContatos: (idExibidora: number) => fetchAPI(`/api/contatos?id_exibidora=${idExibidora}`),
    createContato: (data: any) => fetchAPI('/api/contatos', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateContato: (id: number, data: any) => fetchAPI(`/api/contatos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteContato: (id: number) => fetchAPI(`/api/contatos/${id}`, {
        method: 'DELETE',
    }),

    // Clientes
    getClientes: () => fetchAPI('/api/clientes'),
    createCliente: (data: any) => fetchAPI('/api/clientes', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateCliente: (id: number, data: any) => fetchAPI(`/api/clientes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    deleteCliente: (id: number) => fetchAPI(`/api/clientes/${id}`, {
        method: 'DELETE',
    }),
    getClientProposals: (id: number) => fetchAPI(`/api/clientes/${id}/propostas`),

    // Propostas
    getProposta: (id: number) => fetchAPI(`/api/propostas/${id}`),
    createProposta: (data: any) => fetchAPI('/api/propostas', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    updateProposta: (id: number, data: any) => fetchAPI(`/api/propostas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),
    updateCart: (idProposta: number, itens: any[]) => fetchAPI(`/api/propostas/${idProposta}/itens`, {
        method: 'PUT',
        body: JSON.stringify({ itens }),
    }),
    // Public Token Share (Legacy/Public)
    shareProposta: (id: number) => fetchAPI(`/api/propostas/${id}/share`, {
        method: 'POST'
    }),

    // Client Portal & Shared Access
    getAllClientUsers: () => fetchAPI('/api/clients'),
    getClientUsers: (clientId: number) => fetchAPI(`/api/clients/by-client/${clientId}`),

    registerClientUser: (data: { name: string; email: string }) => fetchAPI('/api/clients/register', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    registerClientPublic: (data: { name: string; email: string; password: string; inviteToken?: string }) => fetchAPI('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    verifyEmail: (token: string) => fetchAPI('/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ token })
    }),

    shareProposal: (id: number, data: { email?: string, role?: 'viewer' | 'editor' | 'admin', public_access_level?: 'none' | 'view' }) =>
        fetchAPI(`/api/propostas/${id}/share`, {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    shareProposalWithUser: (proposalId: number, clientUserId: number) => fetchAPI('/api/portal/share', {
        method: 'POST',
        body: JSON.stringify({ proposal_id: proposalId, client_user_id: clientUserId })
    }),

    // Portal (Client Side)
    portalLogin: (email: string, password: string) => fetchAPI('/api/clients/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),

    getPortalProposals: () => fetchAPI('/api/portal/proposals'),

    // Admin: Proposals
    getAdminProposals: () => fetchAPI('/api/propostas/admin/list'),

    // Admin: Accounts
    getAdminAccounts: () => fetchAPI('/api/admin/accounts'),
    getAccountShares: (userId: number) => fetchAPI(`/api/admin/accounts/${userId}/shares`),
    deleteAccount: (userId: number) => fetchAPI(`/api/admin/accounts/${userId}`, { method: 'DELETE' }),
    resetAccountPassword: (userId: number) => fetchAPI(`/api/admin/accounts/${userId}/reset`, { method: 'POST' }),
    deleteShare: (shareId: number) => fetchAPI(`/api/admin/shares/${shareId}`, { method: 'DELETE' }),

    getPortalProposal: (id: number) => fetchAPI(`/api/portal/proposals/${id}`),

    getPortalPoints: () => fetchAPI('/api/portal/points'),

    updatePortalProposalItems: (id: number, itens: any[]) => fetchAPI(`/api/portal/proposals/${id}/items`, {
        method: 'PUT',
        body: JSON.stringify({ itens })
    }),

    // Proposal Workflow
    inviteProposalUser: (proposalId: number, email: string) => fetchAPI(`/api/propostas/${proposalId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email })
    }),

    requestProposalAccess: (proposalId: number) => fetchAPI(`/api/propostas/${proposalId}/request-access`, {
        method: 'POST'
    }),

    updateProposalStatus: (id: number, status: string) => fetchAPI(`/api/propostas/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
    }),

    validateProposalItems: (id: number, items: any[]) => fetchAPI(`/api/propostas/${id}/validate-items`, {
        method: 'PUT',
        body: JSON.stringify({ items })
    }),

    getPublicProposal: (token: string) => fetchAPI(`/api/public/proposals/${token}`),

    // Layers
    getProposalLayers: (propostaId: number) => fetchAPI(`/api/propostas/${propostaId}/layers`),

    addProposalLayer: (propostaId: number, layer: any) => fetchAPI(`/api/propostas/${propostaId}/layers`, {
        method: 'POST',
        body: JSON.stringify(layer)
    }),

    deleteProposalLayer: (propostaId: number, layerId: string) => fetchAPI(`/api/propostas/${propostaId}/layers/${layerId}`, {
        method: 'DELETE',
    }),

    updateProposalLayer: (propostaId: number, layerId: string, updates: { visible?: boolean; color?: string; markers?: any[]; name?: string; data?: any[]; config?: any }) => fetchAPI(`/api/propostas/${propostaId}/layers/${layerId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
    }),

    // Stats
    getStats: () => fetchAPI('/api/stats'),

    // AI
    chatAI: (messages: any[], context: any) => fetchAPI('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, context }),
    }),

    // Helper para URL de imagem
    getImageUrl: (r2Key: string) => `${API_URL}/api/images/${encodeURIComponent(r2Key)}`,

    // History
    getHistory: (type: string, id: number | string) => fetchAPI(`/api/portal/history/${type}/${id}`),

    // Trash
    getTrash: (type: 'proposals' | 'points') => fetchAPI(`/api/trash/${type}`),
    restoreTrash: (type: 'proposals' | 'points', id: number | string) => fetchAPI(`/api/trash/${type}/${id}/restore`, { method: 'POST' }),
    deleteTrash: (type: 'proposals' | 'points', id: number | string) => fetchAPI(`/api/trash/${type}/${id}`, { method: 'DELETE' }),

    // Soft Delete Proposal override (if needed, currently standard deletePonto does DELETE)
    // Assuming backend handles soft delete on DELETE /api/propostas/:id
    deleteProposta: (id: number) => fetchAPI(`/api/propostas/${id}`, { method: 'DELETE' }),

    // Notifications
    getNotifications: () => fetchAPI('/api/notifications'),
    markNotificationRead: (id: number) => fetchAPI(`/api/notifications/${id}/read`, { method: 'POST' }),
    markAllNotificationsRead: () => fetchAPI('/api/notifications/read-all', { method: 'POST' }),

    // User Creation (Internal & External)
    createInternalUser: (data: { email: string; name: string; password: string; role: 'viewer' | 'editor' | 'admin' }) =>
        fetchAPI('/api/users/invite', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    createExternalUser: (data: { email: string; name: string; password: string; plan?: string }) =>
        fetchAPI('/api/clients/register', {
            method: 'POST',
            body: JSON.stringify(data)
        }),

    // Validation & Approval Workflow
    requestProposalValidation: (id: number) =>
        fetchAPI(`/api/propostas/${id}/request-validation`, { method: 'POST' }),

    validateProposal: (id: number) =>
        fetchAPI(`/api/propostas/${id}/validate`, { method: 'POST' }),

    approveProposal: (id: number) =>
        fetchAPI(`/api/propostas/${id}/approve`, { method: 'POST' }),
};
