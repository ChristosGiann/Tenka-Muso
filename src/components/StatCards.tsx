import { formatMinutes } from "../utils/time";
import { buildStats } from "../utils/stats";

type StatCardsProps = {
  stats: ReturnType<typeof buildStats>;
};

export function StatCards({ stats }: StatCardsProps) {
  return (
    <section className="mb-8 grid gap-4 md:grid-cols-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Tasks</p>
        <p className="mt-2 text-3xl font-bold">{stats.totalTasks}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Done</p>
        <p className="mt-2 text-3xl font-bold">{stats.doneTasks}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Logged Time</p>
        <p className="mt-2 text-3xl font-bold">
          {formatMinutes(stats.totalMinutes)}
        </p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">Completion</p>
        <p className="mt-2 text-3xl font-bold">{stats.completionRate}%</p>
      </div>
    </section>
  );
}