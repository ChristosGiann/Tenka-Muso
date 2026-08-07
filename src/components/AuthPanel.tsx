import type { User } from "firebase/auth";

import { theme } from "../styles/theme";

type AuthPanelProps = {
  firebaseUser: User | null;
  authLoading: boolean;
  authActionLoading: boolean;
  authError: string | null;
  onSignInWithGoogle: () => void | Promise<void>;
  onSignOut: () => void | Promise<void>;
};

export function AuthPanel({
  firebaseUser,
  authLoading,
  authActionLoading,
  authError,
  onSignInWithGoogle,
  onSignOut,
}: AuthPanelProps) {
  const isAnonymousUser = firebaseUser?.isAnonymous ?? false;

  const userLabel = firebaseUser
    ? firebaseUser.displayName ||
      firebaseUser.email ||
      `Anonymous ${firebaseUser.uid.slice(0, 8)}...`
    : "Δεν υπάρχει Firebase user.";

  return (
    <div className={`${theme.cardSoft} mb-6`}>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-neutral-500">Account</p>

          <p className="mt-1 font-bold text-neutral-950">
            {authLoading
              ? "Σύνδεση με Firebase..."
              : isAnonymousUser
                ? "Anonymous mode"
                : userLabel}
          </p>

          {!authLoading && firebaseUser?.email && (
            <p className="text-sm font-semibold text-neutral-500">
              {firebaseUser.email}
            </p>
          )}

          {!authLoading && isAnonymousUser && (
            <p className="text-sm font-semibold text-neutral-500">
              Τα δεδομένα είναι προσωρινά συνδεδεμένα με αυτό το browser/device.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
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
      </div>

      {authError && (
        <p className="mt-3 rounded-xl border border-neutral-300 bg-stone-100 p-3 text-sm font-semibold text-neutral-800">
          {authError}
        </p>
      )}
    </div>
  );
}