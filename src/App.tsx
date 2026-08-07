import { useEffect, useMemo, useRef, useState } from "react";
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
import { CategoryStats } from "./components/CategoryStats";
import { EmptyState, type EmptyStateOptions } from "./components/EmptyState";
import { TaskForm } from "./components/TaskForm";
import { AuthPanel } from "./components/AuthPanel";
import { DailyNoteCard } from "./components/DailyNoteCard";
import { Sidebar } from "./components/Sidebar";
import { MobileNavigation } from "./components/MobileNavigation";
import { TodayView } from "./views/TodayView";
import { WeekView } from "./views/WeekView";
import { MonthView } from "./views/MonthView";
import { StatsView } from "./views/StatsView";
import { BacklogView } from "./views/BacklogView";
import { SearchView } from "./views/SearchView";
import { ProfileView } from "./views/ProfileView";

const defaultUserSettings = {
  defaultCategory: "Δουλειά",
  defaultView: "today" as View,
  themePreference: "manga-grayscale",
};

function isValidView(value: unknown): value is View {
  return (
    typeof value === "string" &&
    ["today", "week", "month", "stats", "backlog", "search", "profile"].includes(value)
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

  const [backlogScheduleDates, setBacklogScheduleDates] = useState<
    Record<string, string>
  >({});

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategoryFilter, setSearchCategoryFilter] = useState("all");
  const [searchTypeFilter, setSearchTypeFilter] = useState<TaskType | "all">("all");
  const [searchStatusFilter, setSearchStatusFilter] = useState<
    "pending" | "done" | "all"
  >("all");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const taskFormRef = useRef<HTMLDivElement | null>(null);
  const taskTitleInputRef = useRef<HTMLInputElement | null>(null);

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

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();

  const taskSearchResults = useMemo(() => {
    return tasks
      .filter((task) => {
        const matchesCategory =
          searchCategoryFilter === "all" || task.category === searchCategoryFilter;

        const matchesType =
          searchTypeFilter === "all" || task.type === searchTypeFilter;

        const matchesStatus =
          searchStatusFilter === "all" || task.status === searchStatusFilter;

        const matchesDateFrom = !searchDateFrom || task.date >= searchDateFrom;
        const matchesDateTo = !searchDateTo || task.date <= searchDateTo;

        const searchableText = [
          task.title,
          task.category,
          task.type,
          task.status,
          task.date,
          task.startTime,
          task.endTime,
          task.notes,
          task.priority ?? "",
          task.backlogStatus ?? "",
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          !normalizedSearchQuery || searchableText.includes(normalizedSearchQuery);

        return (
          matchesCategory &&
          matchesType &&
          matchesStatus &&
          matchesDateFrom &&
          matchesDateTo &&
          matchesQuery
        );
      })
      .map((task) => ({
        kind: "task" as const,
        id: `task-${task.id}`,
        date: task.date,
        task,
      }));
  }, [
    tasks,
    normalizedSearchQuery,
    searchCategoryFilter,
    searchTypeFilter,
    searchStatusFilter,
    searchDateFrom,
    searchDateTo,
  ]);

  const dailyNoteSearchResults = useMemo(() => {
    if (
      searchCategoryFilter !== "all" ||
      searchTypeFilter !== "all" ||
      searchStatusFilter !== "all"
    ) {
      return [];
    }

    return Object.entries(dailyNotes)
      .filter(([date, content]) => {
        if (!content.trim()) return false;

        const matchesDateFrom = !searchDateFrom || date >= searchDateFrom;
        const matchesDateTo = !searchDateTo || date <= searchDateTo;

        const searchableText = `${date} daily journal note ${content}`.toLowerCase();

        const matchesQuery =
          !normalizedSearchQuery || searchableText.includes(normalizedSearchQuery);

        return matchesDateFrom && matchesDateTo && matchesQuery;
      })
      .map(([date, content]) => ({
        kind: "dailyNote" as const,
        id: `daily-note-${date}`,
        date,
        content,
      }));
  }, [
    dailyNotes,
    normalizedSearchQuery,
    searchCategoryFilter,
    searchTypeFilter,
    searchStatusFilter,
    searchDateFrom,
    searchDateTo,
  ]);

  const searchResults = useMemo(() => {
    return [...taskSearchResults, ...dailyNoteSearchResults].sort((first, second) =>
      second.date.localeCompare(first.date)
    );
  }, [taskSearchResults, dailyNoteSearchResults]);

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

  function exportUserData() {
    const exportedAt = new Date().toISOString();

    const backupData = {
      app: "Tenka Musō",
      version: 1,
      exportedAt,
      user: {
        uid: firebaseUser?.uid ?? null,
        email: firebaseUser?.email ?? null,
        displayName: firebaseUser?.displayName ?? null,
        isAnonymous: firebaseUser?.isAnonymous ?? null,
      },
      data: {
        tasks,
        dailyNotes,
        customCategories,
        userSettings,
      },
    };

    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], {
      type: "application/json",
    });

    const backupDate = exportedAt.slice(0, 10);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `tenka-muso-backup-${backupDate}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
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

  function openDateInTodayView(date: string) {
    setSelectedDate(date);
    setSelectedMonth(getMonthFromDate(date));
    setSelectedCalendarDate(date);
    setForm((currentForm) => ({
      ...currentForm,
      date,
    }));
    setActiveView("today");
  }

  function startEditTaskFromSearch(task: Task) {
    setSelectedDate(task.date);
    setSelectedMonth(getMonthFromDate(task.date));
    setSelectedCalendarDate(task.date);
    startEditTask(task);
    setActiveView("today");
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

  function openQuickAddTask() {
    setEditingTaskId(null);
    setMobileMenuOpen(false);
    setActiveView("today");

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

    window.setTimeout(() => {
      taskFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      taskTitleInputRef.current?.focus({
        preventScroll: true,
      });
    }, 100);
  }

  function renderEmptyState(options: EmptyStateOptions) {
    return <EmptyState {...options} />;
  }

  function renderForm() {
    return (
      <TaskForm
        form={form}
        setForm={setForm}
        editingTaskId={editingTaskId}
        categories={categories}
        customCategories={customCategories}
        newCategoryName={newCategoryName}
        showCategories={showCategories}
        taskFormRef={taskFormRef}
        taskTitleInputRef={taskTitleInputRef}
        onNewCategoryNameChange={setNewCategoryName}
        onAddCategory={addCategory}
        onToggleCategories={() =>
          setShowCategories((currentValue) => !currentValue)
        }
        onRequestDeleteCategory={requestDeleteCategory}
        onSaveTask={saveTask}
        onCancelEdit={cancelEditTask}
      />
    );
  }

  function renderAuthPanel() {
    return (
      <AuthPanel
        firebaseUser={firebaseUser}
        authLoading={authLoading}
        authActionLoading={authActionLoading}
        authError={authError}
        onSignInWithGoogle={signInWithGoogle}
        onSignOut={handleSignOut}
      />
    );
  }

  function renderDailyNoteCard() {
    return (
      <DailyNoteCard
        selectedDate={selectedDate}
        dailyNoteDraft={dailyNoteDraft}
        dailyNotesLoading={dailyNotesLoading}
        dailyNoteSaving={dailyNoteSaving}
        dailyNoteSaved={dailyNoteSaved}
        dailyNoteError={dailyNoteError}
        onDailyNoteDraftChange={(value) => {
          setDailyNoteDraft(value);
          setDailyNoteSaved(false);
        }}
        onSaveDailyNote={saveDailyNote}
      />
    );
  }

  function renderTodayView() {
    return (
      <TodayView
        selectedDate={selectedDate}
        todayStats={todayStats}
        dayTasks={dayTasks}
        backlogItems={backlogItems}
        renderForm={renderForm}
        renderDailyNoteCard={renderDailyNoteCard}
        onSelectedDateChange={(date) => {
          setSelectedDate(date);
          setSelectedMonth(getMonthFromDate(date));
          setForm((currentForm) => ({
            ...currentForm,
            date,
          }));
        }}
        onEditTask={startEditTask}
        onToggleDone={toggleDone}
        onDeleteTask={requestDeleteTask}
        onOpenBacklog={() => setActiveView("backlog")}
      />
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

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500 sm:text-xs sm:tracking-[0.14em]"
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
                className={`min-h-20 rounded-xl border p-2 text-left transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] sm:min-h-28 sm:rounded-2xl sm:p-3 ${isSelectedCalendarDay
                  ? "border-neutral-950 bg-neutral-950 text-stone-50"
                  : calendarDay.isCurrentMonth
                    ? "border-neutral-300 bg-stone-50/75 text-neutral-950"
                    : "border-neutral-200 bg-stone-100/40 text-neutral-400"
                  } ${isToday ? "ring-2 ring-neutral-950/30 ring-offset-2 ring-offset-stone-100" : ""}`}
              >
                <div className="mb-2 flex items-center justify-between sm:mb-4">
                  <span className="text-xs font-bold sm:text-sm">
                    {calendarDay.dayNumber}
                  </span>

                  {isToday && (
                    <span
                      className={`hidden rounded-full px-2 py-0.5 text-[10px] font-bold sm:inline-flex ${isSelectedCalendarDay
                        ? "bg-stone-50 text-neutral-950"
                        : "bg-neutral-950 text-stone-50"
                        }`}
                    >
                      Today
                    </span>
                  )}
                </div>

                <div className="flex min-h-9 items-center justify-center sm:min-h-12">
                  {doneMinutesForDay > 0 ? (
                    <p className="text-xs font-extrabold sm:text-lg">
                      {formatMinutes(doneMinutesForDay)}
                    </p>
                  ) : (
                    <p
                      className={`text-xs font-semibold sm:text-sm ${isSelectedCalendarDay
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

  function renderMonthAgenda() {
    return (
      <div className={theme.card}>
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className={theme.eyebrow}>Agenda</p>

            <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
              Tasks επιλεγμένης ημέρας
            </h3>

            <p className="mt-3 text-sm font-semibold text-neutral-500">
              {selectedCalendarDate}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openDateInTodayView(selectedCalendarDate)}
            className={`${theme.secondaryButton} text-sm`}
          >
            Δες την ημέρα
          </button>
        </div>

        <div className="space-y-3">
          {selectedCalendarTasks.length === 0 &&
            renderEmptyState({
              eyebrow: "Agenda",
              title: "Δεν υπάρχουν tasks για αυτή την ημέρα.",
              description:
                "Πάτα άλλη ημέρα στο calendar ή πάτα «Δες την ημέρα» για να προσθέσεις νέο task.",
            })}

          {selectedCalendarTasks.map((task) => {
            const duration = getDurationMinutes(task.startTime, task.endTime);

            return (
              <div
                key={task.id}
                className={`${theme.innerPanel} flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between`}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={theme.badge}>{task.category}</span>
                    <span className={theme.badge}>{task.type}</span>
                    <span className={theme.badge}>{task.status}</span>

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
                    <p className="mt-2 text-sm leading-6 text-neutral-600">
                      {task.notes}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => openDateInTodayView(task.date)}
                    className={theme.smallButton}
                  >
                    Open day
                  </button>

                  <button
                    type="button"
                    onClick={() => startEditTaskFromSearch(task)}
                    className={theme.smallButton}
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleDone(task.id)}
                    className={
                      task.status === "done"
                        ? theme.smallButton
                        : "rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50 transition hover:bg-neutral-800"
                    }
                  >
                    {task.status === "done" ? "Undo" : "Done"}
                  </button>
                </div>
              </div>
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
      <WeekView
        selectedWeekDate={selectedWeekDate}
        weekStart={weekStart}
        weekEnd={weekEnd}
        weekStats={weekStats}
        weekDaySummaries={weekDaySummaries}
        weekTasks={weekTasks}
        onPreviousWeek={() => setSelectedWeekDate(addDays(weekStart, -7))}
        onCurrentWeek={() => setSelectedWeekDate(getToday())}
        onNextWeek={() => setSelectedWeekDate(addDays(weekStart, 7))}
        onSelectedWeekDateChange={setSelectedWeekDate}
        onOpenDay={openDateInTodayView}
        onEditTask={startEditTask}
        onToggleDone={toggleDone}
        onDeleteTask={requestDeleteTask}
      />
    );
  }

  function renderMonthView() {
    return (
      <MonthView
        selectedMonth={selectedMonth}
        monthStats={monthStats}
        monthTasks={monthTasks}
        renderMonthCalendar={renderMonthCalendar}
        renderMonthAgenda={renderMonthAgenda}
        renderSelectedCalendarDayPanel={renderSelectedCalendarDayPanel}
        onSelectedMonthChange={(newMonth) => {
          setSelectedMonth(newMonth);
          setSelectedCalendarDate(`${newMonth}-01`);
        }}
        onEditTask={startEditTask}
        onToggleDone={toggleDone}
        onDeleteTask={requestDeleteTask}
      />
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
      <StatsView
        allTimeStats={allTimeStats}
        backlogItemsCount={backlogItems.length}
      />
    );
  }

  function renderSearchView() {
    return (
      <SearchView
        categories={categories}
        searchResults={searchResults}
        searchQuery={searchQuery}
        searchCategoryFilter={searchCategoryFilter}
        searchTypeFilter={searchTypeFilter}
        searchStatusFilter={searchStatusFilter}
        searchDateFrom={searchDateFrom}
        searchDateTo={searchDateTo}
        onSearchQueryChange={setSearchQuery}
        onSearchCategoryFilterChange={setSearchCategoryFilter}
        onSearchTypeFilterChange={setSearchTypeFilter}
        onSearchStatusFilterChange={setSearchStatusFilter}
        onSearchDateFromChange={setSearchDateFrom}
        onSearchDateToChange={setSearchDateTo}
        onClearSearchFilters={() => {
          setSearchQuery("");
          setSearchCategoryFilter("all");
          setSearchTypeFilter("all");
          setSearchStatusFilter("all");
          setSearchDateFrom("");
          setSearchDateTo("");
        }}
        onOpenDate={openDateInTodayView}
        onEditTask={startEditTaskFromSearch}
        onToggleDone={toggleDone}
        onDeleteTask={requestDeleteTask}
      />
    );
  }

  function renderProfileView() {
    return (
      <ProfileView
        firebaseUser={firebaseUser}
        authLoading={authLoading}
        authActionLoading={authActionLoading}
        authError={authError}
        categories={categories}
        profileNameDraft={profileNameDraft}
        profileNameSaving={profileNameSaving}
        profileNameSaved={profileNameSaved}
        profileNameError={profileNameError}
        userSettings={userSettings}
        settingsLoading={settingsLoading}
        settingsSaving={settingsSaving}
        settingsSaved={settingsSaved}
        settingsError={settingsError}
        tasksLoading={tasksLoading}
        dailyNotesLoading={dailyNotesLoading}
        onProfileNameDraftChange={(value) => {
          setProfileNameDraft(value);
          setProfileNameSaved(false);
        }}
        onSaveProfileName={saveProfileName}
        onDefaultCategoryChange={(value) => {
          setUserSettings((currentSettings) => ({
            ...currentSettings,
            defaultCategory: value,
          }));
          setSettingsSaved(false);
        }}
        onDefaultViewChange={(value) => {
          setUserSettings((currentSettings) => ({
            ...currentSettings,
            defaultView: value,
          }));
          setSettingsSaved(false);
        }}
        onThemePreferenceChange={(value) => {
          setUserSettings((currentSettings) => ({
            ...currentSettings,
            themePreference: value,
          }));
          setSettingsSaved(false);
        }}
        onSaveUserSettings={saveUserSettings}
        onExportUserData={exportUserData}
        onSignInWithGoogle={signInWithGoogle}
        onSignOut={handleSignOut}
      />
    );
  }

  function renderBacklogView() {
    return (
      <BacklogView
        categories={categories}
        filteredBacklogItems={filteredBacklogItems}
        backlogItemsCount={backlogItems.length}
        backlogCategoryFilter={backlogCategoryFilter}
        backlogPriorityFilter={backlogPriorityFilter}
        backlogStatusFilter={backlogStatusFilter}
        backlogSort={backlogSort}
        renderForm={renderForm}
        getBacklogScheduleDate={getBacklogScheduleDate}
        onBacklogCategoryFilterChange={setBacklogCategoryFilter}
        onBacklogPriorityFilterChange={setBacklogPriorityFilter}
        onBacklogStatusFilterChange={setBacklogStatusFilter}
        onBacklogSortChange={setBacklogSort}
        onBacklogScheduleDateChange={(taskId, date) => {
          setBacklogScheduleDates((currentDates) => ({
            ...currentDates,
            [taskId]: date,
          }));
        }}
        onEditTask={startEditTask}
        onScheduleBacklogItem={scheduleBacklogItem}
        onDeleteTask={requestDeleteTask}
      />
    );
  }

  function getBacklogScheduleDate(taskId: string) {
    return backlogScheduleDates[taskId] ?? selectedDate;
  }

  async function scheduleBacklogItem(task: Task) {
    if (!firebaseUser) return;

    const scheduleDate = getBacklogScheduleDate(task.id);
    if (!scheduleDate) return;

    const taskRef = doc(db, "users", firebaseUser.uid, "tasks", task.id);

    await updateDoc(taskRef, {
      type: "task",
      date: scheduleDate,
      status: "pending",
      backlogStatus: "planned",
      updatedAt: serverTimestamp(),
    });

    setBacklogScheduleDates((currentDates) => {
      const nextDates = { ...currentDates };
      delete nextDates[task.id];
      return nextDates;
    });

    openDateInTodayView(scheduleDate);
  }

  const views: { id: View; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "week", label: "Week" },
    { id: "month", label: "Month" },
    { id: "stats", label: "Stats" },
    { id: "backlog", label: "Backlog" },
    { id: "search", label: "Search" },
    { id: "profile", label: "Profile" },
  ];

  function handleViewChange(viewId: View) {
    setActiveView(viewId);
    setMobileMenuOpen(false);
  }

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

        <div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
          <Sidebar
            views={views}
            activeView={activeView}
            onViewChange={handleViewChange}
          />

          <main className={theme.main}>
            <div className={theme.pageContent}>
              <MobileNavigation
                views={views}
                activeView={activeView}
                mobileMenuOpen={mobileMenuOpen}
                onToggleMobileMenu={() =>
                  setMobileMenuOpen((currentValue) => !currentValue)
                }
                onViewChange={handleViewChange}
              />

              {renderAuthPanel()}

              {tasksLoading && (
                <div className={`${theme.cardSoft} mb-4 text-sm font-semibold text-neutral-600`}>
                  Φόρτωση tasks από Firestore...
                </div>
              )}

              {activeView === "today" && renderTodayView()}
              {activeView === "week" && renderWeekView()}
              {activeView === "month" && renderMonthView()}
              {activeView === "stats" && renderStatsView()}
              {activeView === "backlog" && renderBacklogView()}
              {activeView === "search" && renderSearchView()}
              {activeView === "profile" && renderProfileView()}

              {!mobileMenuOpen && activeView !== "profile" && (
                <button
                  type="button"
                  onClick={openQuickAddTask}
                  className="fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950 text-3xl font-black leading-none text-stone-50 shadow-[0_14px_30px_rgba(23,23,23,0.28)] transition active:scale-95 lg:hidden"
                >
                  <span className="sr-only">Quick add task</span>
                  <span aria-hidden="true" className="-mt-1">
                    +
                  </span>
                </button>
              )}

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