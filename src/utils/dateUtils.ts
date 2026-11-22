/**
 * Kisan Setu - Dynamic Date Engine (IST UTC+5:30)
 * Automatically captures the current day, time, and historical days.
 */

const HINDI_MONTHS = [
  'जनवरी',
  'फ़रवरी',
  'मार्च',
  'अप्रैल',
  'मई',
  'जून',
  'जुलाई',
  'अगस्त',
  'सितंबर',
  'अक्टूबर',
  'नवंबर',
  'दिसंबर',
];

const ENG_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const ENG_MONTHS_FULL = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Returns current Date adjusted to Indian Standard Time (UTC + 5:30)
 */
export function getIndianNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffset = 5.5 * 3600000;
  return new Date(utc + istOffset);
}

/**
 * Returns a Date object shifted by -days from today in IST
 */
export function getIndianDateOffset(daysAgo: number): Date {
  const d = getIndianNow();
  d.setDate(d.getDate() - daysAgo);
  return d;
}

/**
 * Format as DD-MM-YYYY
 */
export function formatDDMMYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

/**
 * Format as DD/MM/YYYY
 */
export function formatDDSlashMMSlashYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format in Hindi (e.g. "05 नवंबर 2026")
 */
export function formatHindiDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = HINDI_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

/**
 * Format short (e.g. "05 Nov")
 */
export function formatShortDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = ENG_MONTHS_SHORT[d.getMonth()];
  return `${day} ${month}`;
}

/**
 * Format in English (e.g. "November 05, 2026")
 */
