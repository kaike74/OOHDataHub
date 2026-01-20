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

    // Detecta unidade (padrão: M) - MELHORADO para detectar P, pixel, px, pixels (case insensitive)
    const unidadePattern = /\b(p|px|pixel|pixels?)\b/i;
    const unidade = unidadePattern.test(input) ? 'PX' : 'M';

    // Remove unidade e texto extra (metros, pixels, etc)
    clean = clean.replace(/\s*(M|PX|METROS?|PIXELS?|METRO|PIXEL|P)\s*/gi, '');

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

// ... (omitted)

            case 'medidas':
if (!value) return { success: true, value: null };
const medidas = normalizeMedidas(value);
const medidasStr = formatMedidas(medidas);
return {
    success: true,
    value: medidasStr,
    warning: String(value) !== medidasStr ? `Normalizado para: ${medidasStr}` : undefined
};

// ... (omitted)

            case 'valor_locacao':
            case 'valor_papel':
            case 'valor_lona':
if (!value) return { success: true, value: null };
const valor = normalizeValor(value);
const valorFormatado = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
return {
    success: true,
    value: valor,
    warning: String(value).trim() !== String(valor) ? `Formatado para: ${valorFormatado}` : undefined
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
