import type { ComponentProps } from "react";

import type { Task } from "../types";
import { theme } from "../styles/theme";
import { getToday, weekDays } from "../utils/date";
import { formatMinutes } from "../utils/time";
import { StatCards } from "../components/StatCards";
import { CategoryStats } from "../components/CategoryStats";
import { TaskList } from "../components/TaskList";

type WeekDaySummary = {
  date: string;
  totalTasks: number;
  doneTasks: number;
  doneMinutes: number;
};

type WeekViewProps = {
  selectedWeekDate: string;
  weekStart: string;
  weekEnd: string;
  weekStats: ComponentProps<typeof StatCards>["stats"];
  weekDaySummaries: WeekDaySummary[];
  weekTasks: Task[];
  onPreviousWeek: () => void;
  onCurrentWeek: () => void;
  onNextWeek: () => void;
  onSelectedWeekDateChange: (date: string) => void;
  onOpenDay: (date: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (taskId: string, occurrenceDate?: string) => void | Promise<void>;
  onDeleteTask: (task: Task) => void;
};

export function WeekView({
  selectedWeekDate,
  weekStart,
  weekEnd,
  weekStats,
  weekDaySummaries,
  weekTasks,
  onPreviousWeek,
  onCurrentWeek,
  onNextWeek,
  onSelectedWeekDateChange,
  onOpenDay,
  onEditTask,
  onToggleDone,
  onDeleteTask,
}: WeekViewProps) {
  return (
    <>
      <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className={theme.eyebrow}>Weekly Overview</p>

          <h2 className={`${theme.title} ${theme.brushUnderline}`}>
            Εβδομαδιαία εικόνα
          </h2>

          <p className="mt-3 text-sm font-semibold text-neutral-500">
            {weekStart} έως {weekEnd}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPreviousWeek}
            className={theme.secondaryButton}
          >
            Προηγούμενη
          </button>

          <button
            type="button"
            onClick={onCurrentWeek}
            className={theme.primaryButton}
          >
            Τρέχουσα
          </button>

          <button
            type="button"
            onClick={onNextWeek}
            className={theme.secondaryButton}
          >
            Επόμενη
          </button>

          <input
            type="date"
            value={selectedWeekDate}
            onChange={(event) => onSelectedWeekDateChange(event.target.value)}
            className={theme.input}
          />
        </div>
      </header>

      <StatCards stats={weekStats} />

      <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="space-y-8">
          <div className={theme.card}>
            <div className="mb-5">
              <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                Ημέρες εβδομάδας
              </h3>

              <p className="mt-3 text-sm font-semibold text-neutral-500">
                Πάτα σε μια ημέρα για να ανοίξει στο Today view.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
              {weekDaySummaries.map((daySummary, index) => {
                const isToday = daySummary.date === getToday();

                return (
                  <button
                    key={daySummary.date}
                    type="button"
                    onClick={() => onOpenDay(daySummary.date)}
                    className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] ${
                      isToday
                        ? "border-neutral-950 bg-neutral-950 text-stone-50"
                        : "border-neutral-300 bg-stone-50/75 text-neutral-950"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p
                        className={`text-sm font-bold ${
                          isToday ? "text-stone-300" : "text-neutral-500"
                        }`}
                      >
                        {weekDays[index]}
                      </p>

                      {isToday && (
                        <span className="rounded-full bg-stone-50 px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                          Today
                        </span>
                      )}
                    </div>

                    <p
                      className={`text-sm font-semibold ${
                        isToday ? "text-stone-300" : "text-neutral-500"
                      }`}
                    >
                      {daySummary.date}
                    </p>

                    <p className="mt-3 text-2xl font-extrabold">
                      {formatMinutes(daySummary.doneMinutes)}
                    </p>

                    <p
                      className={`mt-2 text-sm font-semibold ${
                        isToday ? "text-stone-300" : "text-neutral-500"
                      }`}
                    >
                      {daySummary.doneTasks}/{daySummary.totalTasks} done
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={theme.card}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                Tasks εβδομάδας
              </h3>

              <p className="text-sm font-semibold text-neutral-500">
                {weekStart} - {weekEnd}
              </p>
            </div>

            <TaskList
              tasks={weekTasks}
              emptyState={{
                eyebrow: "Week",
                title: "Δεν έχεις tasks για αυτή την εβδομάδα.",
                description:
                  "Άνοιξε μια ημέρα της εβδομάδας ή πρόσθεσε tasks για να αρχίσει να γεμίζει το weekly view.",
              }}
              onEditTask={onEditTask}
              onToggleDone={onToggleDone}
              onDeleteTask={onDeleteTask}
            />
          </div>
        </section>

        <aside>
          <CategoryStats stats={weekStats} />
        </aside>
      </div>
    </>
  );
}