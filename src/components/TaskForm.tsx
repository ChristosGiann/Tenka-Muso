import type { Dispatch, RefObject, SetStateAction } from "react";

import type {
  BacklogPriority,
  BacklogStatus,
  CustomCategory,
  TaskType,
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
};

type TaskFormProps = {
  form: TaskFormValues;
  setForm: Dispatch<SetStateAction<TaskFormValues>>;
  editingTaskId: string | null;
  categories: string[];
  customCategories: CustomCategory[];
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

export function TaskForm({
  form,
  setForm,
  editingTaskId,
  categories,
  customCategories,
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
  return (
    <div ref={taskFormRef} className={theme.card}>
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