import type { ComponentProps, ReactNode } from "react";

import type { Task } from "../types";
import { theme } from "../styles/theme";
import { StatCards } from "../components/StatCards";
import { TaskList } from "../components/TaskList";

type MonthViewProps = {
  selectedMonth: string;
  monthStats: ComponentProps<typeof StatCards>["stats"];
  monthTasks: Task[];
  renderMonthCalendar: () => ReactNode;
  renderMonthAgenda: () => ReactNode;
  renderSelectedCalendarDayPanel: () => ReactNode;
  onSelectedMonthChange: (month: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (taskId: string) => void | Promise<void>;
  onDeleteTask: (task: Task) => void;
};

export function MonthView({
  selectedMonth,
  monthStats,
  monthTasks,
  renderMonthCalendar,
  renderMonthAgenda,
  renderSelectedCalendarDayPanel,
  onSelectedMonthChange,
  onEditTask,
  onToggleDone,
  onDeleteTask,
}: MonthViewProps) {
  return (
    <>
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={theme.eyebrow}>Monthly Overview</p>

          <h2 className={`${theme.title} ${theme.brushUnderline}`}>
            Μηνιαία εικόνα
          </h2>
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={(event) => onSelectedMonthChange(event.target.value)}
          className={theme.input}
        />
      </header>

      <StatCards stats={monthStats} />

      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-8">
          {renderMonthCalendar()}

          {renderMonthAgenda()}

          <div className={theme.card}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                Tasks μήνα
              </h3>

              <p className="text-sm font-semibold text-neutral-500">
                {selectedMonth}
              </p>
            </div>

            <TaskList
              tasks={monthTasks}
              emptyState={{
                eyebrow: "Month",
                title: "Δεν έχεις tasks για αυτόν τον μήνα.",
                description:
                  "Μόλις αρχίσεις να ολοκληρώνεις tasks με χρόνο, το month view θα γίνει χρήσιμο για ανασκόπηση.",
              }}
              onEditTask={onEditTask}
              onToggleDone={onToggleDone}
              onDeleteTask={onDeleteTask}
            />
          </div>
        </section>

        <aside>{renderSelectedCalendarDayPanel()}</aside>
      </div>
    </>
  );
}