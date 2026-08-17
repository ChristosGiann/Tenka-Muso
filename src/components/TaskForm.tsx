import {
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

import type {
  BacklogPriority,
  BacklogStatus,
  CustomCategory,
  Project,
  RoutineRecurrence,
  TaskType,
  WeekdayNumber,
} from "../types";
import { theme } from "../styles/theme";

export type TaskFormValues = {
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

type TaskFormProps = {
  form: TaskFormValues;
  setForm: Dispatch<SetStateAction<TaskFormValues>>;
  editingTaskId: string | null;
  categories: string[];
  customCategories: CustomCategory[];
  projects: Project[];
  newCategoryName: string;
  showCategories: boolean;
  taskFormRef: RefObject<HTMLDivElement | null>;
  taskTitleInputRef: RefObject<HTMLInputElement | null>;
  onNewCategoryNameChange: (value: string) => void;
  onAddCategory: () => void;
  onToggleCategories: () => void;
  onRequestDeleteCategory: (category: CustomCategory) => void;
  onSaveTask: () => void;
  onCancelEdit: () => void;
};

const weekdayOptions: { value: WeekdayNumber; label: string }[] = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
];

export function TaskForm({
  form,
  setForm,
  editingTaskId,
  categories,
  customCategories,
  projects,
  newCategoryName,
  showCategories,
  taskFormRef,
  taskTitleInputRef,
  onNewCategoryNameChange,
  onAddCategory,
  onToggleCategories,
  onRequestDeleteCategory,
  onSaveTask,
  onCancelEdit,
}: TaskFormProps) {

  const notesTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  const [projectMentionQuery, setProjectMentionQuery] = useState<string | null>(
    null
  );

  const [projectMentionRange, setProjectMentionRange] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const projectMentionSuggestions = useMemo(() => {
    if (!projectMentionQuery) return [];

    const normalizedQuery = projectMentionQuery.toLowerCase();

    return projects
      .filter((project) => {
        return (
          project.slug.toLowerCase().includes(normalizedQuery) ||
          project.title.toLowerCase().includes(normalizedQuery)
        );
      })
      .slice(0, 6);
  }, [projects, projectMentionQuery]);

  function clearProjectMentionSuggestions() {
    setProjectMentionQuery(null);
    setProjectMentionRange(null);
  }

  function updateProjectMentionState(value: string, caretPosition: number | null) {
    if (caretPosition === null) {
      clearProjectMentionSuggestions();
      return;
    }

    const textBeforeCaret = value.slice(0, caretPosition);
    const mentionMatch = /(^|\s)@([a-zA-Z0-9_\-\u0370-\u03ff]*)$/.exec(
      textBeforeCaret
    );

    if (!mentionMatch || mentionMatch[2].length === 0) {
      clearProjectMentionSuggestions();
      return;
    }

    const query = mentionMatch[2];
    const mentionStart = caretPosition - query.length - 1;

    setProjectMentionQuery(query);
    setProjectMentionRange({
      start: mentionStart,
      end: caretPosition,
    });
  }

  function insertProjectMention(project: Project) {
    if (!projectMentionRange) return;

    const insertedMention = `@${project.slug} `;
    const nextNotes = `${form.notes.slice(
      0,
      projectMentionRange.start
    )}${insertedMention}${form.notes.slice(projectMentionRange.end)}`;

    const nextCaretPosition = projectMentionRange.start + insertedMention.length;

    setForm({
      ...form,
      notes: nextNotes,
    });

    clearProjectMentionSuggestions();

    window.setTimeout(() => {
      notesTextareaRef.current?.focus();
      notesTextareaRef.current?.setSelectionRange(
        nextCaretPosition,
        nextCaretPosition
      );
    }, 0);
  }

  function toggleRoutineWeekday(weekday: WeekdayNumber) {
    const weekdays = form.recurrence.weekdays;
    const weekdayIsSelected = weekdays.includes(weekday);

    if (weekdayIsSelected && weekdays.length === 1) {
      return;
    }

    const nextWeekdays = weekdayIsSelected
      ? weekdays.filter((currentWeekday) => currentWeekday !== weekday)
      : [...weekdays, weekday].sort((first, second) => first - second);

    setForm({
      ...form,
      recurrence: {
        type: "weekly",
        weekdays: nextWeekdays,
      },
    });
  }

  return (
    <div ref={taskFormRef} className={`relative z-40 ${theme.card}`}>
      <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
        {editingTaskId ? "Επεξεργασία task" : "Νέο task / routine / backlog item"}
      </h3>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          ref={taskTitleInputRef}
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
            onChange={(event) => onNewCategoryNameChange(event.target.value)}
            placeholder="Νέα κατηγορία π.χ. Gaming"
            className={`${theme.input} min-w-0 flex-1`}
          />

          <button
            type="button"
            onClick={onAddCategory}
            className={theme.secondaryButton}
          >
            Add
          </button>

          <button
            type="button"
            onClick={onToggleCategories}
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
                      onClick={() => onRequestDeleteCategory(category)}
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

        {form.type === "routine" && (
          <div className={`${theme.innerPanel} space-y-3 p-4 md:col-span-2`}>
            <div>
              <p className="text-sm font-bold text-neutral-700">
                Repeat on weekdays
              </p>
              <p className="text-xs font-semibold text-neutral-500">
                Για routine, το date λειτουργεί ως start date. Το routine θα
                εμφανίζεται μόνο στις επιλεγμένες ημέρες.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {weekdayOptions.map((weekday) => {
                const selected = form.recurrence.weekdays.includes(
                  weekday.value
                );

                return (
                  <button
                    key={weekday.value}
                    type="button"
                    onClick={() => toggleRoutineWeekday(weekday.value)}
                    className={
                      selected
                        ? "rounded-full bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50"
                        : "rounded-full border border-neutral-300 bg-stone-100 px-4 py-2 text-sm font-bold text-neutral-600"
                    }
                  >
                    {weekday.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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

        <div className="relative z-50 md:col-span-2">
          <textarea
            ref={notesTextareaRef}
            placeholder="Σημειώσεις — γράψε @ και γράμμα για να συνδέσεις project"
            value={form.notes}
            onChange={(event) => {
              const nextNotes = event.target.value;

              setForm({ ...form, notes: nextNotes });
              updateProjectMentionState(nextNotes, event.target.selectionStart);
            }}
            onClick={(event) =>
              updateProjectMentionState(
                event.currentTarget.value,
                event.currentTarget.selectionStart
              )
            }
            onKeyUp={(event) =>
              updateProjectMentionState(
                event.currentTarget.value,
                event.currentTarget.selectionStart
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                clearProjectMentionSuggestions();
              }
            }}
            className={`${theme.input} min-h-24`}
          />

          {projectMentionSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-[9999] mt-2 overflow-hidden rounded-2xl border border-[color:var(--tm-border)] bg-[var(--tm-card-bg)] shadow-[0_14px_35px_rgba(23,23,23,0.16)]">
              <div className="border-b border-[color:var(--tm-border-soft)] px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[color:var(--tm-muted)]">
                  Project mentions
                </p>
              </div>

              <div className="max-h-64 overflow-y-auto p-2">
                {projectMentionSuggestions.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      insertProjectMention(project);
                    }}
                    className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-[var(--tm-secondary-hover)]"
                  >
                    <span className="block text-sm font-bold text-[color:var(--tm-title)]">
                      @{project.slug}
                    </span>

                    <span className="mt-1 block text-xs font-semibold text-[color:var(--tm-muted)]">
                      {project.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onSaveTask}
          className={theme.primaryButton}
        >
          {editingTaskId ? "Update task" : "+ Add"}
        </button>

        {editingTaskId && (
          <button
            type="button"
            onClick={onCancelEdit}
            className={theme.secondaryButton}
          >
            Cancel edit
          </button>
        )}
      </div>
    </div>
  );
}