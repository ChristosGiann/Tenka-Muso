import { useState } from "react";
import type { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  type DocumentReference,
  type SetOptions,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { getToday } from "../utils/date";
import {
  defaultAppThemeKey,
  isAppThemeKey,
  type AppThemeKey,
} from "../styles/themeOptions";
import type {
  BacklogPriority,
  BacklogStatus,
  GoalMetric,
  GoalPeriod,
  ProjectGoal,
  ProjectStatus,
  RoutineRecurrence,
  TaskStatus,
  TaskType,
  View,
  WeekdayNumber,
} from "../types";
import { createProjectSlug } from "./useProjects";

type JsonRecord = Record<string, unknown>;

type ImportTask = {
  title: string;
  type: TaskType;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  notes: string;
  priority: BacklogPriority;
  backlogStatus: BacklogStatus;
  recurrence?: RoutineRecurrence;
  routineCompletions?: Record<string, TaskStatus>;
  routineSkips?: Record<string, boolean>;
};

type ImportGoal = {
  title: string;
  category: string;
  targetValue: number;
  metric: GoalMetric;
  period: GoalPeriod;
  active: boolean;
};

type ImportProject = {
  title: string;
  slug: string;
  status: ProjectStatus;
  description: string;
  startDate: string;
  deadline?: string;
  goals: ProjectGoal[];
};

type ImportUserSettings = Partial<{
  defaultCategory: string;
  defaultView: View;
  themePreference: AppThemeKey;
}>;

type BackupImportData = {
  tasks: ImportTask[];
  dailyNotes: Record<string, string>;
  customCategories: string[];
  userSettings: ImportUserSettings | null;
  goals: ImportGoal[];
  projects: ImportProject[];
};

export type BackupImportCounts = {
  tasks: number;
  dailyNotes: number;
  customCategories: number;
  userSettings: number;
  goals: number;
  projects: number;
};

export type BackupImportPreview = {
  fileName: string;
  exportedAt: string | null;
  counts: BackupImportCounts;
  data: BackupImportData;
};

export type BackupImportResult = {
  imported: BackupImportCounts;
  skipped: Partial<BackupImportCounts>;
};

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function isTaskType(value: unknown): value is TaskType {
  return value === "task" || value === "routine" || value === "backlog";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "pending" || value === "done";
}

function isBacklogPriority(value: unknown): value is BacklogPriority {
  return value === "low" || value === "medium" || value === "high";
}

function isBacklogStatus(value: unknown): value is BacklogStatus {
  return value === "idea" || value === "someday" || value === "planned";
}

function isGoalMetric(value: unknown): value is GoalMetric {
  return value === "hours" || value === "completions" || value === "count";
}

function isGoalPeriod(value: unknown): value is GoalPeriod {
  return value === "weekly" || value === "monthly";
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return value === "active" || value === "paused" || value === "completed";
}

function isWeekdayNumber(value: unknown): value is WeekdayNumber {
  return (
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5 ||
    value === 6 ||
    value === 7
  );
}

function isView(value: unknown): value is View {
  return (
    typeof value === "string" &&
    [
      "today",
      "week",
      "month",
      "stats",
      "backlog",
      "search",
      "projects",
      "profile",
    ].includes(value)
  );
}

function getTaskStatusRecord(
  value: unknown
): Record<string, TaskStatus> | undefined {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).filter(([, recordValue]) =>
    isTaskStatus(recordValue)
  );

  return entries.length > 0
    ? (Object.fromEntries(entries) as Record<string, TaskStatus>)
    : undefined;
}

function getBooleanRecord(value: unknown): Record<string, boolean> | undefined {
  if (!isRecord(value)) return undefined;

  const entries = Object.entries(value).filter(
    ([, recordValue]) => typeof recordValue === "boolean"
  );

  return entries.length > 0
    ? (Object.fromEntries(entries) as Record<string, boolean>)
    : undefined;
}

function getRoutineRecurrence(value: unknown): RoutineRecurrence | undefined {
  if (!isRecord(value)) return undefined;

  const weekdays = getArray(value.weekdays).filter(isWeekdayNumber);

  if (value.type !== "weekly" || weekdays.length === 0) {
    return undefined;
  }

  return {
    type: "weekly",
    weekdays,
  };
}

function createBackupItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeTask(value: unknown): ImportTask | null {
  if (!isRecord(value)) return null;

  const title = getString(value.title).trim();
  if (!title) return null;

  const type = isTaskType(value.type) ? value.type : "task";
  const task: ImportTask = {
    title,
    type,
    category: getString(value.category, "Προσωπικά"),
    date: getString(value.date, getToday()),
    startTime: getString(value.startTime),
    endTime: getString(value.endTime),
    status: isTaskStatus(value.status) ? value.status : "pending",
    notes: getString(value.notes),
    priority: isBacklogPriority(value.priority) ? value.priority : "medium",
    backlogStatus: isBacklogStatus(value.backlogStatus)
      ? value.backlogStatus
      : "idea",
  };

  if (type === "routine") {
    const recurrence = getRoutineRecurrence(value.recurrence);
    const routineCompletions = getTaskStatusRecord(value.routineCompletions);
    const routineSkips = getBooleanRecord(value.routineSkips);

    if (recurrence) task.recurrence = recurrence;
    if (routineCompletions) task.routineCompletions = routineCompletions;
    if (routineSkips) task.routineSkips = routineSkips;
  }

  return task;
}

