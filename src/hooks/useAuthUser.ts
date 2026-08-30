import { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  linkWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { auth } from "../lib/firebase";

function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Κάτι πήγε λάθος με τη σύνδεση.";
}

function getAuthErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    return (error as { code: string }).code;
  }

  return null;
}

export function useAuthUser() {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authActionLoading, setAuthActionLoading] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [passwordDraft, setPasswordDraft] = useState("");
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);

  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [profileNameSaving, setProfileNameSaving] = useState(false);
  const [profileNameSaved, setProfileNameSaved] = useState(false);
  const [profileNameError, setProfileNameError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthError(null);

      if (user) {
        setFirebaseUser(user);
        setAuthLoading(false);
        return;
      }

      setFirebaseUser(null);
      setProfileNameDraft("");
      setProfileNameSaved(false);
      setProfileNameError(null);

      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        setAuthError("Δεν μπόρεσε να γίνει anonymous σύνδεση.");
        setAuthLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setProfileNameDraft(firebaseUser?.displayName ?? "");
    setProfileNameSaved(false);
    setProfileNameError(null);
  }, [firebaseUser?.uid, firebaseUser?.displayName]);

  async function signInWithGoogle() {
    if (authActionLoading) return;

    setAuthActionLoading(true);
    setAuthError(null);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });

    try {
      const result = await signInWithPopup(auth, provider);

      console.log("Google sign-in user:", {
        uid: result.user.uid,
        email: result.user.email,
        isAnonymous: result.user.isAnonymous,
      });
    } catch (error) {
      console.error("Google sign-in failed:", error);

      const errorCode = getAuthErrorCode(error);

      if (errorCode === "auth/popup-blocked") {
        setAuthError(
          "Ο browser μπλόκαρε το Google popup. Πάτα allow popups για αυτό το site και δοκίμασε ξανά."
        );
      } else if (errorCode === "auth/popup-closed-by-user") {
        setAuthError("Το Google popup έκλεισε πριν ολοκληρωθεί η σύνδεση.");
      } else if (errorCode === "auth/cancelled-popup-request") {
        setAuthError(
          "Άνοιξε δεύτερο login popup. Πάτα το κουμπί μία φορά και περίμενε."
        );
      } else {
        setAuthError(getAuthErrorMessage(error));
      }
    } finally {
      setAuthActionLoading(false);
    }
  }

  function updateEmailDraft(value: string) {
    setEmailDraft(value);
    setAuthError(null);
    setAuthSuccessMessage(null);
  }

  function updatePasswordDraft(value: string) {
    setPasswordDraft(value);
    setAuthError(null);
    setAuthSuccessMessage(null);
  }

  function validateEmailPasswordForm() {
    const email = emailDraft.trim();

    if (!email) {
      setAuthError("Βάλε email.");
      return null;
    }

    if (passwordDraft.length < 6) {
      setAuthError("Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.");
      return null;
    }

    return {
      email,
      password: passwordDraft,
    };
  }

  async function createAccountWithEmailPassword() {
    if (authActionLoading) return;

    const credentials = validateEmailPasswordForm();
    if (!credentials) return;

    setAuthActionLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);

    try {
      if (firebaseUser?.isAnonymous) {
        const emailCredential = EmailAuthProvider.credential(
          credentials.email,
          credentials.password
        );

        const result = await linkWithCredential(firebaseUser, emailCredential);

        console.log("Anonymous account upgraded to email/password:", {
          uid: result.user.uid,
          email: result.user.email,
          isAnonymous: result.user.isAnonymous,
        });

        await result.user.reload();
        setFirebaseUser(auth.currentUser);
        setPasswordDraft("");
        setAuthSuccessMessage("Ο anonymous λογαριασμός έγινε email/password account.");

        return;
      }

      if (firebaseUser && !firebaseUser.isAnonymous) {
        setAuthError("Είσαι ήδη συνδεδεμένος με κανονικό λογαριασμό.");
        return;
      }

      const result = await createUserWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      console.log("Email/password account created:", {
        uid: result.user.uid,
        email: result.user.email,
        isAnonymous: result.user.isAnonymous,
      });

      setPasswordDraft("");
      setAuthSuccessMessage("Ο λογαριασμός δημιουργήθηκε.");
    } catch (error) {
      console.error("Email/password sign-up failed:", error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function signInWithEmailPassword() {
    if (authActionLoading) return;

    const credentials = validateEmailPasswordForm();
    if (!credentials) return;

    setAuthActionLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      console.log("Email/password sign-in user:", {
        uid: result.user.uid,
        email: result.user.email,
        isAnonymous: result.user.isAnonymous,
      });

      setPasswordDraft("");
      setAuthSuccessMessage("Συνδέθηκες με email/password.");
    } catch (error) {
      console.error("Email/password sign-in failed:", error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function sendPasswordReset() {
    if (authActionLoading) return;

    const email = emailDraft.trim();

    if (!email) {
      setAuthError("Βάλε email για reset password.");
      return;
    }

    setAuthActionLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);

    try {
      await sendPasswordResetEmail(auth, email);
      setAuthSuccessMessage("Στάλθηκε email για reset password.");
    } catch (error) {
      console.error("Password reset failed:", error);
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function signOutUser() {
    setAuthError(null);
    setProfileNameDraft("");
    setProfileNameSaved(false);
    setProfileNameError(null);

    await signOut(auth);
  }

  function updateProfileNameDraft(value: string) {
    setProfileNameDraft(value);
    setProfileNameSaved(false);
  }

  async function saveProfileName() {
    if (!firebaseUser) return;

    setProfileNameSaving(true);
    setProfileNameSaved(false);
    setProfileNameError(null);

    try {
      const trimmedName = profileNameDraft.trim();

      await updateProfile(firebaseUser, {
        displayName: trimmedName || null,
      });

      await firebaseUser.reload();

      setFirebaseUser(auth.currentUser);
      setProfileNameSaved(true);
    } catch (error) {
      console.error("Save profile name failed:", error);
      setProfileNameError("Δεν μπόρεσε να αποθηκευτεί το όνομα.");
    } finally {
      setProfileNameSaving(false);
    }
  }

  return {
    firebaseUser,
    authLoading,
    authError,
    emailDraft,
    passwordDraft,
    authSuccessMessage,
    updateEmailDraft,
    updatePasswordDraft,
    createAccountWithEmailPassword,
    signInWithEmailPassword,
    sendPasswordReset,
    authActionLoading,
    profileNameDraft,
    profileNameSaving,
    profileNameSaved,
    profileNameError,
    updateProfileNameDraft,
    signInWithGoogle,
    signOutUser,
    saveProfileName,
  };
}