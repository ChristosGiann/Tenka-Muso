import type { Task } from "../../types";
import { theme } from "../../styles/theme";
import { getToday, weekDays } from "../../utils/date";
import { formatMinutes, getDurationMinutes } from "../../utils/time";

type CalendarDay = {
  date: string;
  dayNumber: number | string;
  isCurrentMonth: boolean;
};

type MonthCalendarProps = {
  selectedMonth: string;
  calendarDays: CalendarDay[];
  monthTasks: Task[];
  selectedCalendarDate: string;
  onSelectedCalendarDateChange: (date: string) => void;
};

export function MonthCalendar({
  selectedMonth,
  calendarDays,
  monthTasks,
  selectedCalendarDate,
  onSelectedCalendarDateChange,
}: MonthCalendarProps) {
  return (
    <div className={theme.card}>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
            Calendar μήνα
          </h3>

          <p className="mt-3 text-sm font-semibold text-neutral-500">
            Πάτα σε μια ημέρα για να δεις τα stats της.
          </p>
        </div>

        <p className="text-sm font-bold text-neutral-500">{selectedMonth}</p>
      </div>

      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500 sm:text-xs sm:tracking-[0.14em]"
          >
            {day}
          </div>
        ))}

        {calendarDays.map((calendarDay) => {
          const tasksForDay = monthTasks.filter(
            (task) => task.date === calendarDay.date
          );

          const doneTasksForDay = tasksForDay.filter(
            (task) => task.status === "done"
          );

          const doneMinutesForDay = doneTasksForDay.reduce((sum, task) => {
            return sum + getDurationMinutes(task.startTime, task.endTime);
          }, 0);

          const isToday = calendarDay.date === getToday();
          const isSelectedCalendarDay =
            calendarDay.date === selectedCalendarDate;

          return (
            <button
              key={calendarDay.date}
              type="button"
              onClick={() => onSelectedCalendarDateChange(calendarDay.date)}
              className={`min-h-20 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] sm:min-h-28 sm:rounded-2xl sm:p-3 ${
                isSelectedCalendarDay
                  ? "border-neutral-950 bg-neutral-950 text-stone-50"
                  : calendarDay.isCurrentMonth
                    ? "border-neutral-300 bg-stone-50/75 text-neutral-950"
                    : "border-neutral-200 bg-stone-100/40 text-neutral-400"
              } ${
                isToday
                  ? "ring-2 ring-neutral-950/30 ring-offset-2 ring-offset-stone-100"
                  : ""
              }`}
            >
              <div className="mb-2 flex items-center justify-between sm:mb-4">
                <span className="text-xs font-bold sm:text-sm">
                  {calendarDay.dayNumber}
                </span>

                {isToday && (
                  <span
                    className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline-flex ${
                      isSelectedCalendarDay
                        ? "bg-stone-50 text-neutral-950"
                        : "bg-neutral-950 text-stone-50"
                    }`}
                  >
                    Today
                  </span>
                )}
              </div>

              <div className="flex min-h-9 items-center justify-center sm:min-h-12">
                {doneMinutesForDay > 0 ? (
                  <p className="text-xs font-extrabold sm:text-lg">
                    {formatMinutes(doneMinutesForDay)}
                  </p>
                ) : (
                  <p
                    className={`text-xs font-semibold sm:text-sm ${
                      isSelectedCalendarDay
                        ? "text-stone-400"
                        : "text-neutral-300"
                    }`}
                  >
                    —
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}