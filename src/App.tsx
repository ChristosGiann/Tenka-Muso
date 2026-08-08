import { lazy, Suspense, useMemo, useRef, useState } from "react";
import { useAuthUser } from "./hooks/useAuthUser";
import {
  createEmptyTaskForm,
  defaultRoutineRecurrence,
  type TaskFormState,
  useTasks,
} from "./hooks/useTasks";
import { useCategories } from "./hooks/useCategories";
import { useDailyNotes } from "./hooks/useDailyNotes";
import {
  defaultUserSettings,
  useUserSettings,
} from "./hooks/useUserSettings";
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
} from "./utils/date";
import { getDurationMinutes } from "./utils/time";
import { buildStats } from "./utils/stats";
import { theme } from "./styles/theme";
import "./App.css";

import { ConfirmModal } from "./components/ConfirmModal";
import { TaskForm } from "./components/TaskForm";
import { AuthPanel } from "./components/AuthPanel";
import { DailyNoteCard } from "./components/DailyNoteCard";
import { Sidebar } from "./components/Sidebar";
import { MobileNavigation } from "./components/MobileNavigation";

const TodayView = lazy(() =>
  import("./views/TodayView").then((module) => ({
    default: module.TodayView,
  }))
);

const WeekView = lazy(() =>
  import("./views/WeekView").then((module) => ({
    default: module.WeekView,
  }))
);

const MonthView = lazy(() =>
  import("./views/MonthView").then((module) => ({
    default: module.MonthView,
  }))
);

const StatsView = lazy(() =>
  import("./views/StatsView").then((module) => ({
    default: module.StatsView,
  }))
);

const BacklogView = lazy(() =>
  import("./views/BacklogView").then((module) => ({
    default: module.BacklogView,
  }))
);

const SearchView = lazy(() =>
  import("./views/SearchView").then((module) => ({
    default: module.SearchView,
  }))
);

const ProfileView = lazy(() =>
  import("./views/ProfileView").then((module) => ({
    default: module.ProfileView,
  }))
);

function ViewLoadingFallback() {
  return (
    <div className={`${theme.cardSoft} text-sm font-semibold text-neutral-600`}>
      Φόρτωση view...
    </div>
  );
}

