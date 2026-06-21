import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
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

import { auth, db } from "./lib/firebase";
import type {
  ConfirmModalState,
  CustomCategory,
  Task,
  TaskType,
  View,
} from "./types";

import { defaultCategories } from "./constants/categories";
import { getCalendarDays, getMonthFromDate, getToday, weekDays } from "./utils/date";
import { formatMinutes, getDurationMinutes } from "./utils/time";
import { buildStats } from "./utils/stats";
import "./App.css";

function App() {
  const [activeView, setActiveView] = useState<View>("today");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(getMonthFromDate(getToday()));
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getToday());

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  const [form, setForm] = useState({
    title: "",
    type: "task" as TaskType,
    category: "Δουλειά",
    date: getToday(),
    startTime: "",
    endTime: "",
    notes: "",
  });

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showCategories, setShowCategories] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

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

  const backlogItems = useMemo(() => {
    return tasks.filter((task) => task.type === "backlog");
  }, [tasks]);

  const todayStats = buildStats(dayTasks, categories);
  const monthStats = buildStats(monthTasks, categories);
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setFirebaseUser(user);
        setAuthLoading(false);
        return;
      }

      signInAnonymously(auth).catch((error) => {
        console.error("Anonymous sign-in failed:", error);
        setAuthLoading(false);
        setTasksLoading(false);
      });
    });

    return () => unsubscribe();
  }, []);

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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    setForm({
      title: "",
      type: "task",
      category: "Δουλειά",
      date: selectedDate,
      startTime: "",
      endTime: "",
      notes: "",
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
        category: "Δουλειά",
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
    });
  }

  function cancelEditTask() {
    setEditingTaskId(null);

    setForm({
      title: "",
      type: "task",
      category: "Δουλειά",
      date: selectedDate,
      startTime: "",
      endTime: "",
      notes: "",
    });
  }

  function renderStatsCards(stats: ReturnType<typeof buildStats>) {
    return (
      <section className="mb-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Tasks</p>
          <p className="mt-2 text-3xl font-bold">{stats.totalTasks}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Done</p>
          <p className="mt-2 text-3xl font-bold">{stats.doneTasks}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Logged Time</p>
          <p className="mt-2 text-3xl font-bold">
            {formatMinutes(stats.totalMinutes)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">Completion</p>
          <p className="mt-2 text-3xl font-bold">{stats.completionRate}%</p>
        </div>
      </section>
    );
  }

  function renderCategoryStats(stats: ReturnType<typeof buildStats>) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xl font-bold">Ώρες ανά κατηγορία</h3>

        <div className="space-y-3">
          {stats.minutesByCategory.map((item) => (
            <div key={item.category}>
              <div className="mb-1 flex justify-between text-sm font-semibold">
                <span>{item.category}</span>
                <span>{formatMinutes(item.total)}</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-950"
                  style={{
                    width: `${Math.min((item.total / 480) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderTaskList(taskList: Task[], emptyMessage: string) {
    return (
      <div className="space-y-3">
        {taskList.length === 0 && (
          <p className="rounded-xl bg-slate-50 p-4 text-slate-500">
            {emptyMessage}
          </p>
        )}

        {taskList.map((task) => {
          const duration = getDurationMinutes(task.startTime, task.endTime);

          return (
            <div
              key={task.id}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {task.category}
                  </span>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {task.type}
                  </span>

                  {duration > 0 && (
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-bold text-white">
                      {formatMinutes(duration)}
                    </span>
                  )}
                </div>

                <h4 className="mt-2 text-lg font-bold">
                  {task.status === "done" ? "✓ " : ""}
                  {task.title}
                </h4>

                <p className="text-sm text-slate-500">
                  {task.startTime && task.endTime
                    ? `${task.date} • ${task.startTime} - ${task.endTime}`
                    : task.date}
                </p>

                {task.notes && (
                  <p className="mt-2 text-sm text-slate-600">{task.notes}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => startEditTask(task)}
                  className="rounded-xl bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700"
                >
                  Edit
                </button>

                <button
                  onClick={() => toggleDone(task.id)}
                  className="rounded-xl bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700"
                >
                  {task.status === "done" ? "Undo" : "Done"}
                </button>

                <button
                  onClick={() => requestDeleteTask(task)}
                  className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
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

  function renderConfirmModal() {
    if (!confirmModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <h3 className="text-xl font-bold text-slate-950">
            {confirmModal.title}
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            {confirmModal.message}
          </p>

          <div className="mt-6 flex justify-end gap-3">
            {confirmModal.cancelText && (
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
              >
                {confirmModal.cancelText}
              </button>
            )}

            <button
              type="button"
              onClick={async () => {
                await confirmModal.onConfirm();
                setConfirmModal(null);
              }}
              className={`rounded-xl px-5 py-3 text-sm font-bold text-white ${confirmModal.danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-950 hover:bg-slate-800"
                }`}
            >
              {confirmModal.confirmText}
            </button>
          </div>
        </div>
      </div>
    );
  }

  function renderForm() {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-xl font-bold">
          {editingTaskId ? "Επεξεργασία task" : "Νέο task / routine / backlog item"}
        </h3>

        <div className="grid gap-3 md:grid-cols-2">
          <input
            placeholder="Τίτλος π.χ. Προπόνηση πόδια"
            value={form.title}
            onChange={(event) =>
              setForm({ ...form, title: event.target.value })
            }
            className="rounded-xl border border-slate-200 px-4 py-3"
          />

          <select
            value={form.type}
            onChange={(event) =>
              setForm({
                ...form,
                type: event.target.value as TaskType,
              })
            }
            className="rounded-xl border border-slate-200 px-4 py-3"
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
            className="rounded-xl border border-slate-200 px-4 py-3"
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
              className="min-w-0 flex-1 rounded-xl border border-slate-200 p-3"
            />

            <button
              type="button"
              onClick={addCategory}
              className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              Add
            </button>

            <button
              type="button"
              onClick={() => setShowCategories((currentValue) => !currentValue)}
              className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              {showCategories ? "Hide" : "Show"}
            </button>
          </div>
          {showCategories && (
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-semibold text-slate-500">
                Custom categories
              </p>

              {customCategories.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                  Δεν έχεις custom categories ακόμα.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {customCategories.map((category) => (
                    <span
                      key={category.id}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-700"
                    >
                      {category.name}

                      <button
                        type="button"
                        onClick={() => requestDeleteCategory(category)}
                        className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 hover:bg-red-200"
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
            className="rounded-xl border border-slate-200 px-4 py-3"
          />

          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <label className="space-y-2">
              <span className="block text-sm font-bold text-slate-600">
                Ώρα έναρξης
              </span>

              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  setForm({ ...form, startTime: event.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-bold text-slate-600">
                Ώρα λήξης
              </span>

              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  setForm({ ...form, endTime: event.target.value })
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3"
              />
            </label>
          </div>

          <textarea
            placeholder="Σημειώσεις"
            value={form.notes}
            onChange={(event) =>
              setForm({ ...form, notes: event.target.value })
            }
            className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 md:col-span-2"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={saveTask}
            className="rounded-xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            {editingTaskId ? "Update task" : "+ Add"}
          </button>

          {editingTaskId && (
            <button
              onClick={cancelEditTask}
              className="rounded-xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-200"
            >
              Cancel edit
            </button>
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
            <p className="text-sm font-semibold text-slate-500">
              Today Dashboard
            </p>
            <h2 className="text-3xl font-bold">Ημέρα, tasks και χρόνος</h2>
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
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          />
        </header>

        {renderStatsCards(todayStats)}

        <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
          <section className="space-y-6">
            {renderForm()}

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Timeline ημέρας</h3>
                <p className="text-sm font-semibold text-slate-500">
                  {selectedDate}
                </p>
              </div>

              {renderTaskList(dayTasks, "Δεν έχεις tasks για αυτή την ημέρα.")}
            </div>
          </section>

          <aside className="space-y-6">
            {renderCategoryStats(todayStats)}

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="mb-4 text-xl font-bold">Backlog</h3>

              <div className="space-y-3">
                {backlogItems.length === 0 && (
                  <p className="text-sm text-slate-500">
                    Δεν έχεις backlog items ακόμα.
                  </p>
                )}

                {backlogItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="rounded-xl bg-slate-50 p-4">
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.category}</p>
                    {item.notes && (
                      <p className="mt-2 text-sm text-slate-600">
                        {item.notes}
                      </p>
                    )}
                  </div>
                ))}

                {backlogItems.length > 5 && (
                  <button
                    onClick={() => setActiveView("backlog")}
                    className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white"
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
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Calendar μήνα</h3>
            <p className="text-sm font-semibold text-slate-500">
              Πάτα σε μια ημέρα για να δεις τα stats της.
            </p>
          </div>

          <p className="text-sm font-bold text-slate-500">{selectedMonth}</p>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-bold text-slate-500"
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
            const isSelectedCalendarDay = calendarDay.date === selectedCalendarDate;

            return (
              <button
                key={calendarDay.date}
                type="button"
                onClick={() => {
                  setSelectedCalendarDate(calendarDay.date);
                }}
                className={`min-h-28 rounded-2xl border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${isSelectedCalendarDay
                  ? "border-slate-950 bg-slate-950 text-white"
                  : calendarDay.isCurrentMonth
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50 text-slate-400"
                  } ${isToday ? "ring-2 ring-blue-500 ring-offset-2" : ""}`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-bold">
                    {calendarDay.dayNumber}
                  </span>

                  {isToday && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isSelectedCalendarDay
                        ? "bg-white text-slate-950"
                        : "bg-blue-100 text-blue-700"
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
                      className={`text-sm font-semibold ${isSelectedCalendarDay ? "text-white/50" : "text-slate-300"
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

  function renderMonthView() {
    return (
      <>
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              Monthly Overview
            </p>
            <h2 className="text-3xl font-bold">Μηνιαία εικόνα</h2>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => {
              const newMonth = event.target.value;

              setSelectedMonth(newMonth);
              setSelectedCalendarDate(`${newMonth}-01`);
            }}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
          />
        </header>

        {renderStatsCards(monthStats)}

        <div className="grid gap-8 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="space-y-8">
            {renderMonthCalendar()}

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-bold">Tasks μήνα</h3>
                <p className="text-sm font-semibold text-slate-500">
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
        {renderCategoryStats(selectedCalendarStats)}

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-500">
            Επιλεγμένη ημέρα
          </p>

          <h3 className="mt-1 text-2xl font-bold">{selectedCalendarDate}</h3>

          <div className="mt-4 space-y-2 text-sm font-semibold text-slate-700">
            <p>Tasks: {selectedCalendarStats.totalTasks}</p>
            <p>Done: {selectedCalendarStats.doneTasks}</p>
            <p>
              Χρόνος: {formatMinutes(selectedCalendarStats.totalMinutes)}
            </p>
            <p>Completion: {selectedCalendarStats.completionRate}%</p>
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
            className="mt-5 w-full rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800"
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
          <p className="text-sm font-semibold text-slate-500">
            All-time Dashboard
          </p>
          <h2 className="text-3xl font-bold">Συνολικά στατιστικά</h2>
        </header>

        {renderStatsCards(allTimeStats)}

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          {renderCategoryStats(allTimeStats)}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">Σύνοψη</h3>

            <div className="space-y-3 text-sm font-semibold text-slate-700">
              <p>Συνολικά tasks: {allTimeStats.totalTasks}</p>
              <p>Ολοκληρωμένα tasks: {allTimeStats.doneTasks}</p>
              <p>Συνολικός χρόνος: {formatMinutes(allTimeStats.totalMinutes)}</p>
              <p>Backlog items: {backlogItems.length}</p>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderBacklogView() {
    return (
      <>
        <header className="mb-8">
          <p className="text-sm font-semibold text-slate-500">
            Ideas / Later / Watchlist
          </p>
          <h2 className="text-3xl font-bold">Backlog</h2>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
          {renderForm()}

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">Όλα τα backlog items</h3>

            <div className="space-y-3">
              {backlogItems.length === 0 && (
                <p className="rounded-xl bg-slate-50 p-4 text-slate-500">
                  Δεν έχεις backlog items ακόμα.
                </p>
              )}

              {backlogItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-slate-500">{item.category}</p>
                    {item.notes && (
                      <p className="mt-2 text-sm text-slate-600">
                        {item.notes}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => requestDeleteTask(item)}
                    className="rounded-xl bg-red-100 px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  const views: { id: View; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "month", label: "Month" },
    { id: "stats", label: "Stats" },
    { id: "backlog", label: "Backlog" },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 border-r border-slate-200 bg-white p-6 lg:block">
          <div className="mb-10">
            <p className="text-sm font-semibold text-slate-400">
              Personal System
            </p>
            <h1 className="text-2xl font-bold">Life Journal</h1>
          </div>

          <nav className="space-y-2">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`w-full rounded-xl px-4 py-3 text-left text-sm font-semibold ${activeView === view.id
                  ? "bg-slate-950 text-white"
                  : "text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {view.label}
              </button>
            ))}
          </nav>

          <div className="mt-10 rounded-2xl bg-slate-950 p-4 text-white">
            <p className="text-sm text-slate-300">Current view</p>
            <p className="mt-2 text-lg font-bold">{activeView}</p>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-8">
          <div className="mb-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm">
            {authLoading
              ? "Σύνδεση με Firebase..."
              : firebaseUser
                ? `Firebase anonymous user: ${firebaseUser.uid.slice(0, 8)}...`
                : "Δεν υπάρχει Firebase user."}
          </div>
          {tasksLoading && (
            <div className="mb-4 rounded-2xl bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm">
              Φόρτωση tasks από Firestore...
            </div>
          )}
          <div className="mb-4 flex gap-2 overflow-x-auto lg:hidden">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`rounded-xl px-4 py-2 text-sm font-bold ${activeView === view.id
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600"
                  }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {activeView === "today" && renderTodayView()}
          {activeView === "month" && renderMonthView()}
          {activeView === "stats" && renderStatsView()}
          {activeView === "backlog" && renderBacklogView()}
        </main>
      </div>
      {renderConfirmModal()}
    </div>
  );
}

export default App;