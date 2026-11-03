import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// The working year for the whole app. Admins set it in System Settings
// (fiscal_current_year); until they do, the calendar year is used.

export const FISCAL_YEAR_KEY = 'fiscal_current_year';

export const calendarYear = () => new Date().getFullYear();

export function fiscalYearFrom(settings = []) {
  const setting = settings.find(s => s.Setting_Key === FISCAL_YEAR_KEY);
  const year = parseInt(setting?.Setting_Value, 10);
  return Number.isInteger(year) && year > 1900 ? year : calendarYear();
}

export function useFiscalYear() {
  const { data: settings = [] } = useQuery({
    queryKey: ['systemSettings'],
    queryFn: () => base44.entities.SystemSetting.list(),
  });
  return fiscalYearFrom(settings);
}

// Years to offer in a picker: a few either side of the working year.
export function yearOptions(year, back = 2, ahead = 2) {
  const years = [];
  for (let y = year - back; y <= year + ahead; y++) years.push(y);
  return years;
}

// The year of a date value. Reads "YYYY-…" strings directly so a date
// such as "2027-01-01" never shifts into 2026 because of the time zone.
export function yearOf(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const match = /^(\d{4})-/.exec(value);
    if (match) return parseInt(match[1], 10);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
}

// Default start and end dates for a new project in the given year:
// the first Monday of January (as 2026-01-05 was) to 31 December.
export function yearStart(year) {
  const day = new Date(Date.UTC(year, 0, 1)).getUTCDay(); // 0 = Sunday
  const offset = (8 - day) % 7; // days until Monday
  return `${year}-01-${String(1 + offset).padStart(2, '0')}`;
}
export const yearEnd = (year) => `${year}-12-31`;

// True if a project runs at any point in the given year ('All' matches all).
export function runsInYear(project, year) {
  if (year === 'All') return true;
  const start = yearOf(project.Project_Start_Date);
  const end = yearOf(project.Project_End_Date) ?? start;
  if (start === null) {
    const entered = yearOf(project.created_date);
    return entered === null || entered === year;
  }
  return start <= year && year <= end;
}
