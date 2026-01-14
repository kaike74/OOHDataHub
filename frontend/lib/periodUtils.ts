/**
 * Period validation utilities for outdoor rental periods
 * Handles bi-weekly (bissemanal) and monthly (mensal) period calculations
 */

// Base date for bi-weekly calendar: 29/12/2025 (first start date of 2026 bi-weeks)
const BI_WEEKLY_BASE_START = new Date('2025-12-29');

/**
 * Calculates all valid bi-weekly start dates from a reference date
 * Bi-weeks start every 14 days from the base date
 */
export function getValidBiWeeklyStartDates(fromDate: Date, count: number = 52): Date[] {
    const dates: Date[] = [];
    const baseTime = BI_WEEKLY_BASE_START.getTime();
    const fromTime = fromDate.getTime();

    // Find the first valid start date on or after fromDate
    let daysSinceBase = Math.floor((fromTime - baseTime) / (1000 * 60 * 60 * 24));
    let biWeeksSinceBase = Math.ceil(daysSinceBase / 14);

    // Generate valid dates
    for (let i = 0; i < count; i++) {
        const daysOffset = (biWeeksSinceBase + i) * 14;
        const date = new Date(baseTime + (daysOffset * 24 * 60 * 60 * 1000));
        dates.push(date);
    }

    return dates;
}

/**
 * Calculates all valid bi-weekly end dates from a reference date
 * Bi-weeks end 13 days after they start (14 days total including start day)
 */
export function getValidBiWeeklyEndDates(fromDate: Date, count: number = 52): Date[] {
    const startDates = getValidBiWeeklyStartDates(fromDate, count);
    return startDates.map(date => {
        const endDate = new Date(date);
        endDate.setDate(endDate.getDate() + 13); // 14 days total (inclusive)
        return endDate;
    });
}

/**
 * Checks if a date is a valid bi-weekly start date
 */
export function isValidBiWeeklyStartDate(date: Date | string): boolean {
    // Normalize the date to avoid timezone issues
    let checkDate: Date;
    if (typeof date === 'string') {
        // Parse YYYY-MM-DD format directly to avoid timezone issues
        const [year, month, day] = date.split('-').map(Number);
        checkDate = new Date(year, month - 1, day);
    } else {
        checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const baseDate = new Date(BI_WEEKLY_BASE_START.getFullYear(), BI_WEEKLY_BASE_START.getMonth(), BI_WEEKLY_BASE_START.getDate());

    const baseTime = baseDate.getTime();
    const dateTime = checkDate.getTime();

    const daysDiff = Math.round((dateTime - baseTime) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff % 14 === 0;
}

/**
 * Checks if a date is a valid bi-weekly end date
 */
export function isValidBiWeeklyEndDate(date: Date | string): boolean {
    // Normalize the date to avoid timezone issues
    let checkDate: Date;
    if (typeof date === 'string') {
        const [year, month, day] = date.split('-').map(Number);
        checkDate = new Date(year, month - 1, day);
    } else {
        checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    const baseDate = new Date(BI_WEEKLY_BASE_START.getFullYear(), BI_WEEKLY_BASE_START.getMonth(), BI_WEEKLY_BASE_START.getDate());

    const baseTime = baseDate.getTime();
    const dateTime = checkDate.getTime();

    const daysDiff = Math.round((dateTime - baseTime) / (1000 * 60 * 60 * 24));
    // End dates are 13 days after start dates
    return daysDiff >= 13 && (daysDiff - 13) % 14 === 0;
}

/**
 * Gets the suggested end date for a bi-weekly period starting on a given date
 */
export function getSuggestedBiWeeklyEndDate(startDate: Date): Date | null {
    if (!isValidBiWeeklyStartDate(startDate)) return null;

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13);
    return endDate;
}

/**
 * Gets the next valid bi-weekly start date on or after the given date
 */
export function getNextValidBiWeeklyStartDate(fromDate: Date): Date {
    const dates = getValidBiWeeklyStartDates(fromDate, 1);
    return dates[0];
}

/**
 * Gets all valid monthly end dates for a given start date
 * Monthly periods must end on the same day of the month as they started
 */
export function getValidMonthlyEndDates(startDate: Date, monthsAhead: number = 24): Date[] {
    const dates: Date[] = [];
    const startDay = startDate.getDate();

    for (let i = 1; i <= monthsAhead; i++) {
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + i);

        // Handle cases where the day doesn't exist in the target month
        // (e.g., Jan 31 -> Feb 31 doesn't exist, so it becomes Feb 28/29)
        if (endDate.getDate() !== startDay) {
            // Set to last day of previous month
            endDate.setDate(0);
        }

        dates.push(endDate);
    }

    return dates;
}

/**
 * Checks if an end date is valid for a monthly period with the given start date
 */
export function isValidMonthlyEndDate(startDate: Date, endDate: Date): boolean {
    if (endDate <= startDate) return false;

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    // Check if it's the same day of the month
    if (startDay === endDay) return true;

    // Handle edge case: if start day doesn't exist in end month (e.g., Jan 31 -> Feb)
    // Check if end date is the last day of its month
    const lastDayOfEndMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    return endDay === lastDayOfEndMonth && startDay > lastDayOfEndMonth;
}

/**
 * Gets the suggested end date for a monthly period (1 month ahead)
 */
export function getSuggestedMonthlyEndDate(startDate: Date): Date {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    // Handle day overflow (e.g., Jan 31 -> Feb 31 becomes Feb 28/29)
    if (endDate.getDate() !== startDate.getDate()) {
        endDate.setDate(0); // Set to last day of previous month
    }

    return endDate;
}

/**
 * Formats a date to YYYY-MM-DD for input fields
 */
export function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function getTomorrow(): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow;
}

