import { useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "./lib/firebase";
import type {
  BacklogPriority,
  BacklogStatus,
  ConfirmModalState,
  CustomCategory,
  Task,
  TaskType,
  View,
} from "./types";

import { defaultCategories } from "./constants/categories";
import {
  addDays,
  getCalendarDays,
  getMonthFromDate,
  getToday,
  getWeekDatesFromDate,
  weekDays,
} from "./utils/date";
import { formatMinutes, getDurationMinutes } from "./utils/time";
import { buildStats } from "./utils/stats";
import { theme } from "./styles/theme";
import "./App.css";

import { ConfirmModal } from "./components/ConfirmModal";
import { StatCards } from "./components/StatCards";
import { CategoryStats } from "./components/CategoryStats";

const defaultUserSettings = {
  defaultCategory: "Δουλειά",
  defaultView: "today" as View,
  themePreference: "manga-grayscale",
};

function isValidView(value: unknown): value is View {
  return (
    typeof value === "string" &&
    ["today", "week", "month", "stats", "backlog", "profile"].includes(value)
  );
}

function App() {
  const [activeView, setActiveView] = useState<View>("today");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedWeekDate, setSelectedWeekDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(getMonthFromDate(getToday()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getToday());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [dailyNotes, setDailyNotes] = useState<Record<string, string>>({});
  const [dailyNoteDraft, setDailyNoteDraft] = useState("");
  const [dailyNotesLoading, setDailyNotesLoading] = useState(true);
  const [dailyNoteSaving, setDailyNoteSaving] = useState(false);
  const [dailyNoteSaved, setDailyNoteSaved] = useState(false);
  const [dailyNoteError, setDailyNoteError] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    type: "task" as TaskType,
    category: "Δουλειά",
    date: getToday(),
    startTime: "",
    endTime: "",
    notes: "",
    priority: "medium" as BacklogPriority,
    backlogStatus: "idea" as BacklogStatus,
  });

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showCategories, setShowCategories] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const [backlogCategoryFilter, setBacklogCategoryFilter] = useState("all");

  const [backlogPriorityFilter, setBacklogPriorityFilter] = useState<
    BacklogPriority | "all"
  >("all");

  const [backlogStatusFilter, setBacklogStatusFilter] = useState<
    BacklogStatus | "all"
  >("all");

  const [backlogSort, setBacklogSort] = useState<
    "newest" | "priority" | "category"
  >("newest");

  const customCategoryNames = customCategories.map((category) => category.name);

  const categories = Array.from(
    new Set([...defaultCategories, ...customCategoryNames])
  );

  const dayTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.date === selectedDate && task.type !== "backlog"
    );
  }, [tasks, selectedDate]);

  const monthTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.date.startsWith(selectedMonth) && task.type !== "backlog"
    );
  }, [tasks, selectedMonth]);

  const weekDates = useMemo(() => {
    return getWeekDatesFromDate(selectedWeekDate);
  }, [selectedWeekDate]);

  const weekTasks = useMemo(() => {
    return tasks.filter(
      (task) => weekDates.includes(task.date) && task.type !== "backlog"
    );
  }, [tasks, weekDates]);

  const weekDaySummaries = useMemo(() => {
    return weekDates.map((date) => {
      const tasksForDay = tasks.filter(
        (task) => task.date === date && task.type !== "backlog"
      );

      const doneTasksForDay = tasksForDay.filter(
        (task) => task.status === "done"
      );

      const doneMinutes = doneTasksForDay.reduce((sum, task) => {
        return sum + getDurationMinutes(task.startTime, task.endTime);
      }, 0);

      return {
        date,
        totalTasks: tasksForDay.length,
        doneTasks: doneTasksForDay.length,
        doneMinutes,
      };
    });
  }, [tasks, weekDates]);

  const backlogItems = useMemo(() => {
    return tasks.filter((task) => task.type === "backlog");
  }, [tasks]);

  const filteredBacklogItems = useMemo(() => {
    const priorityWeight: Record<BacklogPriority, number> = {
      high: 3,
      medium: 2,
      low: 1,
    };

    const filteredItems = backlogItems.filter((item) => {
      const matchesCategory =
        backlogCategoryFilter === "all" || item.category === backlogCategoryFilter;

      const matchesPriority =
        backlogPriorityFilter === "all" ||
        (item.priority ?? "medium") === backlogPriorityFilter;

      const matchesStatus =
        backlogStatusFilter === "all" ||
        (item.backlogStatus ?? "idea") === backlogStatusFilter;

      return matchesCategory && matchesPriority && matchesStatus;
    });

    return [...filteredItems].sort((firstItem, secondItem) => {
      if (backlogSort === "priority") {
        return (
          priorityWeight[secondItem.priority ?? "medium"] -
          priorityWeight[firstItem.priority ?? "medium"]
        );
      }

      if (backlogSort === "category") {
        return firstItem.category.localeCompare(secondItem.category);
      }

      return 0;
    });
  }, [
    backlogItems,
    backlogCategoryFilter,
    backlogPriorityFilter,
    backlogStatusFilter,
    backlogSort,
  ]);

  const todayStats = buildStats(dayTasks, categories);
  const monthStats = buildStats(monthTasks, categories);
  const weekStats = buildStats(weekTasks, categories);
  const allTimeStats = buildStats(tasks, categories);

  const selectedCalendarTasks = useMemo(() => {
    return tasks.filter(
      (task) => task.date === selectedCalendarDate && task.type !== "backlog"
    );
  }, [tasks, selectedCalendarDate]);

  const selectedCalendarStats = buildStats(selectedCalendarTasks, categories);

  const calendarDays = useMemo(() => {
    return getCalendarDays(selectedMonth);
  }, [selectedMonth]);

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  const [profileNameDraft, setProfileNameDraft] = useState("");
  const [profileNameSaving, setProfileNameSaving] = useState(false);
  const [profileNameSaved, setProfileNameSaved] = useState(false);
  const [profileNameError, setProfileNameError] = useState<string | null>(null);

  const [userSettings, setUserSettings] = useState(defaultUserSettings);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthError(null);

      if (user) {
        setFirebaseUser(user);
        setAuthLoading(false);
        setTasksLoading(true);
        return;
      }

      setFirebaseUser(null);
      setTasks([]);
      setCustomCategories([]);
      setDailyNotes({});
      setDailyNoteDraft("");
      setUserSettings(defaultUserSettings);
      setTasksLoading(true);
      setDailyNotesLoading(true);
      setSettingsLoading(true);
      setProfileNameDraft("");
      setProfileNameSaved(false);
      setProfileNameError(null);

      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        setAuthError("Δεν μπόρεσε να γίνει anonymous σύνδεση.");
        setAuthLoading(false);
        setTasksLoading(false);
        setDailyNotesLoading(false);
        setSettingsLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

  function getAuthErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "Κάτι πήγε λάθος με τη σύνδεση.";
  }

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
        setAuthError("Άνοιξε δεύτερο login popup. Πάτα το κουμπί μία φορά και περίμενε.");
      } else {
        setAuthError(getAuthErrorMessage(error));
      }
    } finally {
      setAuthActionLoading(false);
    }
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

  async function handleSignOut() {
    setAuthError(null);
    setTasks([]);
    setCustomCategories([]);
    setDailyNotes({});
    setDailyNoteDraft("");
    setTasksLoading(true);
    setDailyNotesLoading(true);
    setUserSettings(defaultUserSettings);
    setSettingsLoading(true);
    setSettingsSaved(false);
    setSettingsError(null);
    setProfileNameDraft("");
    setProfileNameSaved(false);
    setProfileNameError(null);

    await signOut(auth);
  }

  useEffect(() => {
    if (!firebaseUser) return;

    const tasksRef = collection(db, "users", firebaseUser.uid, "tasks");
    const tasksQuery = query(tasksRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      tasksQuery,
      (snapshot) => {
        const firestoreTasks: Task[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();

          return {
            id: docSnapshot.id,
            title: data.title ?? "",
            type: data.type ?? "task",
            category: data.category ?? "Προσωπικά",
            date: data.date ?? getToday(),
            startTime: data.startTime ?? "",
            endTime: data.endTime ?? "",
            status: data.status ?? "pending",
            notes: data.notes ?? "",
            priority: data.priority ?? "medium",
            backlogStatus: data.backlogStatus ?? "idea",
          };
        });

        setTasks(firestoreTasks);
        setTasksLoading(false);
      },
      (error) => {
        console.error("Firestore tasks listener failed:", error);
        setTasksLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;

    const categoriesRef = collection(db, "users", firebaseUser.uid, "categories");
    const categoriesQuery = query(categoriesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(
      categoriesQuery,
      (snapshot) => {
        const firestoreCategories: CustomCategory[] = snapshot.docs
          .map((docSnapshot) => {
            const data = docSnapshot.data();

            return {
              id: docSnapshot.id,
              name: data.name as string,
            };
          })
          .filter((category) => Boolean(category.name));

        setCustomCategories(firestoreCategories);
      },
      (error) => {
        console.error("Firestore categories listener failed:", error);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;

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
    if (!firebaseUser) return;

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

  useEffect(() => {
    setDailyNoteDraft(dailyNotes[selectedDate] ?? "");
    setDailyNoteSaved(false);
    setDailyNoteError(null);
  }, [dailyNotes, selectedDate]);

  useEffect(() => {
    setProfileNameDraft(firebaseUser?.displayName ?? "");
    setProfileNameSaved(false);
    setProfileNameError(null);
  }, [firebaseUser?.uid, firebaseUser?.displayName]);

  async function saveTask() {
    if (!firebaseUser) return;
    if (!form.title.trim()) return;

    if (editingTaskId) {
      const taskRef = doc(db, "users", firebaseUser.uid, "tasks", editingTaskId);

      await updateDoc(taskRef, {
        title: form.title.trim(),
        type: form.type,
        category: form.category,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        notes: form.notes.trim(),
        priority: form.priority,
        backlogStatus: form.backlogStatus,
        updatedAt: serverTimestamp(),
      });

      setEditingTaskId(null);
    } else {
      const tasksRef = collection(db, "users", firebaseUser.uid, "tasks");

      await addDoc(tasksRef, {
        title: form.title.trim(),
        type: form.type,
        category: form.category,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        status: "pending",
        notes: form.notes.trim(),
        priority: form.priority,
        backlogStatus: form.backlogStatus,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    setForm({
      title: "",
      type: "task",
      category: userSettings.defaultCategory,
      date: selectedDate,
      startTime: "",
      endTime: "",
      notes: "",
      priority: "medium",
      backlogStatus: "idea",
    });
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

  async function toggleDone(taskId: string) {
    if (!firebaseUser) return;

    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (!task) return;

    const taskRef = doc(db, "users", firebaseUser.uid, "tasks", taskId);

    await updateDoc(taskRef, {
      status: task.status === "done" ? "pending" : "done",
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteTask(taskId: string) {
    if (!firebaseUser) return;

    const taskRef = doc(db, "users", firebaseUser.uid, "tasks", taskId);
    await deleteDoc(taskRef);
  }

  function requestDeleteTask(task: Task) {
    setConfirmModal({
      title: "Διαγραφή task",
      message: `Θέλεις σίγουρα να διαγράψεις το "${task.title}"; Αυτή η ενέργεια δεν αναιρείται.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
      onConfirm: async () => {
        await deleteTask(task.id);
      },
    });
  }

  async function addCategory() {
    if (!firebaseUser) return;

    const trimmedName = newCategoryName.trim();
    if (!trimmedName) return;

    const categoryAlreadyExists = categories.some(
      (category) => category.toLowerCase() === trimmedName.toLowerCase()
    );

    if (categoryAlreadyExists) {
      setNewCategoryName("");
      return;
    }

    const categoriesRef = collection(db, "users", firebaseUser.uid, "categories");

    await addDoc(categoriesRef, {
      name: trimmedName,
      createdAt: serverTimestamp(),
    });

    setNewCategoryName("");
    setForm((currentForm) => ({
      ...currentForm,
      category: trimmedName,
    }));
  }

  function requestDeleteCategory(category: CustomCategory) {
    const categoryIsUsed = tasks.some((task) => task.category === category.name);

    if (categoryIsUsed) {
      setConfirmModal({
        title: "Δεν μπορεί να διαγραφεί",
        message: `Η κατηγορία "${category.name}" χρησιμοποιείται ήδη σε task. Άλλαξε πρώτα ή διέγραψε τα tasks που τη χρησιμοποιούν.`,
        confirmText: "ΟΚ",
        onConfirm: () => { },
      });

      return;
    }

    setConfirmModal({
      title: "Διαγραφή κατηγορίας",
      message: `Θέλεις σίγουρα να διαγράψεις την κατηγορία "${category.name}";`,
      confirmText: "Delete",
      cancelText: "Cancel",
      danger: true,
      onConfirm: () => deleteCategory(category),
    });
  }

  async function deleteCategory(category: CustomCategory) {
    if (!firebaseUser) return;

    const categoryRef = doc(
      db,
      "users",
      firebaseUser.uid,
      "categories",
      category.id
    );

    await deleteDoc(categoryRef);

    if (form.category === category.name) {
      setForm((currentForm) => ({
        ...currentForm,
        category: userSettings.defaultCategory,
      }));
    }
  }

  function startEditTask(task: Task) {
    setEditingTaskId(task.id);

    setForm({
      title: task.title,
      type: task.type,
      category: task.category,
      date: task.date,
      startTime: task.startTime,
      endTime: task.endTime,
      notes: task.notes,
      priority: task.priority ?? "medium",
      backlogStatus: task.backlogStatus ?? "idea",
    });
  }

  function cancelEditTask() {
    setEditingTaskId(null);

    setForm({
      title: "",
      type: "task",
      category: userSettings.defaultCategory,
      date: selectedDate,
      startTime: "",
      endTime: "",
      notes: "",
      priority: "medium",
      backlogStatus: "idea",
    });
  }

  function renderTaskList(taskList: Task[], emptyMessage: string) {
    return (
      <div className="space-y-3">
        {taskList.length === 0 && (
          <p className={`${theme.innerPanel} p-4 text-neutral-500`}>
            {emptyMessage}
          </p>
        )}

        {taskList.map((task) => {
          const duration = getDurationMinutes(task.startTime, task.endTime);

          return (
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-300/80 bg-stone-50/75 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={theme.badge}>{task.category}</span>
                  <span className={theme.badge}>{task.type}</span>

                  {duration > 0 && (
                    <span className={theme.darkBadge}>
                      {formatMinutes(duration)}
                    </span>
                  )}
                </div>

                <h4 className="mt-2 text-lg font-bold text-neutral-950">
                  {task.status === "done" ? "✓ " : ""}
                  {task.title}
                </h4>

                <p className="text-sm font-semibold text-neutral-500">
                  {task.startTime && task.endTime
                    ? `${task.date} • ${task.startTime} - ${task.endTime}`
                    : task.date}
                </p>

                {task.notes && (
                  <p className="mt-2 text-sm text-neutral-600">{task.notes}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => startEditTask(task)}
                  className={theme.smallButton}
                >
                  Edit
                </button>

                <button
                  onClick={() => toggleDone(task.id)}
                  className={
                    task.status === "done"
                      ? theme.smallButton
                      : "rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50 transition hover:bg-neutral-800"
                  }
                >
                  {task.status === "done" ? "Undo" : "Done"}
                </button>

                <button
                  onClick={() => requestDeleteTask(task)}
                  className={theme.dangerButton}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderForm() {
    return (
      <div className={theme.card}>
        <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
          {editingTaskId ? "Επεξεργασία task" : "Νέο task / routine / backlog item"}
        </h3>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Τίτλος π.χ. Προπόνηση πόδια"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            className={theme.input}
          />

          <select
            value={form.type}
            onChange={(event) =>
              setForm({
                ...form,
                type: event.target.value as TaskType,
              })
            }
            className={theme.input}
          >
            <option value="task">Task</option>
            <option value="routine">Routine</option>
            <option value="backlog">Backlog</option>
          </select>

          <select
            value={form.category}
            onChange={(event) =>
              setForm({ ...form, category: event.target.value })
            }
            className={theme.input}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Νέα κατηγορία π.χ. Gaming"
              className={`${theme.input} min-w-0 flex-1`}
            />

            <button
              type="button"
              onClick={addCategory}
              className={theme.secondaryButton}
            >
              Add
            </button>

            <button
              type="button"
              onClick={() => setShowCategories((currentValue) => !currentValue)}
              className={theme.secondaryButton}
            >
              {showCategories ? "Hide" : "Show"}
            </button>
          </div>
          {showCategories && (
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-semibold text-neutral-500">
                Custom categories
              </p>

              {customCategories.length === 0 ? (
                <p className={`${theme.innerPanel} p-4 text-sm font-semibold text-neutral-500`}>
                  Δεν έχεις custom categories ακόμα.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {customCategories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-stone-100 px-3 py-2 text-sm font-bold text-neutral-700"
                    >
                      {category.name}

                      <button
                        type="button"
                        onClick={() => requestDeleteCategory(category)}
                        className="rounded-full bg-neutral-950 px-2 py-0.5 text-xs font-bold text-stone-50 hover:bg-neutral-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <input
            type="date"
            value={form.date}
            onChange={(event) =>
              setForm({ ...form, date: event.target.value })
            }
            className={theme.input}
          />

          {form.type === "backlog" && (
            <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  Priority
                </span>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as BacklogPriority,
                    })
                  }
                  className={theme.inputFull}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  Backlog status
                </span>

                <select
                  value={form.backlogStatus}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      backlogStatus: event.target.value as BacklogStatus,
                    })
                  }
                  className={theme.inputFull}
                >
                  <option value="idea">Idea</option>
                  <option value="someday">Someday</option>
                  <option value="planned">Planned</option>
                </select>
              </label>
            </div>
          )}

          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-bold text-neutral-600">
                Ώρα έναρξης
              </span>

              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm({ ...form, startTime: event.target.value })
                }
                className={theme.inputFull}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-bold text-neutral-600">
                Ώρα λήξης
              </span>

              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm({ ...form, endTime: event.target.value })
                }
                className={theme.inputFull}
              />
            </label>
          </div>

          <textarea
            placeholder="Σημειώσεις"
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
            className={`${theme.input} min-h-24 md:col-span-2`}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={saveTask}
            className={theme.primaryButton}
          >
            {editingTaskId ? "Update task" : "+ Add"}
          </button>

          {editingTaskId && (
            <button
              onClick={cancelEditTask}
              className={theme.secondaryButton}
            >
              Cancel edit
            </button>
          )}
        </div>
      </div>
    );
  }

  function renderAuthPanel() {
    const isAnonymousUser = firebaseUser?.isAnonymous ?? false;
    const userLabel = firebaseUser
      ? firebaseUser.displayName || firebaseUser.email || `Anonymous ${firebaseUser.uid.slice(0, 8)}...`
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
                onClick={signInWithGoogle}
                disabled={authActionLoading}
                className={theme.primaryButton}
              >
                {authActionLoading ? "Opening Google..." : "Sign in with Google"}
              </button>
            )}

            {!authLoading && firebaseUser && !isAnonymousUser && (
              <button
                type="button"
                onClick={handleSignOut}
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

  function renderDailyNoteCard() {
    return (
      <div className={theme.card}>
        <div className="mb-5">
          <p className={theme.eyebrow}>Daily Journal</p>

          <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
            Σημείωση ημέρας
          </h3>

          <p className="mt-3 text-sm font-semibold text-neutral-500">
            {selectedDate}
          </p>
        </div>

        <textarea
          value={dailyNoteDraft}
          onChange={(event) => {
            setDailyNoteDraft(event.target.value);
            setDailyNoteSaved(false);
          }}
          disabled={dailyNotesLoading}
          placeholder="Γράψε ελεύθερα πώς πήγε η ημέρα, τι έμαθες, τι θέλεις να θυμάσαι..."
          className={`${theme.inputFull} min-h-40 resize-y leading-6`}
        />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={saveDailyNote}
            disabled={dailyNoteSaving || dailyNotesLoading}
            className={theme.primaryButton}
          >
            {dailyNoteSaving ? "Saving..." : "Save note"}
          </button>

          {dailyNotesLoading && (
            <p className="text-sm font-semibold text-neutral-500">
              Φόρτωση note...
            </p>
          )}

          {dailyNoteSaved && (
            <p className="text-sm font-semibold text-neutral-700">
              Αποθηκεύτηκε.
            </p>
          )}

          {dailyNoteError && (
            <p className="text-sm font-semibold text-neutral-700">
              {dailyNoteError}
            </p>
          )}
        </div>
      </div>
    );
  }

  function renderTodayView() {
    return (
      <>
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={theme.eyebrow}>Today Dashboard</p>
            <h2 className={`${theme.title} ${theme.brushUnderline}`}>
              Ημέρα, tasks και χρόνος
            </h2>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setSelectedMonth(getMonthFromDate(event.target.value));
              setForm((currentForm) => ({
                ...currentForm,
                date: event.target.value,
              }));
            }}
            className={theme.input}
          />
        </header>

        <StatCards stats={todayStats} />

        <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
          <section className="space-y-6">
            {renderForm()}

            <div className={theme.card}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                  Timeline ημέρας
                </h3>
                <p className="text-sm font-semibold text-neutral-500">
                  {selectedDate}
                </p>
              </div>

              {renderTaskList(dayTasks, "Δεν έχεις tasks για αυτή την ημέρα.")}
            </div>
          </section>

          <aside className="space-y-6">
            {renderDailyNoteCard()}

            <CategoryStats stats={todayStats} />

            <div className={theme.card}>
              <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
                Backlog
              </h3>

              <div className="space-y-3">
                {backlogItems.length === 0 && (
                  <p className="text-sm text-neutral-500">
                    Δεν έχεις backlog items ακόμα.
                  </p>
                )}

                {backlogItems.slice(0, 5).map((item) => (
                  <div key={item.id} className={`${theme.innerPanel} p-4`}>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-neutral-500">{item.category}</p>
                    {item.notes && (
                      <p className="mt-2 text-sm text-neutral-600">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}

                {backlogItems.length > 5 && (
                  <button
                    onClick={() => setActiveView("backlog")}
                    className={`${theme.primaryButton} w-full text-sm`}
                  >
                    Δες όλο το backlog
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      </>
    );
  }

  function renderMonthCalendar() {
    return (
      <div className={theme.card}>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
              Calendar μήνα
            </h3>

            <p className="mt-3 text-sm font-semibold text-neutral-500">
              Πάτα σε μια ημέρα για να δεις τα stats της.
            </p>
          </div>

          <p className="text-sm font-bold text-neutral-500">{selectedMonth}</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-bold uppercase tracking-[0.14em] text-neutral-500"
            >
              {day}
            </div>
          ))}

          {calendarDays.map((calendarDay) => {
            const tasksForDay = monthTasks.filter(
              (task) => task.date === calendarDay.date
            );

            const doneTasksForDay = tasksForDay.filter(
              (task) => task.status === "done"
            );

            const doneMinutesForDay = doneTasksForDay.reduce((sum, task) => {
              return sum + getDurationMinutes(task.startTime, task.endTime);
            }, 0);

            const isToday = calendarDay.date === getToday();
            const isSelectedCalendarDay =
              calendarDay.date === selectedCalendarDate;

            return (
              <button
                key={calendarDay.date}
                type="button"
                onClick={() => {
                  setSelectedCalendarDate(calendarDay.date);
                }}
                className={`min-h-28 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] ${isSelectedCalendarDay
                  ? "border-neutral-950 bg-neutral-950 text-stone-50"
                  : calendarDay.isCurrentMonth
                    ? "border-neutral-300 bg-stone-50/75 text-neutral-950"
                    : "border-neutral-200 bg-stone-100/40 text-neutral-400"
                  } ${isToday ? "ring-2 ring-neutral-950/30 ring-offset-2 ring-offset-stone-100" : ""}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold">
                    {calendarDay.dayNumber}
                  </span>

                  {isToday && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isSelectedCalendarDay
                        ? "bg-stone-50 text-neutral-950"
                        : "bg-neutral-950 text-stone-50"
                        }`}
                    >
                      Today
                    </span>
                  )}
                </div>

                <div className="flex min-h-12 items-center justify-center">
                  {doneMinutesForDay > 0 ? (
                    <p className="text-lg font-extrabold">
                      {formatMinutes(doneMinutesForDay)}
                    </p>
                  ) : (
                    <p
                      className={`text-sm font-semibold ${isSelectedCalendarDay
                        ? "text-stone-400"
                        : "text-neutral-300"
                        }`}
                    >
                      —
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  function renderWeekView() {
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];

    return (
      <>
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={theme.eyebrow}>Weekly Overview</p>

            <h2 className={`${theme.title} ${theme.brushUnderline}`}>
              Εβδομαδιαία εικόνα
            </h2>

            <p className="mt-3 text-sm font-semibold text-neutral-500">
              {weekStart} έως {weekEnd}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedWeekDate(addDays(weekStart, -7))}
              className={theme.secondaryButton}
            >
              Προηγούμενη
            </button>

            <button
              type="button"
              onClick={() => setSelectedWeekDate(getToday())}
              className={theme.primaryButton}
            >
              Τρέχουσα
            </button>

            <button
              type="button"
              onClick={() => setSelectedWeekDate(addDays(weekStart, 7))}
              className={theme.secondaryButton}
            >
              Επόμενη
            </button>

            <input
              type="date"
              value={selectedWeekDate}
              onChange={(event) => setSelectedWeekDate(event.target.value)}
              className={theme.input}
            />
          </div>
        </header>

        <StatCards stats={weekStats} />

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-8">
            <div className={theme.card}>
              <div className="mb-5">
                <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                  Ημέρες εβδομάδας
                </h3>

                <p className="mt-3 text-sm font-semibold text-neutral-500">
                  Πάτα σε μια ημέρα για να ανοίξει στο Today view.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
                {weekDaySummaries.map((daySummary, index) => {
                  const isToday = daySummary.date === getToday();

                  return (
                    <button
                      key={daySummary.date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(daySummary.date);
                        setSelectedMonth(getMonthFromDate(daySummary.date));
                        setSelectedCalendarDate(daySummary.date);
                        setForm((currentForm) => ({
                          ...currentForm,
                          date: daySummary.date,
                        }));
                        setActiveView("today");
                      }}
                      className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] ${isToday
                        ? "border-neutral-950 bg-neutral-950 text-stone-50"
                        : "border-neutral-300 bg-stone-50/75 text-neutral-950"
                        }`}
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p
                          className={`text-sm font-bold ${isToday ? "text-stone-300" : "text-neutral-500"
                            }`}
                        >
                          {weekDays[index]}
                        </p>

                        {isToday && (
                          <span className="rounded-full bg-stone-50 px-2 py-0.5 text-[10px] font-bold text-neutral-950">
                            Today
                          </span>
                        )}
                      </div>

                      <p
                        className={`text-sm font-semibold ${isToday ? "text-stone-300" : "text-neutral-500"
                          }`}
                      >
                        {daySummary.date}
                      </p>

                      <p className="mt-3 text-2xl font-extrabold">
                        {formatMinutes(daySummary.doneMinutes)}
                      </p>

                      <p
                        className={`mt-2 text-sm font-semibold ${isToday ? "text-stone-300" : "text-neutral-500"
                          }`}
                      >
                        {daySummary.doneTasks}/{daySummary.totalTasks} done
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={theme.card}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                  Tasks εβδομάδας
                </h3>

                <p className="text-sm font-semibold text-neutral-500">
                  {weekStart} - {weekEnd}
                </p>
              </div>

              {renderTaskList(weekTasks, "Δεν έχεις tasks για αυτή την εβδομάδα.")}
            </div>
          </section>

          <aside>
            <CategoryStats stats={weekStats} />
          </aside>
        </div>
      </>
    );
  }

  function renderMonthView() {
    return (
      <>
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={theme.eyebrow}>Monthly Overview</p>

            <h2 className={`${theme.title} ${theme.brushUnderline}`}>
              Μηνιαία εικόνα
            </h2>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              const newMonth = event.target.value;

              setSelectedMonth(newMonth);
              setSelectedCalendarDate(`${newMonth}-01`);
            }}
            className={theme.input}
          />
        </header>

        <StatCards stats={monthStats} />

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-8">
            {renderMonthCalendar()}

            <div className={theme.card}>
              <div className="mb-5 flex items-center justify-between">
                <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                  Tasks μήνα
                </h3>

                <p className="text-sm font-semibold text-neutral-500">
                  {selectedMonth}
                </p>
              </div>

              {renderTaskList(monthTasks, "Δεν έχεις tasks για αυτόν τον μήνα.")}
            </div>
          </section>

          <aside>{renderSelectedCalendarDayPanel()}</aside>
        </div>
      </>
    );
  }

  function renderSelectedCalendarDayPanel() {
    return (
      <div className="space-y-6">
        <CategoryStats stats={selectedCalendarStats} />

        <div className={theme.card}>
          <p className={theme.eyebrow}>Επιλεγμένη ημέρα</p>

          <h3 className="mt-2 text-2xl font-bold text-neutral-950">
            {selectedCalendarDate}
          </h3>

          <div className="mt-5 space-y-3 text-sm font-semibold text-neutral-700">
            <p>Tasks: {selectedCalendarStats.totalTasks}</p>
            <p>Done: {selectedCalendarStats.doneTasks}</p>
            <p>Χρόνος: {formatMinutes(selectedCalendarStats.totalMinutes)}</p>
            <p>Completion: {selectedCalendarStats.completionRate}%</p>
          </div>

          <div className="mt-5">
            <p className="text-sm font-bold text-neutral-700">Daily note</p>

            {dailyNotes[selectedCalendarDate] ? (
              <p className={`${theme.innerPanel} mt-2 p-4 text-sm leading-6 text-neutral-600`}>
                {dailyNotes[selectedCalendarDate]}
              </p>
            ) : (
              <p className="mt-2 text-sm font-semibold text-neutral-400">
                Δεν υπάρχει note για αυτή την ημέρα.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedDate(selectedCalendarDate);
              setSelectedMonth(getMonthFromDate(selectedCalendarDate));
              setForm((currentForm) => ({
                ...currentForm,
                date: selectedCalendarDate,
              }));
              setActiveView("today");
            }}
            className={`${theme.primaryButton} mt-5 w-full text-sm`}
          >
            Δες την ημέρα
          </button>
        </div>
      </div>
    );
  }

  function renderStatsView() {
    return (
      <>
        <header className="mb-8">
          <p className={theme.eyebrow}>All-time Dashboard</p>

          <h2 className={`${theme.title} ${theme.brushUnderline}`}>
            Συνολικά στατιστικά
          </h2>
        </header>

        <StatCards stats={allTimeStats} />

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          <CategoryStats stats={allTimeStats} />

          <div className={theme.card}>
            <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
              Σύνοψη
            </h3>

            <div className="space-y-3 text-sm font-semibold text-neutral-700">
              <p>Συνολικά tasks: {allTimeStats.totalTasks}</p>
              <p>Ολοκληρωμένα tasks: {allTimeStats.doneTasks}</p>
              <p>Συνολικός χρόνος: {formatMinutes(allTimeStats.totalMinutes)}</p>
              <p>Backlog items: {backlogItems.length}</p>
              <p>
                Μέσος χρόνος ανά completed task:{" "}
                {formatMinutes(allTimeStats.averageMinutesPerDoneTask)}
              </p>
              <p>
                Πιο ενεργή κατηγορία:{" "}
                {allTimeStats.mostActiveCategory
                  ? `${allTimeStats.mostActiveCategory.category} (${formatMinutes(
                    allTimeStats.mostActiveCategory.totalMinutes
                  )})`
                  : "Δεν υπάρχουν ακόμα ολοκληρωμένα tasks με χρόνο."}
              </p>
            </div>
          </div>
        </div>

        <div className={`${theme.card} mt-8`}>
          <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
            Ανάλυση ανά κατηγορία
          </h3>

          <div className="space-y-3">
            {allTimeStats.categoryStats.map((categoryStat) => (
              <div
                key={categoryStat.category}
                className={`${theme.innerPanel} p-4`}
              >
                <div className="mb-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <h4 className="font-bold text-neutral-950">
                    {categoryStat.category}
                  </h4>

                  <p className="text-sm font-semibold text-neutral-500">
                    {categoryStat.completionRate}% completion
                  </p>
                </div>

                <div className="grid gap-3 text-sm font-semibold text-neutral-700 md:grid-cols-3">
                  <p>Tasks: {categoryStat.totalTasks}</p>
                  <p>Done: {categoryStat.doneTasks}</p>
                  <p>Χρόνος: {formatMinutes(categoryStat.totalMinutes)}</p>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full border border-neutral-300 bg-stone-200">
                  <div
                    className="h-full rounded-full bg-neutral-950"
                    style={{
                      width: `${categoryStat.completionRate}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  function renderProfileView() {
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
                      onChange={(event) => {
                        setProfileNameDraft(event.target.value);
                        setProfileNameSaved(false);
                      }}
                      placeholder="Π.χ. Christos"
                      className={`${theme.input} min-w-0 flex-1`}
                    />

                    <button
                      type="button"
                      onClick={saveProfileName}
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
                    onClick={signInWithGoogle}
                    disabled={authActionLoading}
                    className={theme.primaryButton}
                  >
                    {authActionLoading ? "Opening Google..." : "Sign in with Google"}
                  </button>
                )}

                {!authLoading && firebaseUser && !isAnonymousUser && (
                  <button
                    type="button"
                    onClick={handleSignOut}
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
                    onChange={(event) => {
                      setUserSettings((currentSettings) => ({
                        ...currentSettings,
                        defaultCategory: event.target.value,
                      }));
                      setSettingsSaved(false);
                    }}
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
                    onChange={(event) => {
                      setUserSettings((currentSettings) => ({
                        ...currentSettings,
                        defaultView: event.target.value as View,
                      }));
                      setSettingsSaved(false);
                    }}
                    className={theme.inputFull}
                  >
                    <option value="today">Today</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                    <option value="stats">Stats</option>
                    <option value="backlog">Backlog</option>
                    <option value="profile">Profile</option>
                  </select>
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="block text-sm font-bold text-neutral-600">
                    Theme
                  </span>

                  <select
                    value={userSettings.themePreference}
                    onChange={(event) => {
                      setUserSettings((currentSettings) => ({
                        ...currentSettings,
                        themePreference: event.target.value,
                      }));
                      setSettingsSaved(false);
                    }}
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
                  onClick={saveUserSettings}
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
            </div>
          </section>
        </div>
      </>
    );
  }

  function renderBacklogView() {
    return (
      <>
        <header className="mb-8">
          <p className={theme.eyebrow}>Ideas / Later / Watchlist</p>

          <h2 className={`${theme.title} ${theme.brushUnderline}`}>
            Backlog
          </h2>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          {renderForm()}

          <div className={theme.card}>
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                  Όλα τα backlog items
                </h3>

                <p className="mt-3 text-sm font-semibold text-neutral-500">
                  {filteredBacklogItems.length}/{backlogItems.length} items · Διάλεξε ημερομηνία για schedule
                </p>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => {
                  setSelectedDate(event.target.value);
                  setSelectedMonth(getMonthFromDate(event.target.value));
                }}
                className={theme.input}
              />
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-4">
              <select
                value={backlogCategoryFilter}
                onChange={(event) => setBacklogCategoryFilter(event.target.value)}
                className={theme.inputFull}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <select
                value={backlogPriorityFilter}
                onChange={(event) =>
                  setBacklogPriorityFilter(
                    event.target.value as BacklogPriority | "all"
                  )
                }
                className={theme.inputFull}
              >
                <option value="all">All priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={backlogStatusFilter}
                onChange={(event) =>
                  setBacklogStatusFilter(
                    event.target.value as BacklogStatus | "all"
                  )
                }
                className={theme.inputFull}
              >
                <option value="all">All statuses</option>
                <option value="idea">Idea</option>
                <option value="someday">Someday</option>
                <option value="planned">Planned</option>
              </select>

              <select
                value={backlogSort}
                onChange={(event) =>
                  setBacklogSort(
                    event.target.value as "newest" | "priority" | "category"
                  )
                }
                className={theme.inputFull}
              >
                <option value="newest">Newest first</option>
                <option value="priority">Priority first</option>
                <option value="category">Category A-Z</option>
              </select>
            </div>

            <div className="space-y-3">
              {filteredBacklogItems.length === 0 && (
                <p className={`${theme.innerPanel} p-4 text-neutral-500`}>
                  Δεν υπάρχουν backlog items με αυτά τα φίλτρα.
                </p>
              )}

              {filteredBacklogItems.map((item) => (
                <div
                  key={item.id}
                  className={`${theme.innerPanel} flex flex-col gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] md:flex-row md:items-center md:justify-between`}
                >
                  <div>
                    <p className="font-bold text-neutral-950">{item.title}</p>

                    <p className="text-sm font-semibold text-neutral-500">
                      {item.category}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className={theme.badge}>
                        Priority: {item.priority ?? "medium"}
                      </span>

                      <span className={theme.badge}>
                        Status: {item.backlogStatus ?? "idea"}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="mt-2 text-sm text-neutral-600">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => startEditTask(item)}
                      className={theme.smallButton}
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => scheduleBacklogItem(item)}
                      className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50 transition hover:bg-neutral-800"
                    >
                      Schedule
                    </button>

                    <button
                      onClick={() => requestDeleteTask(item)}
                      className={theme.dangerButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  async function scheduleBacklogItem(task: Task) {
    if (!firebaseUser) return;

    const taskRef = doc(db, "users", firebaseUser.uid, "tasks", task.id);

    await updateDoc(taskRef, {
      type: "task",
      date: selectedDate,
      status: "pending",
      backlogStatus: "planned",
      updatedAt: serverTimestamp(),
    });

    setActiveView("today");
  }

  const views: { id: View; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "stats", label: "Stats" },
    { id: "backlog", label: "Backlog" },
    { id: "profile", label: "Profile" },
  ];

  return (
    <div className={theme.appShell}>
      <div className={`${theme.pageBackdrop} ${theme.paperTexture}`}>
        <img
          src="/theme/mountain.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-0 top-6 z-0 hidden w-[680px] opacity-25 mix-blend-multiply lg:block"
        />

        <img
          src="/theme/plant-2.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 right-4 z-0 hidden w-[360px] opacity-20 mix-blend-multiply xl:block"
        />

        <div className="relative z-10 flex min-h-screen">
          <aside className={`${theme.sidebar} overflow-hidden`}>
            <img
              src="/theme/plant.png"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute bottom-6 left-4 z-0 w-40 opacity-25 mix-blend-multiply"
            />
            <div className="relative z-10 mb-10">
              <p className="text-xs font-bold tracking-[0.35em] text-neutral-500">
                天下無双
              </p>

              <h1 className="mt-2 font-serif text-3xl font-black tracking-tight text-neutral-950">
                Tenka Musō
              </h1>

              <p className="mt-2 text-sm font-semibold text-neutral-500">
                Discipline • Focus • Path
              </p>
            </div>

            <nav className="relative z-10 space-y-2">
              {views.map((view) => {
                const isActive = activeView === view.id;

                return (
                  <button
                    key={view.id}
                    onClick={() => setActiveView(view.id)}
                    className={
                      isActive
                        ? "relative w-full overflow-visible px-4 py-3 text-left text-sm font-bold text-stone-50"
                        : theme.navItem
                    }
                  >
                    {isActive && (
                      <img
                        src="/theme/brush-1.png"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute left-0 top-1/2 h-[42px] w-full -translate-y-1/2 scale-x-110 object-fill opacity-95"
                      />
                    )}

                    <span className="relative z-10">{view.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="relative z-10 mt-10 rounded-2xl border border-neutral-300 bg-neutral-950 p-4 text-stone-50 shadow-[0_10px_25px_rgba(23,23,23,0.18)]">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-stone-400">
                Current view
              </p>
              <p className="mt-2 text-lg font-bold">{activeView}</p>
            </div>
          </aside>

          <main className={theme.main}>
            <div className={theme.pageContent}>
              {renderAuthPanel()}
              {tasksLoading && (
                <div className={`${theme.cardSoft} mb-4 text-sm font-semibold text-neutral-600`}>
                  Φόρτωση tasks από Firestore...
                </div>
              )}
              <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
                {views.map((view) => {
                  const isActive = activeView === view.id;

                  return (
                    <button
                      key={view.id}
                      onClick={() => setActiveView(view.id)}
                      className={
                        isActive
                          ? "relative shrink-0 overflow-hidden rounded-xl px-4 py-2 text-sm font-bold text-stone-50"
                          : "shrink-0 rounded-xl border border-neutral-300 bg-stone-100 px-4 py-2 text-sm font-bold text-neutral-700"
                      }
                    >
                      {isActive && (
                        <img
                          src="/theme/brush-1.png"
                          alt=""
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 h-full w-full scale-x-110 object-fill opacity-95"
                        />
                      )}

                      <span className="relative z-10">{view.label}</span>
                    </button>
                  );
                })}
              </div>

              {activeView === "today" && renderTodayView()}
              {activeView === "week" && renderWeekView()}
              {activeView === "month" && renderMonthView()}
              {activeView === "stats" && renderStatsView()}
              {activeView === "backlog" && renderBacklogView()}
              {activeView === "profile" && renderProfileView()}

            </div>
          </main>
        </div>

        <ConfirmModal
          confirmModal={confirmModal}
          onClose={() => setConfirmModal(null)}
        />
      </div>
    </div>
  );
}

export default App;