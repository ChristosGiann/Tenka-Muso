import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import type {
  BacklogPriority,
  BacklogStatus,
  RoutineRecurrence,
  Task,
  TaskStatus,
  TaskType,
  WeekdayNumber,
} from "../types";
import { getToday } from "../utils/date";

export const defaultRoutineRecurrence: RoutineRecurrence = {
  type: "weekly",
  weekdays: [1, 2, 3, 4, 5, 6, 7],
};

export type TaskFormState = {
  title: string;
  type: TaskType;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  notes: string;
  priority: BacklogPriority;
  backlogStatus: BacklogStatus;
  recurrence: RoutineRecurrence;
};

export function createEmptyTaskForm(
  defaultCategory: string,
  date: string
): TaskFormState {
  return {
    title: "",
    type: "task",
    category: defaultCategory,
    date,
    startTime: "",
    endTime: "",
    notes: "",
    priority: "medium",
    backlogStatus: "idea",
    recurrence: defaultRoutineRecurrence,
  };
}

type SaveTaskInput = {
  editingTaskId: string | null;
  form: TaskFormState;
};

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

function getRoutineRecurrence(value: unknown): RoutineRecurrence | undefined {
  if (
    typeof value !== "object" ||
    value === null ||
    !("type" in value) ||
    !("weekdays" in value)
  ) {
    return undefined;
  }

  const recurrence = value as {
    type?: unknown;
    weekdays?: unknown;
  };

  if (recurrence.type !== "weekly" || !Array.isArray(recurrence.weekdays)) {
    return undefined;
  }

  const weekdays = recurrence.weekdays.filter(isWeekdayNumber);

  if (weekdays.length === 0) {
    return undefined;
  }

  return {
    type: "weekly",
    weekdays,
  };
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "pending" || value === "done";
}

function getTaskStatusRecord(
  value: unknown
): Record<string, TaskStatus> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value).filter(([, recordValue]) => isTaskStatus(recordValue))
  ) as Record<string, TaskStatus>;
}

function getBooleanRecord(value: unknown): Record<string, boolean> | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      ([, recordValue]) => typeof recordValue === "boolean"
    )
  ) as Record<string, boolean>;
}

export function useTasks(firebaseUser: User | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setTasks([]);
      setTasksLoading(true);
      return;
    }

    setTasksLoading(true);

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
            recurrence: getRoutineRecurrence(data.recurrence),
            routineCompletions: getTaskStatusRecord(data.routineCompletions),
            routineSkips: getBooleanRecord(data.routineSkips),
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

  async function saveTask({ editingTaskId, form }: SaveTaskInput) {
    if (!firebaseUser) return;
    if (!form.title.trim()) return;

    if (editingTaskId) {
      const currentTask = tasks.find((task) => task.id === editingTaskId);
      const taskRef = doc(db, "users", firebaseUser.uid, "tasks", editingTaskId);

      const taskPayload = {
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
        ...(form.type === "routine"
          ? {
              recurrence: form.recurrence,
              ...(currentTask?.type === "routine"
                ? {}
                : {
                    routineCompletions: {},
                    routineSkips: {},
                  }),
            }
          : {
              recurrence: deleteField(),
              routineCompletions: deleteField(),
              routineSkips: deleteField(),
            }),
      };

      await updateDoc(taskRef, taskPayload);

      return;
    }

    const tasksRef = collection(db, "users", firebaseUser.uid, "tasks");

    const taskPayload = {
      title: form.title.trim(),
      type: form.type,
      category: form.category,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      status: "pending" as TaskStatus,
      notes: form.notes.trim(),
      priority: form.priority,
      backlogStatus: form.backlogStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...(form.type === "routine"
        ? {
            recurrence: form.recurrence,
            routineCompletions: {},
            routineSkips: {},
          }
        : {}),
    };

    await addDoc(tasksRef, taskPayload);
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

  async function scheduleBacklogItem(task: Task, scheduleDate: string) {
    if (!firebaseUser) return;
    if (!scheduleDate) return;

    const taskRef = doc(db, "users", firebaseUser.uid, "tasks", task.id);

    await updateDoc(taskRef, {
      type: "task",
      date: scheduleDate,
      status: "pending",
      backlogStatus: "planned",
      recurrence: deleteField(),
      routineCompletions: deleteField(),
      routineSkips: deleteField(),
      updatedAt: serverTimestamp(),
    });
  }

  return {
    tasks,
    tasksLoading,
    saveTask,
    toggleDone,
    deleteTask,
    scheduleBacklogItem,
  };
}