import { useRef } from "react";
import {
  appThemeOptions,
  type AppThemeKey,
} from "../styles/themeOptions";
import type { User } from "firebase/auth";
import type { View } from "../types";
import type { BackupImportPreview, BackupImportResult } from "../hooks/useBackupImport";
import { theme } from "../styles/theme";

type UserSettings = {
  defaultCategory: string;
  defaultView: View;
  themePreference: AppThemeKey;
};

type ProfileViewProps = {
  firebaseUser: User | null;
  authLoading: boolean;
  authActionLoading: boolean;
  authError: string | null;
  authSuccessMessage: string | null;
  emailDraft: string;
  passwordDraft: string;
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
  onEmailDraftChange: (value: string) => void;
  onPasswordDraftChange: (value: string) => void;
  onCreateAccountWithEmailPassword: () => void | Promise<void>;
  onSignInWithEmailPassword: () => void | Promise<void>;
  onSendPasswordReset: () => void | Promise<void>;
  onDefaultCategoryChange: (value: string) => void;
  onDefaultViewChange: (value: View) => void;
  onThemePreferenceChange: (value: AppThemeKey) => void;
  onSaveUserSettings: () => void | Promise<void>;
  onExportUserData: () => void;
  backupImportPreview: BackupImportPreview | null;
  backupImporting: boolean;
  backupImportError: string | null;
  backupImportResult: BackupImportResult | null;
  onBackupImportFileChange: (file: File | null) => void | Promise<void>;
  onConfirmBackupImport: () => void | Promise<void>;
  onClearBackupImport: () => void;
  onSignInWithGoogle: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
};

