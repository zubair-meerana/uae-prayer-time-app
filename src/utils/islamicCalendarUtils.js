/**
 * Islamic/Hijri Calendar Utilities
 * Provides conversion between Gregorian and Hijri dates
 */

// Average length of a lunar month in days
const LUNAR_MONTH_DAYS = 29.53059;

// Reference date: Gregorian January 1, 1 AD = Hijri July 19, 1 AH
const HIJRI_REFERENCE_YEAR = 1;
const HIJRI_REFERENCE_MONTH = 7; // Muharram = 1, Safar = 2, ..., Dhul-Hijjah = 12
const HIJRI_REFERENCE_DAY = 1;
const GREGORIAN_REFERENCE_DATE = new Date(622, 6, 19); // July 19, 622 AD (first day of Islam)

// Month names in Arabic
const HIJRI_MONTH_NAMES_AR = [
  'محرم', 'صفر', 'ربيع أول', 'ربيع ثاني', 'جمادى أول', 'جمادى ثاني',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
];

// Month names in English
const HIJRI_MONTH_NAMES_EN = [
  'Muharram', 'Safar', 'Rabi\' al-Awwal', 'Rabi\' al-Thani', 'Jumada al-Ula', 'Jumada al-Akhirah',
  'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qa\'dah', 'Dhu al-Hijjah'
];

/**
 * Converts a Gregorian date to Hijri date
 * @param {Date} gregorianDate - The Gregorian date to convert
 * @returns {Object} - The Hijri date as { year, month, day, monthName }
 */
export const gregorianToHijri = (gregorianDate) => {
  // Calculate the difference in days from the reference date
  const gregorianTime = gregorianDate.getTime();
  const referenceTime = GREGORIAN_REFERENCE_DATE.getTime();
  const diffDays = Math.floor((gregorianTime - referenceTime) / (1000 * 60 * 60 * 24));

  // Estimate the Hijri year and month based on lunar cycles
  const totalMonths = Math.floor(diffDays / LUNAR_MONTH_DAYS);
  const hijriYear = HIJRI_REFERENCE_YEAR + Math.floor(totalMonths / 12);
  const hijriMonth = (HIJRI_REFERENCE_MONTH - 1 + (totalMonths % 12)) % 12 + 1;
  const estimatedHijriDay = Math.floor(diffDays % LUNAR_MONTH_DAYS) + HIJRI_REFERENCE_DAY;

  // Fine-tune the calculation for accuracy
  const hijriDate = {
    year: hijriYear,
    month: hijriMonth,
    day: Math.max(1, Math.min(30, estimatedHijriDay)), // Clamp between 1-30
    monthName: HIJRI_MONTH_NAMES_EN[hijriMonth - 1]
  };

  return hijriDate;
};

/**
 * Converts a Hijri date to Gregorian date
 * @param {number} hijriYear - The Hijri year
 * @param {number} hijriMonth - The Hijri month (1-12)
 * @param {number} hijriDay - The Hijri day
 * @returns {Date} - The corresponding Gregorian date
 */
export const hijriToGregorian = (hijriYear, hijriMonth, hijriDay) => {
  // Calculate the number of days from the reference date
  const yearsDiff = hijriYear - HIJRI_REFERENCE_YEAR;
  const monthsDiff = (hijriMonth - HIJRI_REFERENCE_MONTH) + (yearsDiff * 12);
  const totalDays = Math.floor(monthsDiff * LUNAR_MONTH_DAYS) + (hijriDay - HIJRI_REFERENCE_DAY);

  // Create the Gregorian date
  const gregorianDate = new Date(GREGORIAN_REFERENCE_DATE);
  gregorianDate.setDate(gregorianDate.getDate() + totalDays);

  return gregorianDate;
};

/**
 * Gets the current Hijri date
 * @returns {Object} - The current Hijri date as { year, month, day, monthName }
 */
export const getCurrentHijriDate = () => {
  return gregorianToHijri(new Date());
};

/**
 * Formats a Hijri date as a string
 * @param {Object} hijriDate - The Hijri date object
 * @param {string} locale - The locale ('en' or 'ar')
 * @returns {string} - The formatted date string
 */
export const formatHijriDate = (hijriDate, locale = 'en') => {
  if (!hijriDate || !hijriDate.year || !hijriDate.month || !hijriDate.day) {
    return '';
  }

  const monthNames = locale === 'ar' ? HIJRI_MONTH_NAMES_AR : HIJRI_MONTH_NAMES_EN;
  const monthName = monthNames[hijriDate.month - 1] || hijriDate.monthName;

  if (locale === 'ar') {
    return `${hijriDate.day} ${monthName} ${hijriDate.year} هـ`;
  } else {
    return `${hijriDate.day} ${monthName}, ${hijriDate.year} AH`;
  }
};

/**
 * Checks if a Hijri date is today
 * @param {Object} hijriDate - The Hijri date object
 * @returns {boolean} - Whether the date is today
 */
export const isHijriToday = (hijriDate) => {
  const todayHijri = getCurrentHijriDate();
  return (
    hijriDate.year === todayHijri.year &&
    hijriDate.month === todayHijri.month &&
    hijriDate.day === todayHijri.day
  );
};

/**
 * Gets the number of days in a Hijri month
 * @param {number} hijriYear - The Hijri year
 * @param {number} hijriMonth - The Hijri month (1-12)
 * @returns {number} - The number of days in the month (29 or 30)
 */
export const getHijriDaysInMonth = (hijriYear, hijriMonth) => {
  // For simplicity, we'll alternate between 29 and 30 days
  // In reality, this depends on moon sightings
  return (hijriMonth % 2 === 0) ? 29 : 30;
};

/**
 * Gets the next Hijri date
 * @param {Object} hijriDate - The current Hijri date
 * @returns {Object} - The next Hijri date
 */
export const getNextHijriDate = (hijriDate) => {
  const daysInMonth = getHijriDaysInMonth(hijriDate.year, hijriDate.month);

  if (hijriDate.day < daysInMonth) {
    return {
      ...hijriDate,
      day: hijriDate.day + 1
    };
  } else if (hijriDate.month < 12) {
    return {
      year: hijriDate.year,
      month: hijriDate.month + 1,
      day: 1,
      monthName: HIJRI_MONTH_NAMES_EN[hijriDate.month] // Next month name
    };
  } else {
    return {
      year: hijriDate.year + 1,
      month: 1,
      day: 1,
      monthName: HIJRI_MONTH_NAMES_EN[0] // Muharram
    };
  }
};

/**
 * Gets the previous Hijri date
 * @param {Object} hijriDate - The current Hijri date
 * @returns {Object} - The previous Hijri date
 */
export const getPreviousHijriDate = (hijriDate) => {
  if (hijriDate.day > 1) {
    return {
      ...hijriDate,
      day: hijriDate.day - 1
    };
  } else if (hijriDate.month > 1) {
    const prevMonth = hijriDate.month - 1;
    const daysInPrevMonth = getHijriDaysInMonth(hijriDate.year, prevMonth);
    return {
      year: hijriDate.year,
      month: prevMonth,
      day: daysInPrevMonth,
      monthName: HIJRI_MONTH_NAMES_EN[prevMonth - 1]
    };
  } else {
    const prevYear = hijriDate.year - 1;
    const daysInPrevMonth = getHijriDaysInMonth(prevYear, 12);
    return {
      year: prevYear,
      month: 12,
      day: daysInPrevMonth,
      monthName: HIJRI_MONTH_NAMES_EN[11] // Dhul-Hijjah
    };
  }
};
