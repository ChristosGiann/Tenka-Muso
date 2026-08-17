export const appThemeOptions = [
  {
    key: "manga-grayscale",
    label: "Manga grayscale / sumi-e",
    description: "Το βασικό grayscale manga-inspired theme.",
    themeClass: "theme-manga-grayscale",
  },
  {
    key: "dark-manga",
    label: "Dark manga",
    description: "Σκοτεινό outer frame με manga contrast.",
    themeClass: "theme-dark-manga",
  },
  {
    key: "light-minimal",
    label: "Light minimal",
    description: "Καθαρό, απλό light theme.",
    themeClass: "theme-light-minimal",
  },
  {
    key: "warm-journal",
    label: "Warm journal",
    description: "Πιο ζεστό journal-style theme.",
    themeClass: "theme-warm-journal",
  },
] as const;

export type AppThemeKey = (typeof appThemeOptions)[number]["key"];

export const defaultAppThemeKey: AppThemeKey = "manga-grayscale";

export function isAppThemeKey(value: unknown): value is AppThemeKey {
  return (
    typeof value === "string" &&
    appThemeOptions.some((themeOption) => themeOption.key === value)
  );
}

export function getAppThemeOption(themeKey: AppThemeKey) {
  return (
    appThemeOptions.find((themeOption) => themeOption.key === themeKey) ??
    appThemeOptions[0]
  );
}