export const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function getMonthName(monthIndex: number): string {
    return MONTH_NAMES_SHORT[monthIndex] || '';
}

export function getBiWeekInfo(dateStr: string | Date): { number: number, year: number } | null {
    // Normalize the input date
    let checkDate: Date;
    if (typeof dateStr === 'string') {
        const [year, month, day] = dateStr.split('-').map(Number);
        checkDate = new Date(year, month - 1, day);
    } else {
        checkDate = new Date(dateStr.getFullYear(), dateStr.getMonth(), dateStr.getDate());
    }

    // Calculate the base date (normalized to avoid timezone issues)
    const baseDate = new Date(BI_WEEKLY_BASE_START.getFullYear(), BI_WEEKLY_BASE_START.getMonth(), BI_WEEKLY_BASE_START.getDate());

    const baseTime = baseDate.getTime();
    const checkTime = checkDate.getTime();

    // Calculate days since base
    const daysSinceBase = Math.floor((checkTime - baseTime) / (1000 * 60 * 60 * 24));

    if (daysSinceBase < 0) return null;

    // Find which 14-day period this date falls into
    const biWeekIndex = Math.floor(daysSinceBase / 14);

    // Calculate the start and end of this bi-week period
    const periodStartDate = new Date(baseDate);
    periodStartDate.setDate(periodStartDate.getDate() + (biWeekIndex * 14));

    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setDate(periodEndDate.getDate() + 13);

    // The year is determined by the end date of the bi-week
    const endYear = periodEndDate.getFullYear();

    // Calculate the bi-week number based on day of year of the end date
    const startOfYear = new Date(endYear, 0, 1);
    const msDiff = periodEndDate.getTime() - startOfYear.getTime();
    const dayOfYearEnd = Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1;

    if (dayOfYearEnd < 1) return null;

    const biWeekNumber = Math.ceil(dayOfYearEnd / 14) * 2;

    return { number: biWeekNumber, year: endYear };
}

/**
 * Format a date for display in DD/MM/YY format
 */
export function formatDisplayDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

// ============================================
// Monthly Period Utilities
// ============================================

/**
 * Add months to a date, handling month-end edge cases
 * Special rule: If day is 01, end date is last day of target month
 * Otherwise: End date is one day before same day in target month
 * Example: 
 *   - 01/01 + 1 month = 31/01 (last day of January)
 *   - 02/01 + 1 month = 01/02 (one day before 02/02)
 *   - 31/01 + 1 month = 27/02 (one day before 28/02)
 */
export function addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    const originalDay = result.getDate();

    result.setMonth(result.getMonth() + months);

    // Special case: If original day was 01, we want to return the same day in next month (01)
    // The calling component (MonthlyPicker) handles the -1 day subtraction to get the end of previous month
    // Example: 01/02 -> 01/03. MonthlyPicker does 01/03 - 1 day = 28/02. Correct.
    if (originalDay === 1) {
        return result;
    }

    // Handle month-end edge case (e.g., Jan 31 + 1 month = Feb 28, not Mar 3)
    if (result.getDate() !== originalDay) {
        result.setDate(0); // Set to last day of previous month
    }

    return result;
}

/**
 * Calculate the difference in months between two dates
 */
export function getMonthsDifference(start: Date, end: Date): number {
    const yearDiff = end.getFullYear() - start.getFullYear();
    const monthDiff = end.getMonth() - start.getMonth();
    const dayDiff = end.getDate() - start.getDate();

    let totalMonths = yearDiff * 12 + monthDiff;

    // If end day is before start day, don't count the last month as complete
    if (dayDiff < 0) {
        totalMonths--;
    }

    return Math.max(0, totalMonths);
}

/**
 * Format a monthly period for display
 * Returns format like "17/01/26 → 17/02/26 (1 mês)"
 */
export function formatMonthlyPeriodDisplay(startDate: Date, endDate: Date): string {
    const start = formatDisplayDate(startDate);
    const end = formatDisplayDate(endDate);
    const months = getMonthsDifference(startDate, endDate) + 1; // +1 to include both start and end months

    const monthLabel = months === 1 ? 'mês' : 'meses';
    return `${start} → ${end} (${months} ${monthLabel})`;
}

/**
 * Generate a unique ID for a monthly period
 */
export function generateMonthlyPeriodId(startDate: Date, endDate: Date): string {
    return `${formatDateForInput(startDate)}_${formatDateForInput(endDate)}`;
}