function normalizeDailyNotes(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter(([date, content]) => {
      return /^\d{4}-\d{2}-\d{2}$/.test(date) && typeof content === "string";
    })
  ) as Record<string, string>;
}

function normalizeCategory(value: unknown): string | null {
  const name = getString(value).trim();
  return name ? name : null;
}

function normalizeGoal(value: unknown): ImportGoal | null {
  if (!isRecord(value)) return null;

  const title = getString(value.title).trim();
  if (!title) return null;

  const targetValue = getNumber(value.targetValue, 0);
  if (targetValue <= 0) return null;

  return {
    title,
    category: getString(value.category, "Προσωπικά"),
    targetValue,
    metric: isGoalMetric(value.metric) ? value.metric : "hours",
    period: isGoalPeriod(value.period) ? value.period : "weekly",
    active: getBoolean(value.active, true),
  };
}

function normalizeProjectGoal(value: unknown): ProjectGoal | null {
  if (!isRecord(value)) return null;

  const title = getString(value.title).trim();
  if (!title) return null;

  const goal: ProjectGoal = {
    id: getString(value.id).trim() || createBackupItemId(),
    title,
    completed: getBoolean(value.completed, false),
  };

  const dueDate = getString(value.dueDate).trim();
  if (dueDate) goal.dueDate = dueDate;

  return goal;
}

function normalizeProject(value: unknown): ImportProject | null {
  if (!isRecord(value)) return null;

  const title = getString(value.title).trim();
  if (!title) return null;

  const slug = createProjectSlug(getString(value.slug).trim() || title);
  if (!slug) return null;

  return {
    title,
    slug,
    status: isProjectStatus(value.status) ? value.status : "active",
    description: getString(value.description),
    startDate: getString(value.startDate, getToday()),
    deadline: getString(value.deadline).trim() || undefined,
    goals: getArray(value.goals)
      .map(normalizeProjectGoal)
      .filter((goal): goal is ProjectGoal => goal !== null),
  };
}

function normalizeUserSettings(value: unknown): ImportUserSettings | null {
  if (!isRecord(value)) return null;

  const settings: ImportUserSettings = {};

  if (typeof value.defaultCategory === "string") {
    settings.defaultCategory = value.defaultCategory;
  }

  if (isView(value.defaultView)) {
    settings.defaultView = value.defaultView;
  }

  if (isAppThemeKey(value.themePreference)) {
    settings.themePreference = value.themePreference;
  }

  return Object.keys(settings).length > 0 ? settings : null;
}

function parseBackup(rawBackup: unknown): BackupImportData {
  if (!isRecord(rawBackup)) {
    throw new Error("Το αρχείο δεν είναι έγκυρο JSON object.");
  }

  const appName = getString(rawBackup.app);
  const version = getNumber(rawBackup.version, 0);

  if (appName !== "Tenka Musō" && appName !== "Tenka Muso") {
    throw new Error("Το αρχείο δεν φαίνεται να είναι Tenka Musō backup.");
  }

  if (version !== 1) {
    throw new Error("Αυτό το backup version δεν υποστηρίζεται ακόμα.");
  }

  if (!isRecord(rawBackup.data)) {
    throw new Error("Το backup δεν έχει έγκυρο data section.");
  }

  const data = rawBackup.data;

  return {
    tasks: getArray(data.tasks)
      .map(normalizeTask)
      .filter((task): task is ImportTask => task !== null),
    dailyNotes: normalizeDailyNotes(data.dailyNotes),
    customCategories: getArray(data.customCategories)
      .map((category) => {
        if (isRecord(category)) return normalizeCategory(category.name);
        return normalizeCategory(category);
      })
      .filter((category): category is string => category !== null),
    userSettings: normalizeUserSettings(data.userSettings),
    goals: getArray(data.goals)
      .map(normalizeGoal)
      .filter((goal): goal is ImportGoal => goal !== null),
    projects: getArray(data.projects)
      .map(normalizeProject)
      .filter((project): project is ImportProject => project !== null),
  };
}

function buildCounts(data: BackupImportData): BackupImportCounts {
  return {
    tasks: data.tasks.length,
    dailyNotes: Object.keys(data.dailyNotes).length,
    customCategories: data.customCategories.length,
    userSettings: data.userSettings ? 1 : 0,
    goals: data.goals.length,
    projects: data.projects.length,
  };
}

function cleanUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(cleanUndefined);
  }

  if (!isRecord(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entryValue]) => entryValue !== undefined)
      .map(([entryKey, entryValue]) => [entryKey, cleanUndefined(entryValue)])
  );
}

