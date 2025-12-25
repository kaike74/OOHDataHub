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
    ponto_referencia: string | null;
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
    role: 'master' | 'editor' | 'viewer' | 'client';
    created_at?: string;
    client_name?: string | null;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface Cliente {
    id: number;
    nome: string;
    logo_url: string | null;
    created_at: string;
    cnpj?: string;
    origin?: 'internal' | 'external';
    created_by?: number;
    segmento?: string;
    publico_alvo?: string;
    regiao?: string;
    pacote_id?: number;
}

export interface SharedUser {
    email: string;
    name: string | null;
    role: 'viewer' | 'editor' | 'admin';
}

export interface Proposta {
    id: number;
    id_cliente: number;
    nome: string;
    comissao: 'V2' | 'V3' | 'V4';
    status: string;
    created_at: string;
    created_by?: number | null;
    public_token?: string;
    public_access_level?: 'none' | 'view'; // New
    currentUserRole?: 'none' | 'viewer' | 'editor' | 'admin'; // New
    sharedUsers?: SharedUser[]; // New
    accessRequests?: { request_id: number; user_id: number; email: string; name: string }[]; // New
    itens?: PropostaItem[];
}

export interface PropostaItem {
    id: number;
    id_proposta: number;
    id_ooh: number;
    periodo_inicio: string | null;
    periodo_fim: string | null;
    valor_locacao: number;
    valor_papel: number;
    valor_lona: number;
    periodo_comercializado: 'bissemanal' | 'mensal' | null;
    observacoes: string | null;
    fluxo_diario: number | null;

    // Enhanced fields from join with Ponto
    endereco?: string;
    cidade?: string;
    uf?: string;
    pais?: string;
    codigo_ooh?: string;
    exibidora_nome?: string;
    tipo?: string;
    medidas?: string;
    latitude?: number;
    longitude?: number;

    // Additional Cart Fields
    ponto_referencia?: string;
    periodo?: string;
    valor?: number;
    valor_negociado?: number;
    desconto_padrao?: number;
    total_investimento?: number;
    impactos?: number;
    cpm?: number;
    bairro?: string;
    exibidora?: string;
    produto?: string;
    qtd_bi_mes?: number;
    status?: string; // Add status for ghost points
    status_validacao?: 'PENDING' | 'VALIDATION' | 'APPROVED' | 'UNAVAILABLE';
    approved_until?: string | null;
    last_validated_by?: number;
    last_validated_at?: string;
    validator_name?: string;
}

export interface CustomMarker {
    id: string;
    lat: number;
    lng: number;
    title: string;
    description?: string;
    color?: string;
    rowId?: string;
}

export interface MapLayer {
    id: string;
    name: string;
    visible: boolean;
    color: string;
    markers: CustomMarker[];
    data?: any[]; // Raw data rows
    headers?: string[]; // Column headers
    config?: {
        addressCols: string[];
        nameCol: string;
    };
}
