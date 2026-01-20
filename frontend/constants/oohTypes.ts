/**
 * Shared constants for OOH (Out-of-Home) media types and related enums
 * Used across CreatePointModal and bulk import components
 */

export const TIPOS_OOH = [
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

export type TipoOOH = typeof TIPOS_OOH[number];

export const PERIODO_LOCACAO = ['Bissemanal', 'Mensal'] as const;

export type PeriodoLocacao = typeof PERIODO_LOCACAO[number];

export const MEDIDA_UNIDADES = ['M', 'PX'] as const;

export type MedidaUnidade = typeof MEDIDA_UNIDADES[number];
