import type { Task } from "../types";
import { theme } from "../styles/theme";
import { formatMinutes, getDurationMinutes } from "../utils/time";
import { EmptyState, type EmptyStateOptions } from "./EmptyState";

type TaskListProps = {
  tasks: Task[];
  emptyState: string | EmptyStateOptions;
  onEditTask: (task: Task) => void;
  onToggleDone: (taskId: string, occurrenceDate?: string) => void | Promise<void>;
  onDeleteTask: (task: Task) => void;
};

export function TaskList({
  tasks,
  emptyState,
  onEditTask,
  onToggleDone,
  onDeleteTask,
}: TaskListProps) {
  const resolvedEmptyState =
    typeof emptyState === "string"
      ? {
        title: emptyState,
        description:
          "Χρησιμοποίησε τη φόρμα νέου task για να ξεκινήσεις να χτίζεις την ημέρα σου.",
      }
      : emptyState;

  return (
    <div className="space-y-3">
      {tasks.length === 0 && <EmptyState {...resolvedEmptyState} />}

      {tasks.map((task) => {
        const duration = getDurationMinutes(task.startTime, task.endTime);

        return (
          <div
            key={`${task.id}-${task.date}`}
            className="flex flex-col gap-3 rounded-2xl border border-neutral-300/80 bg-stone-50/75 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] md:flex-row md:items-center md:justify-between"
          >
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={theme.badge}>{task.category}</span>
                <span className={theme.badge}>{task.type}</span>

                {task.isRoutineOccurrence && (
                  <span className={theme.badge}>occurrence</span>
                )}

                {duration > 0 && (
                  <span className={theme.darkBadge}>
                    {formatMinutes(duration)}
                  </span>
                )}
              </div>

              <h4 className="mt-2 text-lg font-bold text-neutral-950">
                {task.status === "done" ? "✓ " : ""}
                {task.title}
              </h4>

              <p className="text-sm font-semibold text-neutral-500">
                {task.startTime && task.endTime
                  ? `${task.date} • ${task.startTime} - ${task.endTime}`
                  : task.date}
              </p>

              {task.notes && (
                <p className="mt-2 text-sm text-neutral-600">{task.notes}</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onEditTask(task)}
                className={theme.smallButton}
              >
                Edit
              </button>

              <button
                type="button"
                onClick={() => onToggleDone(task.id, task.date)}
                className={
                  task.status === "done"
                    ? theme.smallButton
                    : "rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50 transition hover:bg-neutral-800"
                }
              >
                {task.status === "done" ? "Undo" : "Done"}
              </button>

              <button
                type="button"
                onClick={() => onDeleteTask(task)}
                className={theme.dangerButton}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}