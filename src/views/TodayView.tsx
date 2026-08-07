import type { ComponentProps, ReactNode } from "react";

import type { Task } from "../types";
import { theme } from "../styles/theme";
import { StatCards } from "../components/StatCards";
import { CategoryStats } from "../components/CategoryStats";
import { TaskList } from "../components/TaskList";
import { EmptyState } from "../components/EmptyState";

type TodayViewProps = {
  selectedDate: string;
  todayStats: ComponentProps<typeof StatCards>["stats"];
  dayTasks: Task[];
  backlogItems: Task[];
  renderForm: () => ReactNode;
  renderDailyNoteCard: () => ReactNode;
  onSelectedDateChange: (date: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (taskId: string) => void | Promise<void>;
  onDeleteTask: (task: Task) => void;
  onOpenBacklog: () => void;
};

export function TodayView({
  selectedDate,
  todayStats,
  dayTasks,
  backlogItems,
  renderForm,
  renderDailyNoteCard,
  onSelectedDateChange,
  onEditTask,
  onToggleDone,
  onDeleteTask,
  onOpenBacklog,
}: TodayViewProps) {
  return (
    <>
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={theme.eyebrow}>Today Dashboard</p>

          <h2 className={`${theme.title} ${theme.brushUnderline}`}>
            Ημέρα, tasks και χρόνος
          </h2>
        </div>

        <input
          type="date"
          value={selectedDate}
          onChange={(event) => onSelectedDateChange(event.target.value)}
          className={theme.input}
        />
      </header>

      <StatCards stats={todayStats} />

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          {renderForm()}

          <div className={theme.card}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                Timeline ημέρας
              </h3>

              <p className="text-sm font-semibold text-neutral-500">
                {selectedDate}
              </p>
            </div>

            <TaskList
              tasks={dayTasks}
              emptyState={{
                eyebrow: "Today",
                title: "Δεν έχεις tasks για αυτή την ημέρα.",
                description:
                  "Πρόσθεσε 1-3 βασικά tasks ή γράψε ένα daily note για να ξεκινήσει η ημέρα σου καθαρά.",
              }}
              onEditTask={onEditTask}
              onToggleDone={onToggleDone}
              onDeleteTask={onDeleteTask}
            />
          </div>
        </section>

        <aside className="space-y-6">
          {renderDailyNoteCard()}

          <CategoryStats stats={todayStats} />

          <div className={theme.card}>
            <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
              Backlog
            </h3>

            <div className="space-y-3">
              {backlogItems.length === 0 && (
                <EmptyState
                  eyebrow="Backlog"
                  title="Δεν έχεις backlog items ακόμα."
                  description="Βάλε εδώ ιδέες, πράγματα για αργότερα ή tasks που δεν ανήκουν ακόμα σε συγκεκριμένη ημέρα."
                />
              )}

              {backlogItems.slice(0, 5).map((item) => (
                <div key={item.id} className={`${theme.innerPanel} p-4`}>
                  <p className="font-bold">{item.title}</p>

                  <p className="text-sm text-neutral-500">{item.category}</p>

                  {item.notes && (
                    <p className="mt-2 text-sm text-neutral-600">
                      {item.notes}
                    </p>
                  )}
                </div>
              ))}

              {backlogItems.length > 5 && (
                <button
                  type="button"
                  onClick={onOpenBacklog}
                  className={`${theme.primaryButton} w-full text-sm`}
                >
                  Δες όλο το backlog
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}