export function ProfileView({
  firebaseUser,
  authLoading,
  authActionLoading,
  authError,
  authSuccessMessage,
  emailDraft,
  passwordDraft,
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
  onEmailDraftChange,
  onPasswordDraftChange,
  onCreateAccountWithEmailPassword,
  onSignInWithEmailPassword,
  onSendPasswordReset,
  onDefaultCategoryChange,
  onDefaultViewChange,
  onThemePreferenceChange,
  onSaveUserSettings,
  onExportUserData,
  backupImportPreview,
  backupImporting,
  backupImportError,
  backupImportResult,
  onBackupImportFileChange,
  onConfirmBackupImport,
  onClearBackupImport,
  onSignInWithGoogle,
  onSignOut,
}: ProfileViewProps) {
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);
  const isAnonymousUser = firebaseUser?.isAnonymous ?? false;
  const hasEmailPasswordProvider =
    firebaseUser?.providerData?.some((provider) => provider.providerId === "password") ??
    false;

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

            <div className={`${theme.innerPanel} mt-6 p-4`}>
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-bold text-neutral-950">
                    Email / Password
                  </p>

                  <p className="mt-1 text-sm font-semibold text-neutral-500">
                    {isAnonymousUser
                      ? "Φτιάξε κανονικό account χωρίς να χάσεις τα υπάρχοντα δεδομένα."
                      : hasEmailPasswordProvider
                        ? "Αυτός ο λογαριασμός μπορεί να χρησιμοποιήσει email/password."
                        : "Μπορείς να συνδεθείς με υπάρχον email/password account."}
                  </p>
                </div>

                <span className={theme.darkBadge}>
                  {hasEmailPasswordProvider ? "Email enabled" : "Optional"}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="block text-sm font-bold text-neutral-600">
                    Email
                  </span>

                  <input
                    type="email"
                    value={emailDraft}
                    onChange={(event) => onEmailDraftChange(event.target.value)}
                    placeholder="you@example.com"
                    className={theme.inputFull}
                  />
                </label>

                <label className="space-y-2">
                  <span className="block text-sm font-bold text-neutral-600">
                    Password
                  </span>

                  <input
                    type="password"
                    value={passwordDraft}
                    onChange={(event) => onPasswordDraftChange(event.target.value)}
                    placeholder="Τουλάχιστον 6 χαρακτήρες"
                    className={theme.inputFull}
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onCreateAccountWithEmailPassword}
                  disabled={authActionLoading || !firebaseUser}
                  className={theme.primaryButton}
                >
                  {isAnonymousUser ? "Upgrade anonymous account" : "Create account"}
                </button>

                <button
                  type="button"
                  onClick={onSignInWithEmailPassword}
                  disabled={authActionLoading}
                  className={theme.secondaryButton}
                >
                  Sign in with email
                </button>

                <button
                  type="button"
                  onClick={onSendPasswordReset}
                  disabled={authActionLoading}
                  className={theme.secondaryButton}
                >
                  Reset password
                </button>
              </div>

              {authSuccessMessage && (
                <p className="mt-4 rounded-xl border border-neutral-300 bg-stone-100 p-3 text-sm font-semibold text-neutral-800">
                  {authSuccessMessage}
                </p>
              )}
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
                    onThemePreferenceChange(event.target.value as AppThemeKey)
                  }
                  className={theme.inputFull}
                >
                  {appThemeOptions.map((themeOption) => (
                    <option key={themeOption.key} value={themeOption.key}>
                      {themeOption.label}
                    </option>
                  ))}
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

              <div className={`${theme.innerPanel} mt-4 p-4`}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-neutral-950">
                      Backup import
                    </p>

                    <p className="mt-1 text-sm font-semibold text-neutral-500">
                      Διάλεξε Tenka Musō backup JSON και κάνε safe merge import
                      χωρίς να σβηστούν υπάρχοντα δεδομένα.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => backupFileInputRef.current?.click()}
                      disabled={!firebaseUser || backupImporting}
                      className={theme.secondaryButton}
                    >
                      Choose JSON
                    </button>

                    <input
                      ref={backupFileInputRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      onChange={(event) => {
                        void onBackupImportFileChange(
                          event.target.files?.[0] ?? null
                        );
                        event.currentTarget.value = "";
                      }}
                    />
                  </div>
                </div>

                {backupImportPreview && (
                  <div className="mt-4 rounded-xl border border-neutral-300 bg-stone-50/75 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-black text-neutral-950">
                          {backupImportPreview.fileName}
                        </p>

                        <p className="mt-1 text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                          {backupImportPreview.exportedAt
                            ? `Exported: ${backupImportPreview.exportedAt}`
                            : "Export date unknown"}
                        </p>
                      </div>

                      <span className={theme.darkBadge}>Preview ready</span>
                    </div>

                    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <span className={theme.badge}>
                        Tasks: {backupImportPreview.counts.tasks}
                      </span>
                      <span className={theme.badge}>
                        Daily notes: {backupImportPreview.counts.dailyNotes}
                      </span>
                      <span className={theme.badge}>
                        Categories: {backupImportPreview.counts.customCategories}
                      </span>
                      <span className={theme.badge}>
                        Settings: {backupImportPreview.counts.userSettings}
                      </span>
                      <span className={theme.badge}>
                        Goals: {backupImportPreview.counts.goals}
                      </span>
                      <span className={theme.badge}>
                        Projects: {backupImportPreview.counts.projects}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={onConfirmBackupImport}
                        disabled={!firebaseUser || backupImporting}
                        className={theme.primaryButton}
                      >
                        {backupImporting ? "Importing..." : "Confirm safe import"}
                      </button>

                      <button
                        type="button"
                        onClick={onClearBackupImport}
                        disabled={backupImporting}
                        className={theme.secondaryButton}
                      >
                        Clear
                      </button>
                    </div>

                    <p className="mt-3 text-xs font-semibold text-neutral-500">
                      Safe import: δημιουργεί νέα tasks/goals/projects, κάνει
                      skip υπάρχοντα daily notes ίδιας ημερομηνίας και skip
                      υπάρχουσες κατηγορίες με ίδιο όνομα.
                    </p>
                  </div>
                )}

                {backupImportError && (
                  <p className="mt-4 rounded-xl border border-neutral-300 bg-stone-100 p-3 text-sm font-semibold text-neutral-800">
                    {backupImportError}
                  </p>
                )}

                {backupImportResult && (
                  <div className="mt-4 rounded-xl border border-neutral-300 bg-stone-50/75 p-4">
                    <p className="text-sm font-black text-neutral-950">
                      Import completed
                    </p>

                    <p className="mt-2 text-sm font-semibold text-neutral-600">
                      Imported: {backupImportResult.imported.tasks} tasks, {" "}
                      {backupImportResult.imported.dailyNotes} daily notes, {" "}
                      {backupImportResult.imported.customCategories} categories, {" "}
                      {backupImportResult.imported.userSettings} settings, {" "}
                      {backupImportResult.imported.goals} goals, {" "}
                      {backupImportResult.imported.projects} projects.
                    </p>

                    <p className="mt-2 text-xs font-semibold text-neutral-500">
                      Skipped: {backupImportResult.skipped.dailyNotes ?? 0} daily
                      notes and {backupImportResult.skipped.customCategories ?? 0}
                      categories because they already existed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}