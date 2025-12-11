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
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
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

    // Users (master only)
    getUsers: () => fetchAPI('/api/users'),

    inviteUser: (email: string, name: string, role: 'master' | 'viewer') =>
        fetchAPI('/api/users/invite', {
            method: 'POST',
            body: JSON.stringify({ email, name, role }),
        }),

    deleteUser: (id: number) => fetchAPI(`/api/users/${id}`, {
        method: 'DELETE',
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

    // Stats
    getStats: () => fetchAPI('/api/stats'),

    // Helper para URL de imagem
    getImageUrl: (r2Key: string) => `${API_URL}/api/images/${encodeURIComponent(r2Key)}`,
};
