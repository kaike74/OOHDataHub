// Types do sistema OOH

export interface Ponto {
    id: number;
    codigo_ooh: string;
    endereco: string;
    latitude: number | null;
    longitude: number | null;
    cidade: string | null;
    uf: string | null;
    pais: string | null;
    id_exibidora: number | null;
    medidas: string | null;
    fluxo: number | null;
    tipos: string | null;
    tipo: string | null; // Alias para tipos (nome da coluna no DB)
    observacoes: string | null;
    status: string;
    created_at: string;
    updated_at: string;
    exibidora_nome?: string;
    exibidora_cnpj?: string;
    imagens: string[];
    produtos: Produto[];
}

export interface Produto {
    id?: number;
    id_ponto?: number;
    tipo: string;
    valor: number;
    periodo: string | null;
    created_at?: string;
}

export interface Exibidora {
    id: number;
    nome: string;
    cnpj: string | null;
    razao_social: string | null;
    endereco: string | null;
    observacoes: string | null;
    logo_r2_key: string | null;
    created_at: string;
}

export interface Contato {
    id: number;
    id_exibidora: number;
    nome: string | null;
    telefone: string | null;
    email: string | null;
    observacoes: string | null;
    created_at: string;
}

export interface Stats {
    total_pontos: number;
    total_exibidoras: number;
    valor_medio: number;
    por_cidade: { cidade: string; count: number }[];
    por_tipo: { tipo: string; count: number; valor_medio: number }[];
}

export interface MapBounds {
    north: number;
    south: number;
    east: number;
    west: number;
}

export interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'master' | 'viewer';
    created_at: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}
