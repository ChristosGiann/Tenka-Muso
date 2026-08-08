import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "../lib/firebase";
import type { View } from "../types";

export const defaultUserSettings = {
  defaultCategory: "Δουλειά",
  defaultView: "today" as View,
  themePreference: "manga-grayscale",
};

export type UserSettings = typeof defaultUserSettings;

function isValidView(value: unknown): value is View {
  return (
    typeof value === "string" &&
    ["today", "week", "month", "stats", "backlog", "search", "profile"].includes(
      value
    )
  );
}

export function useUserSettings(firebaseUser: User | null) {
  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setUserSettings(defaultUserSettings);
      setSettingsLoading(true);
      setSettingsSaved(false);
      setSettingsError(null);
      return;
    }

    setSettingsLoading(true);

    const settingsRef = doc(db, "users", firebaseUser.uid, "settings", "app");

    const unsubscribe = onSnapshot(
      settingsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setUserSettings(defaultUserSettings);
          setSettingsLoading(false);
          return;
        }

        const data = snapshot.data();

        setUserSettings({
          defaultCategory:
            typeof data.defaultCategory === "string"
              ? data.defaultCategory
              : defaultUserSettings.defaultCategory,
          defaultView: isValidView(data.defaultView)
            ? data.defaultView
            : defaultUserSettings.defaultView,
          themePreference:
            typeof data.themePreference === "string"
              ? data.themePreference
              : defaultUserSettings.themePreference,
        });

        setSettingsLoading(false);
      },
      (error) => {
        console.error("Firestore user settings listener failed:", error);
        setSettingsError("Δεν μπόρεσαν να φορτωθούν τα settings.");
        setSettingsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  function updateDefaultCategory(value: string) {
    setUserSettings((currentSettings) => ({
      ...currentSettings,
      defaultCategory: value,
    }));
    setSettingsSaved(false);
  }

  function updateDefaultView(value: View) {
    setUserSettings((currentSettings) => ({
      ...currentSettings,
      defaultView: value,
    }));
    setSettingsSaved(false);
  }

  function updateThemePreference(value: string) {
    setUserSettings((currentSettings) => ({
      ...currentSettings,
      themePreference: value,
    }));
    setSettingsSaved(false);
  }

  async function saveUserSettings() {
    if (!firebaseUser) return;

    setSettingsSaving(true);
    setSettingsSaved(false);
    setSettingsError(null);

    try {
      const settingsRef = doc(db, "users", firebaseUser.uid, "settings", "app");

      await setDoc(
        settingsRef,
        {
          defaultCategory: userSettings.defaultCategory,
          defaultView: userSettings.defaultView,
          themePreference: userSettings.themePreference,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setSettingsSaved(true);
    } catch (error) {
      console.error("Save user settings failed:", error);
      setSettingsError("Δεν μπόρεσαν να αποθηκευτούν τα settings.");
    } finally {
      setSettingsSaving(false);
    }
  }

  return {
    userSettings,
    settingsLoading,
    settingsSaving,
    settingsSaved,
    settingsError,
    updateDefaultCategory,
    updateDefaultView,
    updateThemePreference,
    saveUserSettings,
  };
}