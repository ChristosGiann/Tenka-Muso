import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import type { BacklogPriority, BacklogStatus, Task, TaskType } from "../types";
import { getToday } from "../utils/date";

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
  };
}

type SaveTaskInput = {
  editingTaskId: string | null;
  form: TaskFormState;
};

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

      return;
    }

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