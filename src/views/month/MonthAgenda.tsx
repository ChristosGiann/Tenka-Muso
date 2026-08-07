import type { Task } from "../../types";
import { theme } from "../../styles/theme";
import { formatMinutes, getDurationMinutes } from "../../utils/time";
import { EmptyState } from "../../components/EmptyState";

type MonthAgendaProps = {
  selectedCalendarDate: string;
  selectedCalendarTasks: Task[];
  onOpenDate: (date: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (taskId: string) => void | Promise<void>;
};

export function MonthAgenda({
  selectedCalendarDate,
  selectedCalendarTasks,
  onOpenDate,
  onEditTask,
  onToggleDone,
}: MonthAgendaProps) {
  return (
    <div className={theme.card}>
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={theme.eyebrow}>Agenda</p>

          <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
            Tasks επιλεγμένης ημέρας
          </h3>

          <p className="mt-3 text-sm font-semibold text-neutral-500">
            {selectedCalendarDate}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenDate(selectedCalendarDate)}
          className={`${theme.secondaryButton} text-sm`}
        >
          Δες την ημέρα
        </button>
      </div>

      <div className="space-y-3">
        {selectedCalendarTasks.length === 0 && (
          <EmptyState
            eyebrow="Agenda"
            title="Δεν υπάρχουν tasks για αυτή την ημέρα."
            description="Πάτα άλλη ημέρα στο calendar ή πάτα «Δες την ημέρα» για να προσθέσεις νέο task."
          />
        )}

        {selectedCalendarTasks.map((task) => {
          const duration = getDurationMinutes(task.startTime, task.endTime);

          return (
            <div
              key={task.id}
              className={`${theme.innerPanel} flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between`}
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={theme.badge}>{task.category}</span>
                  <span className={theme.badge}>{task.type}</span>
                  <span className={theme.badge}>{task.status}</span>

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
                  <p className="mt-2 text-sm leading-6 text-neutral-600">
                    {task.notes}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDate(task.date)}
                  className={theme.smallButton}
                >
                  Open day
                </button>

                <button
                  type="button"
                  onClick={() => onEditTask(task)}
                  className={theme.smallButton}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onToggleDone(task.id)}
                  className={
                    task.status === "done"
                      ? theme.smallButton
                      : "rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50 transition hover:bg-neutral-800"
                  }
                >
                  {task.status === "done" ? "Undo" : "Done"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}