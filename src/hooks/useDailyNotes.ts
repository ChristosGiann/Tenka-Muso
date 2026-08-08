import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";

export function useDailyNotes(firebaseUser: User | null, selectedDate: string) {
  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [dailyNoteDraft, setDailyNoteDraft] = useState("");
  const [dailyNotesLoading, setDailyNotesLoading] = useState(true);
  const [dailyNoteSaving, setDailyNoteSaving] = useState(false);
  const [dailyNoteSaved, setDailyNoteSaved] = useState(false);
  const [dailyNoteError, setDailyNoteError] = useState<string | null>(null);

  useEffect(() => {
    if (!firebaseUser) {
      setDailyNotes({});
      setDailyNoteDraft("");
      setDailyNotesLoading(true);
      setDailyNoteSaved(false);
      setDailyNoteError(null);
      return;
    }

    setDailyNotesLoading(true);

    const dailyNotesRef = collection(
      db,
      "users",
      firebaseUser.uid,
      "dailyNotes"
    );

    const unsubscribe = onSnapshot(
      dailyNotesRef,
      (snapshot) => {
        const notesByDate: Record<string, string> = {};

        snapshot.docs.forEach((docSnapshot) => {
          const data = docSnapshot.data();

          notesByDate[docSnapshot.id] =
            typeof data.content === "string" ? data.content : "";
        });

        setDailyNotes(notesByDate);
        setDailyNotesLoading(false);
      },
      (error) => {
        console.error("Firestore daily notes listener failed:", error);
        setDailyNoteError("Δεν μπόρεσαν να φορτωθούν τα daily notes.");
        setDailyNotesLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    setDailyNoteDraft(dailyNotes[selectedDate] ?? "");
    setDailyNoteSaved(false);
    setDailyNoteError(null);
  }, [dailyNotes, selectedDate]);

  function updateDailyNoteDraft(value: string) {
    setDailyNoteDraft(value);
    setDailyNoteSaved(false);
  }

  async function saveDailyNote() {
    if (!firebaseUser) return;

    setDailyNoteSaving(true);
    setDailyNoteSaved(false);
    setDailyNoteError(null);

    try {
      const dailyNoteRef = doc(
        db,
        "users",
        firebaseUser.uid,
        "dailyNotes",
        selectedDate
      );

      await setDoc(
        dailyNoteRef,
        {
          date: selectedDate,
          content: dailyNoteDraft,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setDailyNoteSaved(true);
    } catch (error) {
      console.error("Save daily note failed:", error);
      setDailyNoteError("Δεν μπόρεσε να αποθηκευτεί το daily note.");
    } finally {
      setDailyNoteSaving(false);
    }
  }

  return {
    dailyNotes,
    dailyNoteDraft,
    dailyNotesLoading,
    dailyNoteSaving,
    dailyNoteSaved,
    dailyNoteError,
    updateDailyNoteDraft,
    saveDailyNote,
  };
}