/**
 * Data normalization utilities for bulk import
 * Handles various input formats and converts to system standards
 */

// ============================================================================
// MEDIDAS (Tamanho)
// ============================================================================

export interface Medidas {
    largura: number;
    altura: number;
    unidade: 'M' | 'PX';
}

export function normalizeMedidas(input: string): Medidas {
    if (!input || typeof input !== 'string') {
        throw new Error('Medida inválida');
    }

    // Remove espaços extras
    let clean = input.trim().toUpperCase();

    // Detecta unidade (padrão: M)
    const unidade = clean.includes('PX') || clean.includes('PIXEL') ? 'PX' : 'M';

    // Remove unidade e texto extra
    clean = clean.replace(/\s*(M|PX|METROS?|PIXELS?)\s*/gi, '');

    // Normaliza separadores (vírgula → ponto)
    clean = clean.replace(/,/g, '.');

    // Extrai números
    const match = clean.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);

    if (!match) {
        throw new Error('Formato de medida inválido. Use: "9x3" ou "9x3 M"');
    }

    return {
        largura: parseFloat(match[1]),
        altura: parseFloat(match[2]),
        unidade
    };
}

export function formatMedidas(medidas: Medidas): string {
    return `${medidas.largura} x ${medidas.altura} ${medidas.unidade}`;
}

// ============================================================================
// TIPOS DE MÍDIA
// ============================================================================

// Tipos válidos no sistema
export const TIPOS_VALIDOS = [
    'Outdoor',
    'Frontlight',
    'Backlight',
    'Painel rodoviário',
    'Led',
    'Iluminado',
    'Digital',
    'Relógio de rua',
    'Empena',
    'Totem',
    'Busdoor',
    'Taxidoor'
] as const;

// Mapa de sinônimos
const SINONIMOS: Record<string, string> = {
    'front light': 'Frontlight',
    'front-light': 'Frontlight',
    'frontligth': 'Frontlight',
    'back light': 'Backlight',
    'back-light': 'Backlight',
    'backligth': 'Backlight',
    'painel de rodovia': 'Painel rodoviário',
    'painel rodovia': 'Painel rodoviário',
    'painel rodoviario': 'Painel rodoviário',
    'painel de estrada': 'Painel rodoviário',
    'relogio de rua': 'Relógio de rua',
    'relogio': 'Relógio de rua',
    'relógio': 'Relógio de rua',
    'bus door': 'Busdoor',
    'bus-door': 'Busdoor',
    'taxi door': 'Taxidoor',
    'taxi-door': 'Taxidoor',
};

function removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

function findBestMatch(input: string, options: readonly string[]): { value: string; score: number } {
    let bestMatch = options[0];
    let bestScore = 0;

    const inputNorm = removeAccents(input.toLowerCase());

    for (const option of options) {
        const optionNorm = removeAccents(option.toLowerCase());
        const distance = levenshteinDistance(inputNorm, optionNorm);
        const maxLen = Math.max(inputNorm.length, optionNorm.length);
        const score = 1 - distance / maxLen;

        if (score > bestScore) {
            bestScore = score;
            bestMatch = option;
        }
    }

    return { value: bestMatch, score: bestScore };
}

export function normalizeTipos(input: string): string[] {
    if (!input || typeof input !== 'string') {
        return [];
    }

    // Split por vírgula, ponto-e-vírgula ou barra
    const tipos = input.split(/[,;/]/).map(t => t.trim()).filter(Boolean);

    return tipos.map(tipo => {
        // Normaliza: lowercase, remove acentos
        const normalized = removeAccents(tipo.toLowerCase());

        // Busca sinônimo exato
        if (SINONIMOS[normalized]) {
            return SINONIMOS[normalized];
        }

        // Fuzzy match com tipos válidos
        const match = findBestMatch(tipo, TIPOS_VALIDOS);
        if (match.score > 0.7) {
            return match.value;
        }

        // Se não encontrou, mantém original com capitalize
        return capitalize(tipo);
    });
}

// ============================================================================
// COORDENADAS
// ============================================================================

export function normalizeCoordinate(input: string | number): number {
    if (typeof input === 'number') {
        return input;
    }

    // Converte para string
    let str = String(input).trim();

    // Remove aspas
    str = str.replace(/["']/g, '');

    // Vírgula → ponto
    str = str.replace(',', '.');

    const num = parseFloat(str);

    if (isNaN(num)) {
        throw new Error('Coordenada inválida');
    }

    // Valida range
    if (num < -180 || num > 180) {
        throw new Error('Coordenada fora do range válido (-180 a 180)');
    }

    return num;
}

// ============================================================================
// FLUXO
// ============================================================================

export function normalizeFluxo(input: string | number): number {
    if (typeof input === 'number') {
        return input;
    }

    let str = String(input).trim();

    // Remove pontos e vírgulas de milhar
    str = str.replace(/[.,]/g, '');

    const num = parseInt(str, 10);

    if (isNaN(num) || num < 0) {
        throw new Error('Fluxo inválido');
    }

    return num;
}

// ============================================================================
// VALORES MONETÁRIOS
// ============================================================================

export function normalizeValor(input: string | number): number {
    if (typeof input === 'number') {
        return input;
    }

    let str = String(input).trim();

    // Remove R$, espaços, etc
    str = str.replace(/[R$\s]/g, '');

    // Se tem vírgula e ponto, assume formato BR (5.000,00)
    if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    // Se só tem vírgula, assume decimal BR (5000,00)
    else if (str.includes(',')) {
        str = str.replace(',', '.');
    }

    const num = parseFloat(str);

    if (isNaN(num) || num < 0) {
        throw new Error('Valor inválido');
    }

    return num;
}

// ============================================================================
// NORMALIZAÇÃO COMPLETA DE PONTO
// ============================================================================

export interface NormalizationResult {
    success: boolean;
    value: any;
    warning?: string;
    error?: string;
}

export function normalizeField(
    fieldName: string,
    value: any
): NormalizationResult {
    try {
        switch (fieldName) {
            case 'medidas':
                if (!value) return { success: true, value: null };
                const medidas = normalizeMedidas(value);
                return {
                    success: true,
                    value: formatMedidas(medidas),
                    warning: !value.includes('M') && !value.includes('PX') ? 'Unidade não especificada, assumindo M' : undefined
                };

            case 'tipos':
                if (!value) return { success: true, value: null };
                const tipos = normalizeTipos(value);
                return {
                    success: true,
                    value: tipos.join(', '),
                    warning: tipos.some(t => !TIPOS_VALIDOS.includes(t as any)) ? 'Alguns tipos não foram reconhecidos' : undefined
                };

            case 'latitude':
            case 'longitude':
                if (!value) return { success: false, error: 'Coordenada obrigatória' };
                const coord = normalizeCoordinate(value);
                return { success: true, value: coord };

            case 'fluxo':
                if (!value) return { success: true, value: null };
                const fluxo = normalizeFluxo(value);
                return { success: true, value: fluxo };

            default:
                // Campos de texto simples
                return { success: true, value: value ? String(value).trim() : null };
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            value: value
        };
    }
}
