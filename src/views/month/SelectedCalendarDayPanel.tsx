import type { ComponentProps } from "react";

import { theme } from "../../styles/theme";
import { formatMinutes } from "../../utils/time";
import { CategoryStats } from "../../components/CategoryStats";

type SelectedCalendarDayPanelProps = {
  selectedCalendarDate: string;
  selectedCalendarStats: ComponentProps<typeof CategoryStats>["stats"];
  dailyNote: string | undefined;
  onOpenDate: (date: string) => void;
};

export function SelectedCalendarDayPanel({
  selectedCalendarDate,
  selectedCalendarStats,
  dailyNote,
  onOpenDate,
}: SelectedCalendarDayPanelProps) {
  return (
    <div className="space-y-6">
      <CategoryStats stats={selectedCalendarStats} />

      <div className={theme.card}>
        <p className={theme.eyebrow}>Επιλεγμένη ημέρα</p>

        <h3 className="mt-2 text-2xl font-bold text-neutral-950">
          {selectedCalendarDate}
        </h3>

        <div className="mt-5 space-y-3 text-sm font-semibold text-neutral-700">
          <p>Tasks: {selectedCalendarStats.totalTasks}</p>
          <p>Done: {selectedCalendarStats.doneTasks}</p>
          <p>Χρόνος: {formatMinutes(selectedCalendarStats.totalMinutes)}</p>
          <p>Completion: {selectedCalendarStats.completionRate}%</p>
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold text-neutral-700">Daily note</p>

          {dailyNote ? (
            <p className={`${theme.innerPanel} mt-2 p-4 text-sm leading-6 text-neutral-600`}>
              {dailyNote}
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-neutral-400">
              Δεν υπάρχει note για αυτή την ημέρα.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOpenDate(selectedCalendarDate)}
          className={`${theme.primaryButton} mt-5 w-full text-sm`}
        >
          Δες την ημέρα
        </button>
      </div>
    </div>
  );
}