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

  return {
    totalTasks: normalTasks.length,
    doneTasks: doneTasks.length,
    totalMinutes,
    completionRate,
    minutesByCategory,
  };
}