import { addDays, isWeekend, isSaturday, isSunday, format } from 'date-fns';

/**
 * Check if a date is a trading day (Monday to Friday, excluding weekends).
 * Note: Does not handle specific holidays without a holiday calendar.
 * @param {Date} date 
 * @returns {boolean}
 */
export const isTradingDay = (date) => {
  return !isWeekend(date);
};

/**
 * Get the next trading day starting from the given date (exclusive of the date itself if it's not a trading day? No, usually next valid).
 * If date is Saturday, returns Monday.
 * If date is Sunday, returns Monday.
 * If date is Friday, returns Friday (if valid).
 * But this function is usually "find next valid date starting from `startDate`".
 * @param {Date} startDate 
 * @returns {Date}
 */
export const getNextTradingDay = (startDate) => {
  let current = startDate;
  while (!isTradingDay(current)) {
    current = addDays(current, 1);
  }
  return current;
};

/**
 * Calculate the effective transaction date based on user input.
 * @param {Date} selectedDate User selected date
 * @param {boolean} isAfter3PM Whether the transaction is after 15:00
 * @returns {Date} The date when the transaction is effectively submitted to the fund company.
 */
export const getEffectiveTransactionDate = (selectedDate, isAfter3PM) => {
  let effectiveDate = new Date(selectedDate);
  
  // If it's not a trading day, move to next trading day first
  if (!isTradingDay(effectiveDate)) {
    effectiveDate = getNextTradingDay(effectiveDate);
    // If we moved to a new day (e.g. Sat -> Mon), the "after 3pm" logic resets because it's a new day's start?
    // Actually, if I operate on Sat, it counts as Monday operation. 
    // Is it Monday before 3PM? Yes, effectively.
    return effectiveDate;
  }

  // If it is a trading day but after 3PM, it counts as next trading day
  if (isAfter3PM) {
    effectiveDate = addDays(effectiveDate, 1);
    effectiveDate = getNextTradingDay(effectiveDate);
  }

  return effectiveDate;
};

/**
 * Calculate confirmation date (T+N).
 * @param {Date} effectiveDate 
 * @param {number} n Days to add (default 1 for T+1)
 * @returns {Date}
 */
export const getConfirmationDate = (effectiveDate, n = 1) => {
  let currentDate = effectiveDate;
  let daysAdded = 0;
  
  while (daysAdded < n) {
    currentDate = addDays(currentDate, 1);
    if (isTradingDay(currentDate)) {
      daysAdded++;
    }
  }
  
  return currentDate;
};

export const formatDate = (date) => format(date, 'yyyy-MM-dd');
