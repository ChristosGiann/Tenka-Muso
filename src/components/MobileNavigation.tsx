import type { View } from "../types";

type NavigationView = {
  id: View;
  label: string;
};

type MobileNavigationProps = {
  views: NavigationView[];
  activeView: View;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  onViewChange: (viewId: View) => void;
};

export function MobileNavigation({
  views,
  activeView,
  mobileMenuOpen,
  onToggleMobileMenu,
  onViewChange,
}: MobileNavigationProps) {
  const activeViewLabel =
    views.find((view) => view.id === activeView)?.label ?? activeView;

  return (
    <div className="sticky top-0 z-40 -mx-4 mb-4 border-b border-neutral-300/70 bg-stone-100/95 backdrop-blur lg:hidden sm:-mx-5">
      <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          className="inline-flex min-h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-stone-100 text-neutral-950 shadow-[0_8px_20px_rgba(23,23,23,0.08)] transition active:scale-[0.98]"
        >
          <span className="sr-only">
            {mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          </span>

          <span className="flex flex-col gap-1.5" aria-hidden="true">
            <span
              className={`block h-0.5 w-5 rounded-full bg-neutral-950 transition ${
                mobileMenuOpen ? "translate-y-2 rotate-45" : ""
              }`}
            />

            <span
              className={`block h-0.5 w-5 rounded-full bg-neutral-950 transition ${
                mobileMenuOpen ? "opacity-0" : ""
              }`}
            />

            <span
              className={`block h-0.5 w-5 rounded-full bg-neutral-950 transition ${
                mobileMenuOpen ? "-translate-y-2 -rotate-45" : ""
              }`}
            />
          </span>
        </button>

        <div className="min-w-0 flex-1 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
            Current view
          </p>

          <p className="truncate text-sm font-black text-neutral-950">
            {activeViewLabel}
          </p>
        </div>

        <div className="w-11 shrink-0" aria-hidden="true" />
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-neutral-300/70 px-4 pb-4 sm:px-5">
          <nav className="grid gap-2 pt-3">
            {views.map((view) => {
              const isActive = activeView === view.id;

              return (
                <button
                  key={view.id}
                  type="button"
                  onClick={() => onViewChange(view.id)}
                  className={
                    isActive
                      ? "relative min-h-12 w-full overflow-hidden rounded-xl px-4 py-3 text-left text-sm font-bold text-stone-50"
                      : "min-h-12 w-full rounded-xl border border-neutral-300 bg-stone-100 px-4 py-3 text-left text-sm font-bold text-neutral-700 transition hover:bg-stone-200"
                  }
                >
                  {isActive && (
                    <img
                      src="/theme/brush-1.png"
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 h-full w-full scale-x-110 object-fill opacity-95"
                    />
                  )}

                  <span className="relative z-10">{view.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}
    </div>
  );
}