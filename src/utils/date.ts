import type { CalendarDay } from "../types";

export const weekDays = ["Δευ", "Τρι", "Τετ", "Πεμ", "Παρ", "Σαβ", "Κυρ"];

export const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const getMonthFromDate = (date: string) => date.slice(0, 7);

export function formatDateForInput(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function parseInputDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function addDays(date: string, days: number) {
  const currentDate = parseInputDate(date);
  currentDate.setDate(currentDate.getDate() + days);

  return formatDateForInput(currentDate);
}

export function getWeekStartFromDate(date: string) {
  const currentDate = parseInputDate(date);
  const mondayBasedOffset = (currentDate.getDay() + 6) % 7;

  currentDate.setDate(currentDate.getDate() - mondayBasedOffset);

  return formatDateForInput(currentDate);
}

export function getWeekDatesFromDate(date: string) {
  const weekStart = getWeekStartFromDate(date);

  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function getCalendarDays(month: string): CalendarDay[] {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthIndex = monthNumber - 1;

  const firstDayOfMonth = new Date(year, monthIndex, 1);
  const mondayBasedStartOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const calendarStartDate = new Date(
    year,
    monthIndex,
    1 - mondayBasedStartOffset
  );

  return Array.from({ length: 42 }, (_, index) => {
    const currentDate = new Date(calendarStartDate);
    currentDate.setDate(calendarStartDate.getDate() + index);

    return {
      date: formatDateForInput(currentDate),
      dayNumber: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === monthIndex,
    };
  });
}