export function formatEnglishDate(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0');
  const month = ENG_MONTHS_FULL[d.getMonth()];
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

/**
 * Check if current time in IST is after 5:30 PM (17:30)
 */
export function isCurrentTimeAfter530PM(): boolean {
  const ist = getIndianNow();
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  return hour > 17 || (hour === 17 && minute >= 30);
}

/**
 * Check if current time in IST is before 10:30 AM (10:30)
 */
export function isCurrentTimeBefore1030AM(): boolean {
  const ist = getIndianNow();
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  return hour < 10 || (hour === 10 && minute < 30);
}

export type MandiSessionStatus = 'weekend' | 'before_open' | 'open' | 'after_530';

export function getMandiAuctionSession(d: Date = getIndianNow()): MandiSessionStatus {
  const day = d.getDay();
  if (day === 0 || day === 6) return 'weekend';
  const hour = d.getHours();
  const minute = d.getMinutes();
  if (hour > 17 || (hour === 17 && minute >= 30)) return 'after_530';
  if (hour < 10 || (hour === 10 && minute < 30)) return 'before_open';
  return 'open';
}

/**
 * Returns formatted current time (e.g. "03:45 PM")
 */
export function getCurrentTimeString(): string {
  const ist = getIndianNow();
  let hours = ist.getHours();
  const minutes = String(ist.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

export type DateOptionKey =
  | 'today'
  | 'yesterday'
  | 'dayBefore'
  | 'daysAgo2'
  | 'daysAgo3'
  | 'daysAgo4'
  | 'daysAgo5'
  | 'daysAgo6'
  | 'daysAgo7';

export interface DateMeta {
  key: DateOptionKey;
  dateStr: string;
  dateSlash: string;
  displayLabel: string;
  shortLabel: string;
  shortDate: string;
  hindiDate: string;
  dayName: string;
  isWeekend: boolean;
  bulletinTime: string;
  isLive: boolean;
  daysOffset: number;
  sessionStatus: MandiSessionStatus;
}

/**
 * Builds dynamic metadata for all date options based on real current date & day of week
 */
export function getDynamicPatrakDates(): Record<string, DateMeta> {
  const currentSession = getMandiAuctionSession();

  const getDayNameHindi = (dayIndex: number): string => {
    const days = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    return days[dayIndex] || 'कार्य दिवस';
  };

  const createMeta = (key: DateOptionKey, daysOffset: number): DateMeta => {
    const d = getIndianDateOffset(daysOffset);
    const dateStr = formatDDMMYYYY(d);
    const dateSlash = formatDDSlashMMSlashYYYY(d);
    const hindiDate = formatHindiDate(d);
    const shortDate = formatShortDate(d);
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const dayName = getDayNameHindi(dayOfWeek);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let displayLabel = '';
    let bulletinTime = '';
    let isLive = false;
    let shortLabelFormatted = '';
    const sessionStatus: MandiSessionStatus =
      daysOffset === 0 ? currentSession : isWeekend ? 'weekend' : 'after_530';

    if (daysOffset === 0) {
      if (isWeekend) {
        isLive = false;
        displayLabel = `आज (${hindiDate}) • 🔴 मंडी बंद (${dayName} अवकाश)`;
        bulletinTime = `मंडी ${dayName} अवकाश (नीलामी कार्य स्थगित)`;
        shortLabelFormatted = `आज (${shortDate}) 🔴 बंद`;
      } else if (currentSession === 'open') {
        isLive = true;
        displayLabel = `आज (${hindiDate}) • 🟢 मंडी खुली (नीलामी जारी)`;
        bulletinTime = `आज ${dayName} • नीलामी जारी (सायं 5:30 बजे अंतिम भाव पत्रक जारी होगा)`;
        shortLabelFormatted = `आज (${shortDate}) 🟢 खुली`;
      } else if (currentSession === 'before_open') {
        isLive = false;
        displayLabel = `आज (${hindiDate}) • 🟡 प्रातः सत्र (10:30 AM खुलने का समय)`;
        bulletinTime = `आज ${dayName} • मंडी नीलामी प्रातः 10:30 से सायं 5:30 बजे तक`;
        shortLabelFormatted = `आज (${shortDate}) 🟡 10:30 AM`;
      } else {
        // After 5:30 PM IST: auction closed for the day
        isLive = false;
        displayLabel = `आज (${hindiDate}) • 🔴 मंडी बंद (5:30 PM नीलामी समाप्त)`;
        bulletinTime = `सायं 5:30 बजे आज (${dayName}) की नीलामी समाप्त • मंडी बंद`;
        shortLabelFormatted = `आज (${shortDate}) 🔴 5:30 PM बंद`;
      }
    } else if (daysOffset === 1) {
      if (isWeekend) {
        displayLabel = `कल (${hindiDate}) • 🔴 मंडी बंद थी (${dayName} अवकाश)`;
        bulletinTime = `मंडी ${dayName} अवकाश (नीलामी कार्य स्थगित रहा)`;
        shortLabelFormatted = `कल (${shortDate}) 🔴 बंद`;
      } else {
        displayLabel = `कल का भाव (${hindiDate}) • कार्य दिवस (${dayName})`;
        bulletinTime = `सायं 5:30 बजे (कल ${dayName} का अंतिम बंद भाव पत्रक)`;
        shortLabelFormatted = `कल (${shortDate}) कार्य दिवस`;
      }
    } else if (isWeekend) {
      displayLabel = `${daysOffset} दिन पहले (${hindiDate}) • 🔴 ${dayName} अवकाश`;
      bulletinTime = `मंडी ${dayName} अवकाश (${daysOffset} दिन पहले)`;
      shortLabelFormatted = `${shortDate} (${dayName})`;
    } else {
      displayLabel = `${daysOffset} दिन पहले (${hindiDate}) • ${dayName}`;
      bulletinTime = `सायं 5:30 बजे (${dayName} का अभिलेख)`;
      shortLabelFormatted = `${shortDate} (${dayName})`;
    }

    return {
      key,
      dateStr,
      dateSlash,
      displayLabel,
      shortLabel: shortLabelFormatted,
      shortDate,
      hindiDate,
      dayName,
      isWeekend,
      bulletinTime,
      isLive,
      daysOffset,
      sessionStatus,
    };
  };

  return {
    today: createMeta('today', 0),
    yesterday: createMeta('yesterday', 1),
    daysAgo2: createMeta('daysAgo2', 2),
    dayBefore: createMeta('dayBefore', 2),
    daysAgo3: createMeta('daysAgo3', 3),
    daysAgo4: createMeta('daysAgo4', 4),
    daysAgo5: createMeta('daysAgo5', 5),
    daysAgo6: createMeta('daysAgo6', 6),
    daysAgo7: createMeta('daysAgo7', 7),
  };
}