function App() {
  const [activeView, setActiveView] = useState<View>("today");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [selectedWeekDate, setSelectedWeekDate] = useState(getToday());
  const [selectedMonth, setSelectedMonth] = useState(
    getMonthFromDate(getToday())
  );
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(getToday());

  const [form, setForm] = useState<TaskFormState>(() =>
    createEmptyTaskForm(defaultUserSettings.defaultCategory, getToday())
  );

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(
    null
  );

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
  const [searchTypeFilter, setSearchTypeFilter] = useState<TaskType | "all">(
    "all"
  );
  const [searchStatusFilter, setSearchStatusFilter] = useState<
    "pending" | "done" | "all"
  >("all");
  const [searchDateFrom, setSearchDateFrom] = useState("");
  const [searchDateTo, setSearchDateTo] = useState("");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const taskFormRef = useRef<HTMLDivElement | null>(null);
  const taskTitleInputRef = useRef<HTMLInputElement | null>(null);

  const {
    firebaseUser,
    authLoading,
    authError,
    authActionLoading,
    profileNameDraft,
    profileNameSaving,
    profileNameSaved,
    profileNameError,
    updateProfileNameDraft,
    signInWithGoogle,
    signOutUser,
    saveProfileName,
  } = useAuthUser();

  const {
    userSettings,
    settingsLoading,
    settingsSaving,
    settingsSaved,
    settingsError,
    updateDefaultCategory,
    updateDefaultView,
    updateThemePreference,
    saveUserSettings,
  } = useUserSettings(firebaseUser);

  const {
    tasks,
    tasksLoading,
    saveTask: saveTaskDocument,
    toggleDone,
    deleteTask,
    scheduleBacklogItem: scheduleBacklogItemDocument,
  } = useTasks(firebaseUser);

  const {
    customCategories,
    addCategory: addCategoryDocument,
    deleteCategory: deleteCategoryDocument,
  } = useCategories(firebaseUser);

  const {
    dailyNotes,
    dailyNoteDraft,
    dailyNotesLoading,
    dailyNoteSaving,
    dailyNoteSaved,
    dailyNoteError,
    updateDailyNoteDraft,
    saveDailyNote,
  } = useDailyNotes(firebaseUser, selectedDate);

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
        backlogCategoryFilter === "all" ||
        item.category === backlogCategoryFilter;

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
          searchCategoryFilter === "all" ||
          task.category === searchCategoryFilter;

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
          !normalizedSearchQuery ||
          searchableText.includes(normalizedSearchQuery);

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
          !normalizedSearchQuery ||
          searchableText.includes(normalizedSearchQuery);

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
    return [...taskSearchResults, ...dailyNoteSearchResults].sort(
      (first, second) => second.date.localeCompare(first.date)
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

  async function handleSignOut() {
    setEditingTaskId(null);
    setConfirmModal(null);
    setBacklogScheduleDates({});

    await signOutUser();
  }

  async function saveTask() {
    if (!form.title.trim()) return;

    await saveTaskDocument({
      editingTaskId,
      form,
    });

    setEditingTaskId(null);
    setForm(createEmptyTaskForm(userSettings.defaultCategory, selectedDate));
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
    const addedCategoryName = await addCategoryDocument(
      newCategoryName,
      categories
    );

    setNewCategoryName("");

    if (!addedCategoryName) return;

    setForm((currentForm) => ({
      ...currentForm,
      category: addedCategoryName,
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
    await deleteCategoryDocument(category);

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
      recurrence: task.recurrence ?? defaultRoutineRecurrence,
    });
  }

  function cancelEditTask() {
    setEditingTaskId(null);
    setForm(createEmptyTaskForm(userSettings.defaultCategory, selectedDate));
  }

  function openQuickAddTask() {
    setEditingTaskId(null);
    setMobileMenuOpen(false);
    setActiveView("today");

    setForm(createEmptyTaskForm(userSettings.defaultCategory, selectedDate));

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
        onDailyNoteDraftChange={updateDailyNoteDraft}
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
        selectedCalendarDate={selectedCalendarDate}
        selectedCalendarDailyNote={dailyNotes[selectedCalendarDate]}
        monthStats={monthStats}
        selectedCalendarStats={selectedCalendarStats}
        monthTasks={monthTasks}
        selectedCalendarTasks={selectedCalendarTasks}
        calendarDays={calendarDays}
        onSelectedMonthChange={(newMonth) => {
          setSelectedMonth(newMonth);
          setSelectedCalendarDate(`${newMonth}-01`);
        }}
        onSelectedCalendarDateChange={setSelectedCalendarDate}
        onOpenDate={openDateInTodayView}
        onEditTask={startEditTask}
        onEditAgendaTask={startEditTaskFromSearch}
        onToggleDone={toggleDone}
        onDeleteTask={requestDeleteTask}
      />
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
        onProfileNameDraftChange={updateProfileNameDraft}
        onSaveProfileName={saveProfileName}
        onDefaultCategoryChange={updateDefaultCategory}
        onDefaultViewChange={updateDefaultView}
        onThemePreferenceChange={updateThemePreference}
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
    const scheduleDate = getBacklogScheduleDate(task.id);
    if (!scheduleDate) return;

    await scheduleBacklogItemDocument(task, scheduleDate);

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
                <div
                  className={`${theme.cardSoft} mb-4 text-sm font-semibold text-neutral-600`}
                >
                  Φόρτωση tasks από Firestore...
                </div>
              )}

              <Suspense fallback={<ViewLoadingFallback />}>
                {activeView === "today" && renderTodayView()}
                {activeView === "week" && renderWeekView()}
                {activeView === "month" && renderMonthView()}
                {activeView === "stats" && renderStatsView()}
                {activeView === "backlog" && renderBacklogView()}
                {activeView === "search" && renderSearchView()}
                {activeView === "profile" && renderProfileView()}
              </Suspense>

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