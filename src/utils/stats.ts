import type { Task } from "../types";
import { getDurationMinutes } from "./time";

export function buildStats(taskList: Task[], categories: string[]) {
  const normalTasks = taskList.filter((task) => task.type !== "backlog");
  const doneTasks = normalTasks.filter((task) => task.status === "done");

  const totalMinutes = doneTasks.reduce((sum, task) => {
    return sum + getDurationMinutes(task.startTime, task.endTime);
  }, 0);

  const completionRate =
    normalTasks.length === 0
      ? 0
      : Math.round((doneTasks.length / normalTasks.length) * 100);

  const minutesByCategory = categories.map((category) => {
    const total = doneTasks
      .filter((task) => task.category === category)
      .reduce((sum, task) => {
        return sum + getDurationMinutes(task.startTime, task.endTime);
      }, 0);

    return { category, total };
  });

  const categoryStats = categories.map((category) => {
    const categoryTasks = normalTasks.filter(
      (task) => task.category === category
    );

    const doneCategoryTasks = categoryTasks.filter(
      (task) => task.status === "done"
    );

    const categoryMinutes = doneCategoryTasks.reduce((sum, task) => {
      return sum + getDurationMinutes(task.startTime, task.endTime);
    }, 0);

    const categoryCompletionRate =
      categoryTasks.length === 0
        ? 0
        : Math.round((doneCategoryTasks.length / categoryTasks.length) * 100);

    return {
      category,
      totalTasks: categoryTasks.length,
      doneTasks: doneCategoryTasks.length,
      totalMinutes: categoryMinutes,
      completionRate: categoryCompletionRate,
    };
  });

  const doneTasksWithTime = doneTasks.filter((task) => {
    return getDurationMinutes(task.startTime, task.endTime) > 0;
  });

  const averageMinutesPerDoneTask =
    doneTasksWithTime.length === 0
      ? 0
      : Math.round(totalMinutes / doneTasksWithTime.length);

  const mostActiveCategory = categoryStats.reduce<{
    category: string;
    totalMinutes: number;
  } | null>((bestCategory, currentCategory) => {
    if (currentCategory.totalMinutes === 0) return bestCategory;

    if (
      !bestCategory ||
      currentCategory.totalMinutes > bestCategory.totalMinutes
    ) {
      return {
        category: currentCategory.category,
        totalMinutes: currentCategory.totalMinutes,
      };
    }

    return bestCategory;
  }, null);

  return {
    totalTasks: normalTasks.length,
    doneTasks: doneTasks.length,
    totalMinutes,
    completionRate,
    minutesByCategory,
    categoryStats,
    averageMinutesPerDoneTask,
    mostActiveCategory,
  };
}