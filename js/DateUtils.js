/**
 * DateUtils.js
 * Utility functions for date and week calculations
 */

/**
 * getISOWeekNumber()
 * Calculates the ISO week number for a given date.
 * ISO weeks start on Monday and the first week of the year
 * is the week that contains the first Thursday.
 * @param {Date} date - The date to calculate the week number for
 * @returns {Object} - Object with weekNumber (1-53) and year (the ISO year, which may differ from calendar year)
 */
function getISOWeekNumber(date) {
  // Work in UTC to avoid timezone/DST discrepancies
  let d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  
  // Thursday is always in the ISO week year
  let day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  
  // ISO year is the year of the adjusted date
  let isoYear = d.getUTCFullYear();
  
  // Calculate week number: weeks since first Thursday of ISO year
  let yearStart = new Date(Date.UTC(isoYear, 0, 1));
  let weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  
  return {
    weekNumber: weekNo,
    year: isoYear
  };
}

/**
 * calculateAgeAndWeeks()
 * Calculates user's age and total weeks lived
 * @param {Date} birthDate - The user's birth date
 * @returns {Object} - Object with age and weeksLived
 */
function calculateAgeAndWeeks(birthDate) {
  if (!birthDate) {
    return { age: 0, weeksLived: 0 };
  }
  
  let now = new Date();
  let diffTime = now.getTime() - birthDate.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  // Calculate age in years
  let age = Math.floor(diffDays / 365.25);
  
  // Calculate total weeks lived
  let weeksLived = Math.floor(diffDays / 7);
  
  return { age, weeksLived };
}

/**
 * getWeeksSinceBirth()
 * Calculates how many weeks have passed since birth for a given week
 * @param {number} weekIndex - The week index (0-51)
 * @param {number} year - The year for this week
 * @param {Date} birthDate - The user's birth date
 * @returns {number} - Weeks since birth
 */
function getWeeksSinceBirth(weekIndex, year, birthDate) {
  if (!birthDate) return weekIndex + 1;
  
  let weekStartDate = getDateFromWeekIndex(weekIndex, year);
  
  let diffTime = weekStartDate.getTime() - birthDate.getTime();
  let diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  let weeksSinceBirth = Math.floor(diffDays / 7);
  
  // Prevent negative values for future weeks
  return Math.max(0, weeksSinceBirth);
}

/**
 * getDateFromWeekIndex()
 * Gets the date (Thursday) for a given week index in a given year
 * Handles year boundaries correctly - week 0 might be in December of previous year
 * @param {number} weekIndex - The week index (0-51)
 * @param {number} year - The year
 * @returns {Date} - The Thursday date of that week
 */
function getDateFromWeekIndex(weekIndex, year) {
  // Work entirely in UTC to avoid timezone offsets/DST issues
  let jan1 = new Date(Date.UTC(year, 0, 1));
  
  // Find the first Thursday of the ISO year
  let firstThursday = new Date(jan1);
  let dayOfWeek = firstThursday.getUTCDay();
  let daysToThursday = (4 - dayOfWeek + 7) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() + daysToThursday);
  
  // Calculate the Thursday for the requested week (weekIndex 0 = week 1)
  let weekDate = new Date(firstThursday);
  weekDate.setUTCDate(firstThursday.getUTCDate() + (weekIndex * 7));
  
  return weekDate;
}

/**
 * formatDateForInput()
 * Formats a Date object as YYYY-MM-DD in local timezone (not UTC)
 * This prevents timezone shifts when setting min/max on date inputs
 * @param {Date} date - The date to format
 * @returns {string} - Date string in YYYY-MM-DD format
 */
function formatDateForInput(date) {
  let year = date.getFullYear();
  let month = String(date.getMonth() + 1).padStart(2, '0');
  let day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * getWeekDateRange()
 * Gets the start (Monday) and end (Sunday) dates for a given week index
 * ISO 8601 weeks start on Monday (day 1) and end on Sunday (day 0)
 * @param {number} weekIndex - The week index (0-51)
 * @param {number} year - The year
 * @returns {Object} - Object with startDate (Monday) and endDate (Sunday) as Date objects
 */
function getWeekDateRange(weekIndex, year) {
  // Get the Thursday of the week (ISO week reference point)
  let weekThursday = getDateFromWeekIndex(weekIndex, year);
  
  // Monday is always exactly 3 days before Thursday
  let monday = new Date(weekThursday);
  monday.setDate(weekThursday.getDate() - 3);
  monday.setUTCHours(0, 0, 0, 0);
  
  // Sunday is always exactly 6 days after Monday (or 3 days after Thursday)
  let sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);
  
  return {
    startDate: monday,
    endDate: sunday
  };
}

/**
 * getYearAndWeekIndexFromWeeksSinceBirth()
 * Converts weeks since birth to the corresponding year and week index (0-51)
 * This is the inverse of getWeeksSinceBirth - given a week number in someone's life,
 * find which calendar year and week index (0-51) it falls in
 * @param {number} weeksSinceBirth - The number of weeks since birth (0, 1, 2, ...)
 * @param {Date} birthDate - The user's birth date
 * @returns {Object} - Object with year and weekIndex (0-51), or null if invalid
 */
function getYearAndWeekIndexFromWeeksSinceBirth(weeksSinceBirth, birthDate) {
  if (!birthDate || weeksSinceBirth < 0) {
    return null;
  }
  
  // Anchor to the Monday of the birth week (same anchor used in getWeeksSinceBirth)
  let birthWeekInfo = getISOWeekNumber(birthDate);
  let birthWeekRange = getWeekDateRange(birthWeekInfo.weekNumber - 1, birthWeekInfo.year);
  let birthWeekStart = new Date(birthWeekRange.startDate);
  birthWeekStart.setUTCHours(0, 0, 0, 0);
  
  // Move forward by weeksSinceBirth weeks from that Monday anchor
  let targetDate = new Date(birthWeekStart.getTime() + weeksSinceBirth * 7 * 24 * 60 * 60 * 1000);
  
  // Derive ISO week/year for the resulting date
  let isoWeekInfo = getISOWeekNumber(targetDate);
  let weekIndex = isoWeekInfo.weekNumber - 1; // Convert to 0-based index
  let isoYear = isoWeekInfo.year;
  
  return {
    year: isoYear,
    weekIndex: weekIndex
  };
}

/**
 * normalizeDateToStartOfDay()
 * Normalizes a date to the start of the day (00:00:00)
 * @param {Date} date - The date to normalize
 * @returns {Date} - New date object normalized to start of day
 */
function normalizeDateToStartOfDay(date) {
  let normalized = new Date(date);
  normalized.setUTCHours(0, 0, 0, 0);
  return normalized;
}