export function useBackupImport(
  firebaseUser: User | null,
  existingCategories: string[]
) {
  const [preview, setPreview] = useState<BackupImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackupImportResult | null>(null);

  async function loadBackupFile(file: File | null) {
    setError(null);
    setResult(null);

    if (!file) return;

    try {
      const rawText = await file.text();
      const rawBackup = JSON.parse(rawText) as unknown;
      const data = parseBackup(rawBackup);
      const exportedAt = isRecord(rawBackup)
        ? getString(rawBackup.exportedAt).trim() || null
        : null;

      setPreview({
        fileName: file.name,
        exportedAt,
        counts: buildCounts(data),
        data,
      });
    } catch (readError) {
      console.error("Backup import preview failed:", readError);
      setPreview(null);
      setError(
        readError instanceof Error
          ? readError.message
          : "Δεν μπόρεσε να διαβαστεί το backup αρχείο."
      );
    }
  }

  function clearBackupImport() {
    setPreview(null);
    setError(null);
    setResult(null);
    setImporting(false);
  }

  async function confirmBackupImport() {
    if (!firebaseUser) {
      setError("Πρέπει να είσαι συνδεδεμένος για να κάνεις import.");
      return;
    }

    if (!preview) {
      setError("Διάλεξε πρώτα backup JSON αρχείο.");
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    const imported: BackupImportCounts = {
      tasks: 0,
      dailyNotes: 0,
      customCategories: 0,
      userSettings: 0,
      goals: 0,
      projects: 0,
    };

    const skipped: Partial<BackupImportCounts> = {};

    try {
      const userRoot = ["users", firebaseUser.uid] as const;
      let batch = writeBatch(db);
      let operationCount = 0;

      async function queueSet(
        ref: DocumentReference,
        payload: Record<string, unknown>,
        options?: SetOptions
      ) {
        if (options) {
          batch.set(ref, payload, options);
        } else {
          batch.set(ref, payload);
        }

        operationCount += 1;

        if (operationCount >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      }

      async function commitRemaining() {
        if (operationCount === 0) return;

        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
      }

      const existingCategoryLookup = new Set(
        existingCategories.map((category) => category.toLowerCase())
      );

      for (const task of preview.data.tasks) {
        const tasksRef = collection(db, ...userRoot, "tasks");
        const taskRef = doc(tasksRef);
        const cleanTask = cleanUndefined(task) as Record<string, unknown>;

        await queueSet(taskRef, {
          ...cleanTask,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        imported.tasks += 1;
      }

      for (const [date, content] of Object.entries(preview.data.dailyNotes)) {
        const dailyNoteRef = doc(db, ...userRoot, "dailyNotes", date);
        const existingDailyNote = await getDoc(dailyNoteRef);

        if (existingDailyNote.exists()) {
          skipped.dailyNotes = (skipped.dailyNotes ?? 0) + 1;
          continue;
        }

        await queueSet(dailyNoteRef, {
          date,
          content,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        imported.dailyNotes += 1;
      }

      for (const categoryName of preview.data.customCategories) {
        const normalizedCategoryName = categoryName.toLowerCase();

        if (existingCategoryLookup.has(normalizedCategoryName)) {
          skipped.customCategories = (skipped.customCategories ?? 0) + 1;
          continue;
        }

        const categoriesRef = collection(db, ...userRoot, "categories");
        const categoryRef = doc(categoriesRef);

        await queueSet(categoryRef, {
          name: categoryName,
          createdAt: serverTimestamp(),
        });

        existingCategoryLookup.add(normalizedCategoryName);
        imported.customCategories += 1;
      }

      if (preview.data.userSettings) {
        const settingsRef = doc(db, ...userRoot, "settings", "app");

        await queueSet(
          settingsRef,
          {
            defaultCategory:
              preview.data.userSettings.defaultCategory ?? "Δουλειά",
            defaultView: preview.data.userSettings.defaultView ?? "today",
            themePreference:
              preview.data.userSettings.themePreference ?? defaultAppThemeKey,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        imported.userSettings = 1;
      }

      for (const goal of preview.data.goals) {
        const goalsRef = collection(db, ...userRoot, "goals");
        const goalRef = doc(goalsRef);

        await queueSet(goalRef, {
          ...goal,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        imported.goals += 1;
      }

      for (const project of preview.data.projects) {
        const projectsRef = collection(db, ...userRoot, "projects");
        const projectRef = doc(projectsRef);
        const cleanProject = cleanUndefined(project) as Record<string, unknown>;

        await queueSet(projectRef, {
          ...cleanProject,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        imported.projects += 1;
      }

      await commitRemaining();

      setResult({ imported, skipped });
      setPreview(null);
    } catch (importError) {
      console.error("Backup import failed:", importError);
      setError("Το import απέτυχε. Δες το Console για περισσότερες λεπτομέρειες.");
    } finally {
      setImporting(false);
    }
  }

  return {
    preview,
    importing,
    error,
    result,
    loadBackupFile,
    confirmBackupImport,
    clearBackupImport,
  };
}
