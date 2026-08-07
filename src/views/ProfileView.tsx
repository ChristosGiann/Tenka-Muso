import type { User } from "firebase/auth";

import type { View } from "../types";
import { theme } from "../styles/theme";

type UserSettings = {
  defaultCategory: string;
  defaultView: View;
  themePreference: string;
};

type ProfileViewProps = {
  firebaseUser: User | null;
  authLoading: boolean;
  authActionLoading: boolean;
  authError: string | null;
  categories: string[];
  profileNameDraft: string;
  profileNameSaving: boolean;
  profileNameSaved: boolean;
  profileNameError: string | null;
  userSettings: UserSettings;
  settingsLoading: boolean;
  settingsSaving: boolean;
  settingsSaved: boolean;
  settingsError: string | null;
  tasksLoading: boolean;
  dailyNotesLoading: boolean;
  onProfileNameDraftChange: (value: string) => void;
  onSaveProfileName: () => void | Promise<void>;
  onDefaultCategoryChange: (value: string) => void;
  onDefaultViewChange: (value: View) => void;
  onThemePreferenceChange: (value: string) => void;
  onSaveUserSettings: () => void | Promise<void>;
  onExportUserData: () => void;
  onSignInWithGoogle: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
};

export function ProfileView({
  firebaseUser,
  authLoading,
  authActionLoading,
  authError,
  categories,
  profileNameDraft,
  profileNameSaving,
  profileNameSaved,
  profileNameError,
  userSettings,
  settingsLoading,
  settingsSaving,
  settingsSaved,
  settingsError,
  tasksLoading,
  dailyNotesLoading,
  onProfileNameDraftChange,
  onSaveProfileName,
  onDefaultCategoryChange,
  onDefaultViewChange,
  onThemePreferenceChange,
  onSaveUserSettings,
  onExportUserData,
  onSignInWithGoogle,
  onSignOut,
}: ProfileViewProps) {
  const isAnonymousUser = firebaseUser?.isAnonymous ?? false;

  const providerLabel = isAnonymousUser
    ? "Anonymous"
    : firebaseUser?.providerData?.[0]?.providerId ?? "Google / Firebase";

  const userLabel = firebaseUser
    ? firebaseUser.displayName ||
      firebaseUser.email ||
      `Anonymous ${firebaseUser.uid.slice(0, 8)}...`
    : "Δεν υπάρχει Firebase user.";

  return (
    <>
      <header className="mb-8">
        <p className={theme.eyebrow}>Account / Settings</p>

        <h2 className={`${theme.title} ${theme.brushUnderline}`}>
          Profile
        </h2>

        <p className="mt-3 text-sm font-semibold text-neutral-500">
          Διαχείριση λογαριασμού και βασικών προτιμήσεων.
        </p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="space-y-6">
          <div className={theme.card}>
            <p className={theme.eyebrow}>User</p>

            <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mt-2`}>
              Στοιχεία λογαριασμού
            </h3>

            <div className="mt-6 space-y-6 text-sm font-semibold text-neutral-700">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Display name
                </p>

                <div className="mt-4 flex flex-col gap-3 md:flex-row">
                  <input
                    value={profileNameDraft}
                    onChange={(event) =>
                      onProfileNameDraftChange(event.target.value)
                    }
                    placeholder="Π.χ. Christos"
                    className={`${theme.input} min-w-0 flex-1`}
                  />

                  <button
                    type="button"
                    onClick={onSaveProfileName}
                    disabled={profileNameSaving || authLoading || !firebaseUser}
                    className={theme.primaryButton}
                  >
                    {profileNameSaving ? "Saving..." : "Save name"}
                  </button>
                </div>

                {profileNameSaved && (
                  <p className="mt-3 text-sm font-semibold text-neutral-700">
                    Το όνομα αποθηκεύτηκε.
                  </p>
                )}

                {profileNameError && (
                  <p className="mt-3 text-sm font-semibold text-neutral-700">
                    {profileNameError}
                  </p>
                )}
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                  User
                </p>

                <p className="mt-3 text-base font-bold text-neutral-950">
                  {authLoading ? "Φόρτωση..." : userLabel}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Email
                </p>

                <p className="mt-3 text-base font-bold text-neutral-950">
                  {firebaseUser?.email ?? "Δεν υπάρχει email στο anonymous mode."}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
                  Provider
                </p>

                <p className="mt-3 text-base font-bold text-neutral-950">
                  {providerLabel}
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!authLoading && firebaseUser && isAnonymousUser && (
                <button
                  type="button"
                  onClick={onSignInWithGoogle}
                  disabled={authActionLoading}
                  className={theme.primaryButton}
                >
                  {authActionLoading ? "Opening Google..." : "Sign in with Google"}
                </button>
              )}

              {!authLoading && firebaseUser && !isAnonymousUser && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className={theme.secondaryButton}
                >
                  Sign out
                </button>
              )}
            </div>

            {authError && (
              <p className="mt-4 rounded-xl border border-neutral-300 bg-stone-100 p-3 text-sm font-semibold text-neutral-800">
                {authError}
              </p>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className={theme.card}>
            <p className={theme.eyebrow}>Preferences</p>

            <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mt-2`}>
              Settings
            </h3>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  Default category
                </span>

                <select
                  value={userSettings.defaultCategory}
                  onChange={(event) => onDefaultCategoryChange(event.target.value)}
                  className={theme.inputFull}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  Default view
                </span>

                <select
                  value={userSettings.defaultView}
                  onChange={(event) =>
                    onDefaultViewChange(event.target.value as View)
                  }
                  className={theme.inputFull}
                >
                  <option value="today">Today</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                  <option value="stats">Stats</option>
                  <option value="backlog">Backlog</option>
                  <option value="search">Search</option>
                  <option value="profile">Profile</option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="block text-sm font-bold text-neutral-600">
                  Theme
                </span>

                <select
                  value={userSettings.themePreference}
                  onChange={(event) =>
                    onThemePreferenceChange(event.target.value)
                  }
                  className={theme.inputFull}
                >
                  <option value="manga-grayscale">
                    Manga grayscale / sumi-e
                  </option>
                </select>
              </label>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={onSaveUserSettings}
                disabled={settingsSaving || settingsLoading}
                className={theme.primaryButton}
              >
                {settingsSaving ? "Saving..." : "Save settings"}
              </button>

              {settingsLoading && (
                <p className="text-sm font-semibold text-neutral-500">
                  Φόρτωση settings...
                </p>
              )}

              {settingsSaved && (
                <p className="text-sm font-semibold text-neutral-700">
                  Τα settings αποθηκεύτηκαν.
                </p>
              )}

              {settingsError && (
                <p className="text-sm font-semibold text-neutral-700">
                  {settingsError}
                </p>
              )}
            </div>

            <div className={`${theme.innerPanel} mt-6 p-4`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-950">
                    Backup export
                  </p>

                  <p className="mt-1 text-sm font-semibold text-neutral-500">
                    Κατέβασε tasks, daily notes, custom categories και settings
                    σε JSON.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onExportUserData}
                  disabled={
                    !firebaseUser ||
                    tasksLoading ||
                    dailyNotesLoading ||
                    settingsLoading
                  }
                  className={theme.secondaryButton}
                >
                  Export JSON
                </button>
              </div>

              <p className="mt-3 text-xs font-semibold text-neutral-500">
                Το export είναι μόνο για backup. Δεν κάνει import ή αλλαγή στα
                δεδομένα σου.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}