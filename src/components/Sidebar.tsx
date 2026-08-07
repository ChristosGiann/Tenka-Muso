import type { View } from "../types";
import { theme } from "../styles/theme";

type NavigationView = {
  id: View;
  label: string;
};

type SidebarProps = {
  views: NavigationView[];
  activeView: View;
  onViewChange: (viewId: View) => void;
};

export function Sidebar({ views, activeView, onViewChange }: SidebarProps) {
  return (
    <aside className={`${theme.sidebar} overflow-hidden`}>
      <img
        src="/theme/plant.png"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute bottom-6 left-4 z-0 w-40 opacity-25 mix-blend-multiply"
      />

      <div className="relative z-10 mb-10">
        <p className="text-xs font-bold tracking-[0.35em] text-neutral-500">
          天下無双
        </p>

        <h1 className="mt-2 font-serif text-3xl font-black tracking-tight text-neutral-950">
          Tenka Musō
        </h1>

        <p className="mt-2 text-sm font-semibold text-neutral-500">
          Discipline • Focus • Path
        </p>
      </div>

      <nav className="relative z-10 space-y-2">
        {views.map((view) => {
          const isActive = activeView === view.id;

          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={
                isActive
                  ? "relative w-full overflow-visible px-4 py-3 text-left text-sm font-bold text-stone-50"
                  : theme.navItem
              }
            >
              {isActive && (
                <img
                  src="/theme/brush-1.png"
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-1/2 h-[42px] w-full -translate-y-1/2 scale-x-110 object-fill opacity-95"
                />
              )}

              <span className="relative z-10">{view.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="relative z-10 mt-10 rounded-2xl border border-neutral-300 bg-neutral-950 p-4 text-stone-50 shadow-[0_10px_25px_rgba(23,23,23,0.18)]">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
          Current view
        </p>

        <p className="mt-2 text-lg font-bold">{activeView}</p>
      </div>
    </aside>
  );
}