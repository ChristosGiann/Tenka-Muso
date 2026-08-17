export const appThemeOptions = [
  {
    key: "manga-grayscale",
    label: "Manga grayscale / sumi-e",
    description: "Το βασικό grayscale manga-inspired theme.",
  },
  {
    key: "dark-manga",
    label: "Dark manga",
    description: "Σκοτεινή εκδοχή για μελλοντικό dark mode.",
  },
  {
    key: "light-minimal",
    label: "Light minimal",
    description: "Καθαρό, απλό light theme.",
  },
  {
    key: "warm-journal",
    label: "Warm journal",
    description: "Πιο ζεστό journal-style theme.",
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