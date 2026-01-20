/**
 * ADVANCED Data normalization utilities for bulk import
 * Handles EXTREME variety of input formats and converts to system standards
 */

// ============================================================================
// MEDIDAS (Tamanho) - ADVANCED
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

    // Remove unidade e texto extra (metros, pixels, etc)
    clean = clean.replace(/\s*(M|PX|METROS?|PIXELS?|METRO|PIXEL)\s*/gi, '');

    // Normaliza separadores (vírgula → ponto)
    clean = clean.replace(/,/g, '.');

    // Extrai números (suporta formatos: 9x3, 9 x 3, 9X3, 9×3)
    const match = clean.match(/(\d+\.?\d*)\s*[xX×]\s*(\d+\.?\d*)/);

    if (!match) {
        throw new Error('Formato de medida inválido');
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
// TIPOS DE MÍDIA - ADVANCED
// ============================================================================

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

// Mapa EXPANDIDO de sinônimos
const SINONIMOS: Record<string, string> = {
    'front light': 'Frontlight',
    'front-light': 'Frontlight',
    'frontligth': 'Frontlight',
    'frontlite': 'Frontlight',
    'front lite': 'Frontlight',
    'back light': 'Backlight',
    'back-light': 'Backlight',
    'backligth': 'Backlight',
    'backlite': 'Backlight',
    'back lite': 'Backlight',
    'painel de rodovia': 'Painel rodoviário',
    'painel rodovia': 'Painel rodoviário',
    'painel rodoviario': 'Painel rodoviário',
    'painel de estrada': 'Painel rodoviário',
    'painel estrada': 'Painel rodoviário',
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

    // Split por vírgula, ponto-e-vírgula, barra, ou "e"
    const tipos = input.split(/[,;/]|\s+e\s+/).map(t => t.trim()).filter(Boolean);

    return tipos.map(tipo => {
        // Normaliza: lowercase, remove acentos
        const normalized = removeAccents(tipo.toLowerCase());

        // Busca sinônimo exato
        if (SINONIMOS[normalized]) {
            return SINONIMOS[normalized];
        }

        // Fuzzy match com tipos válidos (threshold reduzido para 0.6)
        const match = findBestMatch(tipo, TIPOS_VALIDOS);
        if (match.score > 0.6) {
            return match.value;
        }

        // Se não encontrou, mantém original com capitalize
        return capitalize(tipo);
    });
}

// ============================================================================
// COORDENADAS - ADVANCED
// ============================================================================

export function normalizeCoordinate(input: string | number): number {
    if (typeof input === 'number') {
        return input;
    }

    // Converte para string e remove espaços
    let str = String(input).trim();

    // Se for vazio ou apenas hífen/traço, é inválido
    if (!str || str === '-' || str === '–' || str === '—') {
        throw new Error('Coordenada inválida');
    }

    // Remove aspas
    str = str.replace(/["']/g, '');

    // CRÍTICO: Remove pontos de milhar ANTES de converter vírgula
    // Detecta se tem ponto seguido de 3 dígitos (milhar) vs ponto decimal
    // Ex: -46.655.881 → -46655881 (milhar)
    // Ex: -46.655881 → -46.655881 (decimal)
    if (str.match(/\.\d{3}($|\.)/)) {
        // Tem ponto de milhar, remove TODOS os pontos
        str = str.replace(/\./g, '');
    }

    // Agora vírgula → ponto (para decimal)
    str = str.replace(/,/g, '.');

    const num = parseFloat(str);

    if (isNaN(num)) {
        throw new Error('Coordenada inválida');
    }

    // Valida range
    if (num < -180 || num > 180) {
        throw new Error('Coordenada fora do range válido');
    }

    return num;
}

// ============================================================================
// FLUXO - ADVANCED
// ============================================================================

export function normalizeFluxo(input: string | number): number {
    if (typeof input === 'number') {
        // Ensure integer only (round down if has decimals)
        return Math.floor(input);
    }

    let str = String(input).trim();

    // Remove TODOS pontos e vírgulas (milhar e decimais)
    str = str.replace(/[.,]/g, '');

    const num = parseInt(str, 10);

    if (isNaN(num) || num < 0) {
        throw new Error('Fluxo inválido');
    }

    return num;
}

// ============================================================================
// VALORES MONETÁRIOS - ADVANCED
// ============================================================================

export function normalizeValor(input: string | number): number {
    if (typeof input === 'number') {
        // Ensure exactly 2 decimal places
        return parseFloat(input.toFixed(2));
    }

    let str = String(input).trim();

    // Remove R$, espaços, etc
    str = str.replace(/[R$\s]/g, '');

    // Se tem vírgula e ponto, assume formato BR (5.000,00)
    if (str.includes('.') && str.includes(',')) {
        str = str.replace(/\./g, '').replace(',', '.');
    }
    // Se só tem vírgula, assume decimal BR (5000,00 ou 18000,00)
    else if (str.includes(',')) {
        str = str.replace(',', '.');
    }
    // Se só tem ponto, verifica se é milhar ou decimal
    else if (str.includes('.')) {
        // Se tem ponto seguido de 3 dígitos no final, é milhar
        if (str.match(/\.\d{3}$/)) {
            str = str.replace(/\./g, '');
        }
        // Senão, é decimal (mantém)
    }

    const num = parseFloat(str);

    if (isNaN(num) || num < 0) {
        throw new Error('Valor inválido');
    }

    // Return with exactly 2 decimal places
    return parseFloat(num.toFixed(2));
}

// ============================================================================
// PERÍODO (Locação) - ADVANCED
// ============================================================================

export function normalizePeriodo(input: string): 'Bissemanal' | 'Mensal' | null {
    if (!input || typeof input !== 'string') {
        return null;
    }

    const normalized = input.toLowerCase().trim();

    // Bissemanal variations (EXPANDIDO)
    if (
        normalized.includes('bi') ||
        normalized.includes('quinzen') ||
        normalized.includes('seman') ||
        normalized.includes('15 dia') ||
        normalized.includes('15dia')
    ) {
        return 'Bissemanal';
    }

    // Mensal variations (EXPANDIDO)
    if (
        normalized.includes('mes') ||
        normalized.includes('mês') ||
        normalized.includes('month') ||
        normalized.includes('1 mes') ||
        normalized.includes('30 dia')
    ) {
        return 'Mensal';
    }

    return null;
}

// ============================================================================
// CÓDIGO OOH - ADVANCED
// ============================================================================

export function normalizeCodigo(input: string): string {
    if (!input || typeof input !== 'string') {
        throw new Error('Código obrigatório');
    }

    // USER-DEFINED: Return as-is, only trim whitespace
    // No auto-prefixing, no uppercase conversion
    return input.trim();
}

// ============================================================================
// CIDADE - ADVANCED
// ============================================================================

const CIDADE_ALIASES: Record<string, string> = {
    'sp': 'São Paulo',
    'sampa': 'São Paulo',
    'sao paulo': 'São Paulo',
    'são paulo': 'São Paulo',
};

export function normalizeCidade(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    let clean = input.trim().toLowerCase();

    // Remove estado se vier junto (ex: "sao paulo - sp")
    clean = clean.split('-')[0].trim();

    // Busca alias
    if (CIDADE_ALIASES[clean]) {
        return CIDADE_ALIASES[clean];
    }

    // Capitaliza primeira letra de cada palavra
    return clean
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// ============================================================================
// UF/ESTADO - ADVANCED
// ============================================================================

const UF_ALIASES: Record<string, string> = {
    'sao paulo': 'SP',
    'são paulo': 'SP',
    'sp': 'SP',
    'rio de janeiro': 'RJ',
    'rj': 'RJ',
    'minas gerais': 'MG',
    'mg': 'MG',
};

export function normalizeUF(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    const clean = input.trim().toLowerCase();

    // Busca alias
    if (UF_ALIASES[clean]) {
        return UF_ALIASES[clean];
    }

    // Se já é sigla (2 letras), retorna uppercase
    if (clean.length === 2) {
        return clean.toUpperCase();
    }

    return clean.toUpperCase();
}

// ============================================================================
// ENDEREÇO - ADVANCED
// ============================================================================

export function normalizeEndereco(input: string): string {
    if (!input || typeof input !== 'string') {
        return '';
    }

    // USER-DEFINED: Return as-is, only trim whitespace
    // No capitalization changes
    return input.trim();
}

// ============================================================================
// NORMALIZAÇÃO COMPLETA DE PONTO
// ============================================================================

export interface NormalizationResult {
    success: boolean;
    value: any;
    warning?: string;
    error?: string;
    suggestion?: string; // Suggested correction for user
}

export function normalizeField(
    fieldName: string,
    value: any
): NormalizationResult {
    try {
        switch (fieldName) {
            case 'codigo_ooh':
                if (!value) return { success: false, error: 'Código obrigatório', value: null };
                const codigo = normalizeCodigo(value);
                return {
                    success: true,
                    value: codigo,
                    warning: String(value).trim() !== codigo ? 'Código formatado' : undefined
                };

            case 'endereco':
                if (!value) return { success: false, error: 'Endereço obrigatório', value: null };
                const endereco = normalizeEndereco(value);
                return {
                    success: true,
                    value: endereco,
                    warning: String(value).trim() !== endereco ? 'Endereço formatado' : undefined
                };

            case 'cidade':
                if (!value) return { success: true, value: null };
                const cidade = normalizeCidade(value);
                return {
                    success: true,
                    value: cidade,
                    warning: String(value).trim() !== cidade ? 'Cidade normalizada' : undefined
                };

            case 'uf':
                if (!value) return { success: true, value: null };
                const uf = normalizeUF(value);
                return {
                    success: true,
                    value: uf,
                    warning: String(value).trim() !== uf ? 'UF normalizada' : undefined
                };

            case 'medidas':
                if (!value) return { success: true, value: null };
                const medidas = normalizeMedidas(value);
                const medidasStr = formatMedidas(medidas);
                return {
                    success: true,
                    value: medidasStr,
                    warning: String(value) !== medidasStr ? 'Medida normalizada' : undefined
                };

            case 'tipos':
                if (!value) return { success: true, value: null };
                const tipos = normalizeTipos(value);
                const tiposStr = tipos.join(', ');
                return {
                    success: true,
                    value: tiposStr,
                    warning: String(value) !== tiposStr ? 'Tipos normalizados' : undefined
                };

            case 'latitude':
            case 'longitude':
                if (!value) return { success: false, error: 'Coordenada obrigatória', value: null };
                const coord = normalizeCoordinate(value);
                return {
                    success: true,
                    value: coord,
                    warning: String(value).trim() !== String(coord) ? 'Coordenada normalizada' : undefined
                };

            case 'fluxo':
                if (!value) return { success: true, value: null };
                const fluxo = normalizeFluxo(value);
                return {
                    success: true,
                    value: fluxo,
                    warning: String(value).trim() !== String(fluxo) ? 'Fluxo normalizado' : undefined
                };

            case 'valor_locacao':
            case 'valor_papel':
            case 'valor_lona':
                if (!value) return { success: true, value: null };
                const valor = normalizeValor(value);
                return {
                    success: true,
                    value: valor,
                    warning: String(value).trim() !== String(valor) ? 'Valor normalizado' : undefined
                };

            case 'periodo_locacao':
                if (!value) return { success: true, value: null };
                const periodo = normalizePeriodo(value);
                return {
                    success: true,
                    value: periodo,
                    warning: periodo && String(value) !== periodo ? 'Período normalizado' : !periodo ? 'Período não reconhecido' : undefined
                };

            default:
                // Campos de texto simples
                const trimmed = value ? String(value).trim() : null;
                return {
                    success: true,
                    value: trimmed,
                    warning: value && String(value) !== trimmed ? 'Espaços removidos' : undefined
                };
        }
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            value: value
        };
    }
}

// ============================================================================
// NORMALIZATION WITH DIFF TRACKING
// ============================================================================

export interface NormalizationDiffResult extends NormalizationResult {
    original: any;
    hasChange: boolean;
    fieldType: string;
}

/**
 * Normalizes a field and returns diff information for visual display
 */
export function normalizeFieldWithDiff(
    fieldName: string,
    value: any
): NormalizationDiffResult {
    const result = normalizeField(fieldName, value);
    const original = value;
    const normalized = result.value;

    // Determine if there's a meaningful change
    const hasChange = original != null && normalized != null && String(original).trim() !== String(normalized);

    return {
        ...result,
        original,
        hasChange,
        fieldType: fieldName
    };
}

// ============================================================================
// INTELLIGENT COLUMN MAPPING - CONTENT ANALYSIS
// ============================================================================

export interface ColumnAnalysisResult {
    fieldType: string;
    confidence: number; // 0-1
    reason: string;
}

/**
 * Analyzes column content to detect field type
 * Examines first 5-10 non-empty values to identify patterns
 */
export function analyzeColumnContent(values: any[]): ColumnAnalysisResult {
    // Get first 10 non-empty values for analysis
    const sampleValues = values
        .filter(v => v != null && String(v).trim() !== '')
        .slice(0, 10);

    if (sampleValues.length === 0) {
        return { fieldType: 'ignore', confidence: 0, reason: 'Coluna vazia' };
    }

    // Pattern detection scores
    const scores: Record<string, { score: number; reason: string }> = {};

    // Check for coordinates (latitude/longitude)
    const coordPattern = /^-?\d+[.,\-]\d+$/;
    const coordCount = sampleValues.filter(v => coordPattern.test(String(v).trim())).length;
    if (coordCount > 0) {
        const avgValue = sampleValues
            .map(v => {
                const str = String(v).replace(/,/g, '.').replace(/-/g, '.');
                return parseFloat(str);
            })
            .filter(n => !isNaN(n))
            .reduce((sum, n) => sum + n, 0) / sampleValues.length;

        // Latitude range: -90 to 0 (Brazil is negative)
        if (avgValue >= -90 && avgValue <= 0) {
            scores['latitude'] = {
                score: coordCount / sampleValues.length,
                reason: 'Padrão de coordenada (latitude)'
            };
        }
        // Longitude range: -75 to -30 (Brazil)
        if (avgValue >= -75 && avgValue <= -30) {
            scores['longitude'] = {
                score: coordCount / sampleValues.length,
                reason: 'Padrão de coordenada (longitude)'
            };
        }
    }

    // Check for addresses (must have street indicators AND numbers)
    const addressKeywords = ['rua', 'r ', 'av.', 'av ', 'avenida', 'alameda', 'al.', 'travessa', 'tv.', 'estrada', 'rod.', 'rodovia'];
    const addressCount = sampleValues.filter(v => {
        const lower = String(v).toLowerCase();
        const hasKeyword = addressKeywords.some(kw => lower.includes(kw));
        const hasNumber = /\d+/.test(lower);
        // Must have BOTH keyword and number to be considered address
        return hasKeyword && hasNumber;
    }).length;
    if (addressCount > 0) {
        scores['endereco'] = {
            score: addressCount / sampleValues.length,
            reason: 'Contém indicadores de endereço'
        };
    }

    // Check for monetary values
    const moneyPattern = /^R?\$?\s*\d+[.,]?\d*$/;
    const moneyCount = sampleValues.filter(v => moneyPattern.test(String(v).trim())).length;
    if (moneyCount > 0) {
        scores['valor_locacao'] = {
            score: moneyCount / sampleValues.length * 0.8, // Lower confidence, could be other valor
            reason: 'Padrão de valor monetário'
        };
    }

    // Check for measurements (NxN format)
    const medidaPattern = /\d+\s*[xX×]\s*\d+/;
    const medidaCount = sampleValues.filter(v => medidaPattern.test(String(v))).length;
    if (medidaCount > 0) {
        scores['medidas'] = {
            score: medidaCount / sampleValues.length,
            reason: 'Padrão de medidas (NxN)'
        };
    }

    // Check for flow (large integers)
    const fluxoPattern = /^\d{3,}$/;
    const fluxoCount = sampleValues.filter(v => fluxoPattern.test(String(v).replace(/[.,]/g, ''))).length;
    if (fluxoCount > 0) {
        scores['fluxo'] = {
            score: fluxoCount / sampleValues.length * 0.7,
            reason: 'Números grandes (possível fluxo)'
        };
    }

    // Check for period (bissemanal/mensal)
    const periodoKeywords = ['bi', 'semanal', 'mensal', 'quinzen', 'mes', 'mês'];
    const periodoCount = sampleValues.filter(v => {
        const lower = String(v).toLowerCase();
        return periodoKeywords.some(kw => lower.includes(kw));
    }).length;
    if (periodoCount > 0) {
        scores['periodo_locacao'] = {
            score: periodoCount / sampleValues.length,
            reason: 'Contém termos de período'
        };
    }

    // Check for tipos (media types)
    const tiposKeywords = ['outdoor', 'front', 'back', 'led', 'digital', 'painel', 'totem', 'busdoor'];
    const tiposCount = sampleValues.filter(v => {
        const lower = String(v).toLowerCase();
        return tiposKeywords.some(kw => lower.includes(kw));
    }).length;
    if (tiposCount > 0) {
        scores['tipos'] = {
            score: tiposCount / sampleValues.length,
            reason: 'Contém tipos de mídia OOH'
        };
    }

    // Check for UF (2-letter state codes)
    const ufPattern = /^[A-Z]{2}$/;
    const ufCount = sampleValues.filter(v => ufPattern.test(String(v).trim().toUpperCase())).length;
    if (ufCount > 0) {
        scores['uf'] = {
            score: ufCount / sampleValues.length,
            reason: 'Padrão de UF (2 letras)'
        };
    }

    // Find best match
    let bestField = 'ignore';
    let bestScore = 0;
    let bestReason = 'Não identificado';

    for (const [field, { score, reason }] of Object.entries(scores)) {
        if (score > bestScore) {
            bestScore = score;
            bestField = field;
            bestReason = reason;
        }
    }

    // Require minimum confidence of 0.5
    if (bestScore < 0.5) {
        return { fieldType: 'ignore', confidence: bestScore, reason: 'Confiança baixa' };
    }

    return { fieldType: bestField, confidence: bestScore, reason: bestReason };
}

export interface ColumnMappingValidation {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    duplicates: Record<string, number[]>; // fieldType -> column indices
}

/**
 * Validates column mapping to ensure required fields are present and no duplicates
 */
export function validateColumnMapping(mapping: Record<string, string>): ColumnMappingValidation {
    const errors: string[] = [];
    const warnings: string[] = [];
    const duplicates: Record<string, number[]> = {};

    // Required fields
    const requiredFields = ['codigo_ooh', 'endereco', 'latitude', 'longitude'];
    const mappedFields = Object.values(mapping).filter(v => v !== 'ignore');

    // Check for missing required fields
    for (const field of requiredFields) {
        if (!mappedFields.includes(field)) {
            errors.push(`Campo obrigatório não mapeado: ${field}`);
        }
    }

    // Check for duplicates
    const fieldCounts: Record<string, number[]> = {};
    for (const [colIdx, fieldType] of Object.entries(mapping)) {
        if (fieldType === 'ignore') continue;

        if (!fieldCounts[fieldType]) {
            fieldCounts[fieldType] = [];
        }
        fieldCounts[fieldType].push(parseInt(colIdx));
    }

    for (const [fieldType, colIndices] of Object.entries(fieldCounts)) {
        if (colIndices.length > 1) {
            duplicates[fieldType] = colIndices;
            errors.push(`Campo "${fieldType}" mapeado em múltiplas colunas`);
        }
    }

    // Warnings for recommended fields
    const recommendedFields = ['cidade', 'uf', 'medidas', 'tipos'];
    for (const field of recommendedFields) {
        if (!mappedFields.includes(field)) {
            warnings.push(`Campo recomendado não mapeado: ${field}`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        duplicates
    };
}
