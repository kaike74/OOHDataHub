/**
 * Date formatting utilities for the OOHDataHub system
 */

const MONTHS_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Formats a date string to extended Portuguese format
 * @param date - ISO date string
 * @returns Formatted date like "15 de Janeiro de 2026"
 */
export function formatDateExtended(date: string): string {
    const d = new Date(date);
    const day = d.getDate();
    const month = MONTHS_PT[d.getMonth()];
    const year = d.getFullYear();
    return `${day} de ${month} de ${year}`;
}

/**
 * Formats a period (start and end dates) to extended Portuguese format
 * @param start - ISO date string for start
 * @param end - ISO date string for end
 * @returns Formatted period like "15 de Janeiro a 15 de Fevereiro de 2026"
 */
export function formatPeriodExtended(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const startDay = startDate.getDate();
    const startMonth = MONTHS_PT[startDate.getMonth()];
    const startYear = startDate.getFullYear();

    const endDay = endDate.getDate();
    const endMonth = MONTHS_PT[endDate.getMonth()];
    const endYear = endDate.getFullYear();

    // Same year
    if (startYear === endYear) {
        // Same month
        if (startMonth === endMonth) {
            return `${startDay} a ${endDay} de ${endMonth} de ${endYear}`;
        }
        // Different months, same year
        return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${endYear}`;
    }

    // Different years
    return `${startDay} de ${startMonth} de ${startYear} a ${endDay} de ${endMonth} de ${endYear}`;
}

/**
 * Calculates the duration between two dates and returns a human-readable string
 * @param start - ISO date string for start
 * @param end - ISO date string for end
 * @returns Duration like "1 mês", "2 bisemanas", "3 meses"
 */
export function calculateDuration(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    // Calculate months (approximate)
    const months = Math.round(diffDays / 30);

    // If close to a month boundary, show months
    if (months >= 1 && Math.abs(diffDays - (months * 30)) <= 5) {
        return months === 1 ? '1 mês' : `${months} meses`;
    }

    // Otherwise, show bisemanas (14-day periods)
    const bisemanas = Math.round(diffDays / 14);
    if (bisemanas >= 1) {
        return bisemanas === 1 ? '1 bisemana' : `${bisemanas} bisemanas`;
    }

    // For very short periods, show days
    return diffDays === 1 ? '1 dia' : `${diffDays} dias`;
}

/**
 * Formats a period with both extended format and duration
 * @param start - ISO date string for start
 * @param end - ISO date string for end
 * @returns Combined format like "15 de Janeiro a 15 de Fevereiro de 2026 (1 mês)"
 */
export function formatPeriodWithDuration(start: string, end: string): string {
    const period = formatPeriodExtended(start, end);
    const duration = calculateDuration(start, end);
    return `${period} (${duration})`;
}
