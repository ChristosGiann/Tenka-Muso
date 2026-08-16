import type { ComponentProps } from "react";

import { theme } from "../styles/theme";
import { formatMinutes } from "../utils/time";
import { CategoryStats } from "../components/CategoryStats";
import { EmptyState } from "../components/EmptyState";
import { GoalsPanel } from "../components/GoalsPanel";

type StatsViewProps = {
  allTimeStats: ComponentProps<typeof CategoryStats>["stats"];
  backlogItemsCount: number;
} & ComponentProps<typeof GoalsPanel>;

export function StatsView({
  allTimeStats,
  backlogItemsCount,
  ...goalsPanelProps
}: StatsViewProps) {
  return (
    <>
      <header className="mb-8">
        <p className={theme.eyebrow}>All-time Dashboard</p>

        <h2 className={`${theme.title} ${theme.brushUnderline}`}>
          Συνολικά στατιστικά
        </h2>
      </header>

      {allTimeStats.totalTasks === 0 && (
        <div className="mb-8">
          <EmptyState
            eyebrow="Stats"
            title="Δεν υπάρχουν ακόμα αρκετά δεδομένα."
            description="Τα στατιστικά θα αποκτήσουν νόημα μόλις αρχίσεις να ολοκληρώνεις tasks με χρόνο και κατηγορίες."
          />
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
        <CategoryStats stats={allTimeStats} />

        <div className={theme.card}>
          <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
            Σύνοψη
          </h3>

          <div className="space-y-3 text-sm font-semibold text-neutral-700">
            <p>Συνολικά tasks: {allTimeStats.totalTasks}</p>
            <p>Ολοκληρωμένα tasks: {allTimeStats.doneTasks}</p>
            <p>Συνολικός χρόνος: {formatMinutes(allTimeStats.totalMinutes)}</p>
            <p>Backlog items: {backlogItemsCount}</p>
            <p>
              Μέσος χρόνος ανά completed task:{" "}
              {formatMinutes(allTimeStats.averageMinutesPerDoneTask)}
            </p>
            <p>
              Πιο ενεργή κατηγορία:{" "}
              {allTimeStats.mostActiveCategory
                ? `${allTimeStats.mostActiveCategory.category} (${formatMinutes(
                    allTimeStats.mostActiveCategory.totalMinutes
                  )})`
                : "Δεν υπάρχουν ακόμα ολοκληρωμένα tasks με χρόνο."}
            </p>
          </div>
        </div>
      </div>

      <GoalsPanel {...goalsPanelProps} />

      <div className={`${theme.card} mt-8`}>
        <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
          Ανάλυση ανά κατηγορία
        </h3>

        <div className="space-y-3">
          {allTimeStats.categoryStats.map((categoryStat) => (
            <div key={categoryStat.category} className={`${theme.innerPanel} p-4`}>
              <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <h4 className="font-bold text-neutral-950">
                  {categoryStat.category}
                </h4>

                <p className="text-sm font-semibold text-neutral-500">
                  {categoryStat.completionRate}% completion
                </p>
              </div>

              <div className="grid gap-3 text-sm font-semibold text-neutral-700 md:grid-cols-3">
                <p>Tasks: {categoryStat.totalTasks}</p>
                <p>Done: {categoryStat.doneTasks}</p>
                <p>Χρόνος: {formatMinutes(categoryStat.totalMinutes)}</p>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full border border-neutral-300 bg-stone-200">
                <div
                  className="h-full rounded-full bg-neutral-950"
                  style={{ width: `${categoryStat.completionRate}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}