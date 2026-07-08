export const theme = {
    appShell:
        "min-h-screen bg-stone-200 text-neutral-950 selection:bg-neutral-950 selection:text-stone-50",

    pageBackdrop:
        "relative min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(38,38,38,0.08),transparent_34%),linear-gradient(135deg,#f3f0e8_0%,#e7e2d8_42%,#d8d2c7_100%)]",

    paperTexture:
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_1px_1px,rgba(23,23,23,0.08)_1px,transparent_0)] before:bg-[length:18px_18px] before:opacity-35",

    sidebar:
        "relative z-10 hidden w-72 shrink-0 border-r border-neutral-300/80 bg-stone-100/90 p-6 shadow-[12px_0_40px_rgba(23,23,23,0.08)] lg:block",

    main:
        "relative z-10 min-w-0 flex-1 p-4 sm:p-5 lg:p-8",

    pageContent:
        "mx-auto min-w-0 max-w-7xl",

    card:
        "rounded-2xl border border-neutral-300/80 bg-stone-50/85 p-4 shadow-[0_10px_35px_rgba(23,23,23,0.07)] backdrop-blur-sm sm:p-5",

    cardSoft:
        "rounded-2xl border border-neutral-300/70 bg-stone-100/70 p-4 shadow-[0_8px_25px_rgba(23,23,23,0.05)] sm:p-5",

    innerPanel:
        "rounded-xl border border-neutral-300/70 bg-stone-100/80",

    input:
        "w-full min-w-0 rounded-xl border border-neutral-300 bg-stone-50/90 px-4 py-3 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-700 focus:ring-2 focus:ring-neutral-900/10",

    inputFull:
        "w-full min-w-0 rounded-xl border border-neutral-300 bg-stone-50/90 px-4 py-3 text-base text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-700 focus:ring-2 focus:ring-neutral-900/10",

    primaryButton:
        "min-h-11 rounded-xl bg-neutral-950 px-5 py-3 font-semibold text-stone-50 shadow-[0_8px_20px_rgba(23,23,23,0.18)] transition hover:bg-neutral-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",

    secondaryButton:
        "min-h-11 rounded-xl border border-neutral-300 bg-stone-100 px-4 py-3 text-sm font-bold text-neutral-700 transition hover:bg-stone-200 active:scale-[0.99]",

    smallButton:
        "min-h-10 rounded-xl border border-neutral-300 bg-stone-100 px-4 py-2 text-sm font-bold text-neutral-700 transition hover:bg-stone-200 active:scale-[0.99]",

    dangerButton:
        "min-h-10 rounded-xl border border-neutral-300 bg-stone-100 px-4 py-2 text-sm font-bold text-neutral-700 transition hover:border-neutral-950 hover:bg-neutral-950 hover:text-stone-50 active:scale-[0.99]",

    badge:
        "inline-flex items-center rounded-full border border-neutral-300 bg-stone-100 px-3 py-1 text-xs font-bold text-neutral-700",

    darkBadge:
        "inline-flex items-center rounded-full bg-neutral-950 px-3 py-1 text-xs font-bold text-stone-50",

    eyebrow:
        "text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500 sm:text-sm sm:tracking-[0.18em]",

    title:
        "font-serif text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl",

    sectionTitle:
        "text-lg font-bold text-neutral-950 sm:text-xl",

    muted:
        "text-sm font-semibold text-neutral-500",

    navItem:
        "w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-neutral-700 transition hover:bg-stone-200/80",

    navItemActive:
        "w-full rounded-xl bg-neutral-950 px-4 py-3 text-left text-sm font-bold text-stone-50 shadow-[0_10px_25px_rgba(23,23,23,0.18)]",

    brushUnderline: "manga-brush-underline",
};