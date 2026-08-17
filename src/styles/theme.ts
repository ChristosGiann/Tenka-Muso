export const theme = {
  appShell:
    "min-h-screen bg-[var(--tm-app-bg)] text-[color:var(--tm-text)] selection:bg-[var(--tm-selection-bg)] selection:text-[color:var(--tm-selection-text)] transition-colors duration-300",

  pageBackdrop:
    "relative min-h-screen overflow-x-hidden bg-[image:var(--tm-page-bg)]",

  paperTexture:
    "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_1px_1px,var(--tm-paper-dot)_1px,transparent_0)] before:bg-[length:18px_18px] before:opacity-35",

  sidebar:
    "relative z-10 hidden w-72 shrink-0 border-r border-[color:var(--tm-border)] bg-[var(--tm-sidebar-bg)] p-6 shadow-[12px_0_40px_rgba(23,23,23,0.08)] lg:block",

  main: "relative z-10 min-w-0 flex-1 p-4 sm:p-5 lg:p-8",

  pageContent: "mx-auto min-w-0 max-w-7xl",

  card:
    "rounded-2xl border border-[color:var(--tm-border)] bg-[var(--tm-card-bg)] p-4 shadow-[0_10px_35px_rgba(23,23,23,0.07)] backdrop-blur-sm sm:p-5",

  cardSoft:
    "rounded-2xl border border-[color:var(--tm-border-soft)] bg-[var(--tm-card-soft-bg)] p-4 shadow-[0_8px_25px_rgba(23,23,23,0.05)] sm:p-5",

  innerPanel:
    "rounded-xl border border-[color:var(--tm-border-soft)] bg-[var(--tm-panel-bg)]",

  input:
    "w-full min-w-0 rounded-xl border border-[color:var(--tm-border)] bg-[var(--tm-input-bg)] px-4 py-3 text-base text-[color:var(--tm-input-text)] outline-none transition placeholder:text-neutral-400 focus:border-[color:var(--tm-focus-border)] focus:ring-2 focus:ring-[color:var(--tm-ring)]",

  inputFull:
    "w-full min-w-0 rounded-xl border border-[color:var(--tm-border)] bg-[var(--tm-input-bg)] px-4 py-3 text-base text-[color:var(--tm-input-text)] outline-none transition placeholder:text-neutral-400 focus:border-[color:var(--tm-focus-border)] focus:ring-2 focus:ring-[color:var(--tm-ring)]",

  primaryButton:
    "min-h-11 rounded-xl bg-[var(--tm-primary)] px-5 py-3 font-semibold text-[color:var(--tm-primary-text)] shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition hover:bg-[var(--tm-primary-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",

  secondaryButton:
    "min-h-11 rounded-xl border border-[color:var(--tm-border)] bg-[var(--tm-secondary-bg)] px-4 py-3 text-sm font-bold text-[color:var(--tm-secondary-text)] transition hover:bg-[var(--tm-secondary-hover)] active:scale-[0.99]",

  smallButton:
    "min-h-10 rounded-xl border border-[color:var(--tm-border)] bg-[var(--tm-secondary-bg)] px-4 py-2 text-sm font-bold text-[color:var(--tm-secondary-text)] transition hover:bg-[var(--tm-secondary-hover)] active:scale-[0.99]",

  dangerButton:
    "min-h-10 rounded-xl border border-[color:var(--tm-border)] bg-[var(--tm-secondary-bg)] px-4 py-2 text-sm font-bold text-[color:var(--tm-secondary-text)] transition hover:border-[color:var(--tm-danger-border)] hover:bg-[var(--tm-danger-bg)] hover:text-[color:var(--tm-danger-text)] active:scale-[0.99]",

  badge:
    "inline-flex items-center rounded-full border border-[color:var(--tm-border)] bg-[var(--tm-secondary-bg)] px-3 py-1 text-xs font-bold text-[color:var(--tm-secondary-text)]",

  darkBadge:
    "inline-flex items-center rounded-full bg-[var(--tm-primary)] px-3 py-1 text-xs font-bold text-[color:var(--tm-primary-text)]",

  eyebrow:
    "text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--tm-muted)] sm:text-sm sm:tracking-[0.18em]",

  title:
    "font-serif text-2xl font-bold tracking-tight text-[color:var(--tm-title)] sm:text-3xl",

  sectionTitle: "text-lg font-bold text-[color:var(--tm-title)] sm:text-xl",

  muted: "text-sm font-semibold text-[color:var(--tm-muted)]",

  navItem:
    "w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-[color:var(--tm-nav-text)] transition hover:bg-[var(--tm-nav-hover)]",

  navItemActive:
    "w-full rounded-xl bg-[var(--tm-primary)] px-4 py-3 text-left text-sm font-bold text-[color:var(--tm-primary-text)] shadow-[0_10px_25px_rgba(23,23,23,0.18)]",

  brushUnderline: "manga-brush-underline",
};