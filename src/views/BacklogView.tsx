import type { ReactNode } from "react";

import type { BacklogPriority, BacklogStatus, Project, Task } from "../types";
import { theme } from "../styles/theme";
import { EmptyState } from "../components/EmptyState";
import { ProjectMentionText } from "../components/ProjectMentionText";

type BacklogSort = "newest" | "priority" | "category";

type BacklogViewProps = {
  categories: string[];
  projects: Project[];
  filteredBacklogItems: Task[];
  backlogItemsCount: number;
  backlogCategoryFilter: string;
  backlogPriorityFilter: BacklogPriority | "all";
  backlogStatusFilter: BacklogStatus | "all";
  backlogSort: BacklogSort;
  renderForm: () => ReactNode;
  getBacklogScheduleDate: (taskId: string) => string;
  onBacklogCategoryFilterChange: (value: string) => void;
  onBacklogPriorityFilterChange: (value: BacklogPriority | "all") => void;
  onBacklogStatusFilterChange: (value: BacklogStatus | "all") => void;
  onBacklogSortChange: (value: BacklogSort) => void;
  onBacklogScheduleDateChange: (taskId: string, date: string) => void;
  onEditTask: (task: Task) => void;
  onScheduleBacklogItem: (task: Task) => void | Promise<void>;
  onDeleteTask: (task: Task) => void;
  onOpenProject: (project: Project) => void;
};

export function BacklogView({
  categories,
  projects,
  filteredBacklogItems,
  backlogItemsCount,
  backlogCategoryFilter,
  backlogPriorityFilter,
  backlogStatusFilter,
  backlogSort,
  renderForm,
  getBacklogScheduleDate,
  onBacklogCategoryFilterChange,
  onBacklogPriorityFilterChange,
  onBacklogStatusFilterChange,
  onBacklogSortChange,
  onBacklogScheduleDateChange,
  onEditTask,
  onScheduleBacklogItem,
  onDeleteTask,
  onOpenProject,
}: BacklogViewProps) {
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
                {filteredBacklogItems.length}/{backlogItemsCount} items · Διάλεξε
                ημερομηνία σε κάθε item
              </p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 md:grid-cols-4">
            <select
              value={backlogCategoryFilter}
              onChange={(event) => onBacklogCategoryFilterChange(event.target.value)}
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
                onBacklogPriorityFilterChange(
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
                onBacklogStatusFilterChange(
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
                onBacklogSortChange(event.target.value as BacklogSort)
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
              <EmptyState
                eyebrow={backlogItemsCount === 0 ? "Backlog" : "Filters"}
                title={
                  backlogItemsCount === 0
                    ? "Το backlog είναι άδειο."
                    : "Δεν υπάρχουν backlog items με αυτά τα φίλτρα."
                }
                description={
                  backlogItemsCount === 0
                    ? "Χρησιμοποίησε τη φόρμα αριστερά και διάλεξε type Backlog για να αποθηκεύσεις ιδέες για αργότερα."
                    : "Δοκίμασε να αλλάξεις category, priority, status ή sort ώστε να εμφανιστούν περισσότερα items."
                }
              />
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
                    <ProjectMentionText
                      text={item.notes}
                      projects={projects}
                      onOpenProject={onOpenProject}
                      className="mt-2 text-sm text-neutral-600"
                    />
                  )}
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <label className="w-full space-y-2 md:w-44">
                    <span className="block text-xs font-bold uppercase tracking-[0.14em] text-neutral-400">
                      Schedule date
                    </span>

                    <input
                      type="date"
                      value={getBacklogScheduleDate(item.id)}
                      onChange={(event) =>
                        onBacklogScheduleDateChange(item.id, event.target.value)
                      }
                      className={theme.inputFull}
                    />
                  </label>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <button
                      type="button"
                      onClick={() => onEditTask(item)}
                      className={theme.smallButton}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onScheduleBacklogItem(item)}
                      className="rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50 transition hover:bg-neutral-800"
                    >
                      Schedule
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(item)}
                      className={theme.dangerButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}