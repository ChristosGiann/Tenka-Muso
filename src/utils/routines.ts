import type { Task, WeekdayNumber } from "../types";

function getWeekdayNumber(date: string): WeekdayNumber {
  const jsDay = new Date(`${date}T00:00:00`).getDay();

  if (jsDay === 0) {
    return 7;
  }

  return jsDay as WeekdayNumber;
}

function getDatesForMonth(month: string) {
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  if (!year || !monthNumber) {
    return [];
  }

  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${month}-${day}`;
  });
}

export function routineOccursOnDate(task: Task, date: string) {
  if (task.type !== "routine") return false;
  if (!task.recurrence) return false;
  if (date < task.date) return false;
  if (task.routineSkips?.[date]) return false;

  const weekday = getWeekdayNumber(date);

  return task.recurrence.weekdays.includes(weekday);
}

export function createRoutineOccurrence(task: Task, date: string): Task {
  return {
    ...task,
    date,
    status: task.routineCompletions?.[date] ?? "pending",
    isRoutineOccurrence: true,
    routineStartDate: task.routineStartDate ?? task.date,
  };
}

export function getTasksForDate(tasks: Task[], date: string) {
  return tasks.flatMap((task) => {
    if (task.type === "backlog") {
      return [];
    }

    if (task.type === "routine") {
      return routineOccursOnDate(task, date)
        ? [createRoutineOccurrence(task, date)]
        : [];
    }

    return task.date === date ? [task] : [];
  });
}

export function getTasksForDates(tasks: Task[], dates: string[]) {
  return dates.flatMap((date) => getTasksForDate(tasks, date));
}

export function getTasksForMonth(tasks: Task[], month: string) {
  return getTasksForDates(tasks, getDatesForMonth(month));
}