import { formatMinutes } from "../utils/time";
import { buildStats } from "../utils/stats";

type CategoryStatsProps = {
  stats: ReturnType<typeof buildStats>;
};

export function CategoryStats({ stats }: CategoryStatsProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xl font-bold">Ώρες ανά κατηγορία</h3>

      <div className="space-y-3">
        {stats.minutesByCategory.map((item) => (
          <div key={item.category}>
            <div className="mb-1 flex justify-between text-sm font-semibold">
              <span>{item.category}</span>
              <span>{formatMinutes(item.total)}</span>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-slate-950"
                style={{
                  width: `${Math.min((item.total / 480) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}