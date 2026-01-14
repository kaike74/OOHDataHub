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
    let date: Date;
    if (typeof dateStr === 'string') {
        const [year, month, day] = dateStr.split('-').map(Number);
        date = new Date(year, month - 1, day);
    } else {
        date = dateStr;
    }

    if (!isValidBiWeeklyStartDate(date)) return null;

    const baseTime = BI_WEEKLY_BASE_START.getTime();
    const dateTime = date.getTime();

    // Each bi-week is 14 days
    const daysDiff = Math.round((dateTime - baseTime) / (1000 * 60 * 60 * 24));
    const biWeekIndex = Math.floor(daysDiff / 14);

    // Calculate year and number
    // We know 2026 starts at index 0 (which is BI 02)
    // There are 26 bi-weeks per year

    // Reverse math from BiWeeklyPicker logic:
    // totalBiWeeksFromBase = (yearOffset * 26) + biWeekIndexInYear
    // But is leap year handled? BiWeeklyPicker says "maxBiWeeks = isLeapYear ? 27 : 26"
    // This makes simple division hard if variable length.
    // However, BiWeeklyPicker logic says: "A bissemana pertence ao ano onde termina".
    // Let's use the simpler logic:
    // Bi-week Start + 13 days = End Date.
    // Year = End Date Year.

    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 13);
    const year = endDate.getFullYear();

    // Determine number. 
    // Start of Year Bi-Week?
    // We need to find the first bi-week of that year.
    // But simplified: 
    // BI 02 is the first one. Numbers are even: 02, 04...
    // Let's find index within the year.

    // Find the first bi-week start of this year (or previous year if it spills over)
    // Actually, simple calculation:
    // If year is 2026. Base is 29/12/2025.
    // If date is base, it is BI 02-26.
    // If date is base + 14, it is BI 04-26.

    // We can rely on: (biWeekIndex % 26) + 1 * 2?
    // 2026 has 26 bi-weeks.
    // 2027...

    // Robust way:
    // Calculate BiWeekNumber based on "index + 1" * 2 if we reset every year?
    // But BiWeeklyPicker logic handles year boundaries specifically.
    // Let's stick to the visual format: "number of bi-week within the year".
    // 1st bi-week ending in 2026 is BI 02.
    // 2nd is BI 04.

    // So just count how many bi-weeks have passed since the "First valid bi-week ending in `year`".

    // For now, let's use a simpler heuristic or just return raw index if complex. 
    // Wait, the prompt defines: "BI 02-26 (29/12/25-11/01/26)".
    // So if end year is 2026, it is XX-26.

    // Let's rely on the fact that for standard years it is just sequential.

    // Let's implement a loop or something similar to generateBiWeeklyPeriods if needed, 
    // BUT running that on every render is heavy.
    // However, getBiWeekInfo(biWeekStart) is likely called few times (only for selected).

    // Optimized attempt:
    const endYear = endDate.getFullYear();
    const isLeap = (endYear % 4 === 0 && endYear % 100 !== 0) || (endYear % 400 === 0);

    // How many days into the year does the period END?
    // jan 1 is day 1.
    const startOfYear = new Date(endYear, 0, 1);
    const dayOfYearEnd = Math.floor((endDate.getTime() - startOfYear.getTime()) / (86400000)) + 1;

    // Each bi-week covers 14 days. 
    // The first bi-week ends on Jan 11 (approx). 
    // bi_week_number = ceil(day_of_year_end / 14) * 2?
    // Jan 11 is day 11. 11/14 < 1. ceil is 1. * 2 = 02. Correct.
    // Jan 25 is next end. Day 25. 25/14 = 1.78. ceil is 2. * 2 = 04. Correct.

    const number = Math.ceil(dayOfYearEnd / 14) * 2;

    return { number, year: endYear };
}
