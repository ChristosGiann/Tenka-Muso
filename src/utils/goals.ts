import type { Goal, Task } from "../types";
import { getMonthFromDate, getToday, getWeekDatesFromDate } from "./date";
import { getTasksForDates } from "./routines";
import { formatMinutes, getDurationMinutes } from "./time";

export type GoalProgressItem = {
  goal: Goal;
  actualValue: number;
  targetValue: number;
  percentage: number;
  remainingValue: number;
  formattedActual: string;
  formattedTarget: string;
  formattedRemaining: string;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
};

function getMonthDates(date: string) {
  const month = getMonthFromDate(date);
  const [yearText, monthText] = month.split("-");
  const year = Number(yearText);
  const monthNumber = Number(monthText);

  if (!year || !monthNumber) return [];

  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, index) => {
    const day = String(index + 1).padStart(2, "0");
    return `${month}-${day}`;
  });
}

function getGoalPeriodDates(goal: Goal, referenceDate: string) {
  if (goal.period === "weekly") {
    return getWeekDatesFromDate(referenceDate);
  }

  return getMonthDates(referenceDate);
}

function getGoalActualValue(goal: Goal, periodTasks: Task[]) {
  const categoryTasks = periodTasks.filter((task) => {
    return task.type !== "backlog" && task.category === goal.category;
  });

  if (goal.metric === "hours") {
    const doneMinutes = categoryTasks
      .filter((task) => task.status === "done")
      .reduce((sum, task) => {
        return sum + getDurationMinutes(task.startTime, task.endTime);
      }, 0);

    return doneMinutes / 60;
  }

  if (goal.metric === "completions") {
    return categoryTasks.filter((task) => task.status === "done").length;
  }

  return categoryTasks.length;
}

function formatGoalValue(value: number, goal: Goal) {
  if (goal.metric === "hours") {
    return formatMinutes(Math.round(value * 60));
  }

  if (goal.metric === "completions") {
    return `${value} completed`;
  }

  return `${value} items`;
}

function getPeriodLabel(goal: Goal) {
  return goal.period === "weekly" ? "This week" : "This month";
}

export function buildGoalProgress(
  goals: Goal[],
  tasks: Task[],
  referenceDate = getToday()
): GoalProgressItem[] {
  return goals.map((goal) => {
    const periodDates = getGoalPeriodDates(goal, referenceDate);
    const periodTasks = getTasksForDates(tasks, periodDates);
    const actualValue = getGoalActualValue(goal, periodTasks);
    const targetValue = goal.targetValue;

    const percentage =
      targetValue <= 0
        ? 0
        : Math.min(100, Math.round((actualValue / targetValue) * 100));

    const remainingValue = Math.max(0, targetValue - actualValue);

    return {
      goal,
      actualValue,
      targetValue,
      percentage,
      remainingValue,
      formattedActual: formatGoalValue(actualValue, goal),
      formattedTarget: formatGoalValue(targetValue, goal),
      formattedRemaining: formatGoalValue(remainingValue, goal),
      periodLabel: getPeriodLabel(goal),
      periodStart: periodDates[0] ?? referenceDate,
      periodEnd: periodDates[periodDates.length - 1] ?? referenceDate,
    };
  });
}