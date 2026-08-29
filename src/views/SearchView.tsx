import type { Project, Task, TaskType } from "../types";
import { theme } from "../styles/theme";
import { formatMinutes, getDurationMinutes } from "../utils/time";
import { EmptyState } from "../components/EmptyState";
import { ProjectMentionText } from "../components/ProjectMentionText";

type SearchStatusFilter = "pending" | "done" | "all";

type SearchResult =
  | {
      kind: "task";
      id: string;
      date: string;
      task: Task;
    }
  | {
      kind: "dailyNote";
      id: string;
      date: string;
      content: string;
    };

type SearchViewProps = {
  categories: string[];
  projects: Project[];
  searchResults: SearchResult[];
  searchQuery: string;
  searchCategoryFilter: string;
  searchTypeFilter: TaskType | "all";
  searchStatusFilter: SearchStatusFilter;
  searchDateFrom: string;
  searchDateTo: string;
  onSearchQueryChange: (value: string) => void;
  onSearchCategoryFilterChange: (value: string) => void;
  onSearchTypeFilterChange: (value: TaskType | "all") => void;
  onSearchStatusFilterChange: (value: SearchStatusFilter) => void;
  onSearchDateFromChange: (value: string) => void;
  onSearchDateToChange: (value: string) => void;
  onClearSearchFilters: () => void;
  onOpenDate: (date: string) => void;
  onEditTask: (task: Task) => void;
  onToggleDone: (taskId: string) => void | Promise<void>;
  onDeleteTask: (task: Task) => void;
  onOpenProject: (project: Project) => void;
};

export function SearchView({
  categories,
  projects,
  searchResults,
  searchQuery,
  searchCategoryFilter,
  searchTypeFilter,
  searchStatusFilter,
  searchDateFrom,
  searchDateTo,
  onSearchQueryChange,
  onSearchCategoryFilterChange,
  onSearchTypeFilterChange,
  onSearchStatusFilterChange,
  onSearchDateFromChange,
  onSearchDateToChange,
  onClearSearchFilters,
  onOpenDate,
  onEditTask,
  onToggleDone,
  onDeleteTask,
  onOpenProject,
}: SearchViewProps) {
  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    searchCategoryFilter !== "all" ||
    searchTypeFilter !== "all" ||
    searchStatusFilter !== "all" ||
    Boolean(searchDateFrom) ||
    Boolean(searchDateTo);

  return (
    <>
      <header className="mb-8">
        <p className={theme.eyebrow}>Search / Filters</p>

        <h2 className={`${theme.title} ${theme.brushUnderline}`}>
          Αναζήτηση
        </h2>

        <p className="mt-3 text-sm font-semibold text-neutral-500">
          Βρες παλιά tasks, routines, backlog items και daily journal notes.
        </p>
      </header>

      <div className="grid gap-8 xl:grid-cols-[0.9fr_1.4fr]">
        <aside className={theme.card}>
          <h3 className={`${theme.sectionTitle} ${theme.brushUnderline} mb-5`}>
            Φίλτρα
          </h3>

          <div className="space-y-4">
            <label className="space-y-2">
              <span className="block text-sm font-bold text-neutral-600">
                Search
              </span>

              <input
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Ψάξε τίτλο, category, notes..."
                className={theme.inputFull}
              />
            </label>

            <label className="space-y-2">
              <span className="block text-sm font-bold text-neutral-600">
                Category
              </span>

              <select
                value={searchCategoryFilter}
                onChange={(event) =>
                  onSearchCategoryFilterChange(event.target.value)
                }
                className={theme.inputFull}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  Type
                </span>

                <select
                  value={searchTypeFilter}
                  onChange={(event) =>
                    onSearchTypeFilterChange(event.target.value as TaskType | "all")
                  }
                  className={theme.inputFull}
                >
                  <option value="all">All types</option>
                  <option value="task">Task</option>
                  <option value="routine">Routine</option>
                  <option value="backlog">Backlog</option>
                </select>
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  Status
                </span>

                <select
                  value={searchStatusFilter}
                  onChange={(event) =>
                    onSearchStatusFilterChange(
                      event.target.value as SearchStatusFilter
                    )
                  }
                  className={theme.inputFull}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="done">Done</option>
                </select>
              </label>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  From
                </span>

                <input
                  type="date"
                  value={searchDateFrom}
                  onChange={(event) => onSearchDateFromChange(event.target.value)}
                  className={theme.inputFull}
                />
              </label>

              <label className="space-y-2">
                <span className="block text-sm font-bold text-neutral-600">
                  To
                </span>

                <input
                  type="date"
                  value={searchDateTo}
                  onChange={(event) => onSearchDateToChange(event.target.value)}
                  className={theme.inputFull}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={onClearSearchFilters}
              disabled={!hasActiveFilters}
              className={theme.secondaryButton}
            >
              Clear filters
            </button>

            <p className="text-sm font-semibold text-neutral-500">
              Τα daily journal notes εμφανίζονται μόνο όταν τα φίλτρα
              category/type/status είναι στο All.
            </p>
          </div>
        </aside>

        <section className={theme.card}>
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
                Αποτελέσματα
              </h3>

              <p className="mt-3 text-sm font-semibold text-neutral-500">
                {searchResults.length} αποτελέσματα
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {searchResults.length === 0 && (
              <EmptyState
                eyebrow="Search"
                title="Δεν βρέθηκαν αποτελέσματα."
                description="Δοκίμασε πιο γενική αναζήτηση ή καθάρισε κάποια φίλτρα. Τα daily journal notes εμφανίζονται μόνο όταν category/type/status είναι στο All."
              />
            )}

            {searchResults.map((result) => {
              if (result.kind === "dailyNote") {
                return (
                  <div key={result.id} className={`${theme.innerPanel} p-4`}>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={theme.darkBadge}>Daily note</span>
                      <span className={theme.badge}>{result.date}</span>
                    </div>

                    <p className="text-sm leading-6 text-neutral-600">
                      {result.content}
                    </p>

                    <button
                      type="button"
                      onClick={() => onOpenDate(result.date)}
                      className={`${theme.primaryButton} mt-4 text-sm`}
                    >
                      Άνοιγμα ημέρας
                    </button>
                  </div>
                );
              }

              const task = result.task;
              const duration = getDurationMinutes(task.startTime, task.endTime);

              return (
                <div
                  key={result.id}
                  className="flex flex-col gap-3 rounded-2xl border border-neutral-300/80 bg-stone-50/75 p-4 transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(23,23,23,0.08)] md:flex-row md:items-center md:justify-between"
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
                      <ProjectMentionText
                        text={task.notes}
                        projects={projects}
                        onOpenProject={onOpenProject}
                        className="mt-2 text-sm text-neutral-600"
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenDate(task.date)}
                      className={theme.smallButton}
                    >
                      Open day
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className={theme.smallButton}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onToggleDone(task.id)}
                      className={
                        task.status === "done"
                          ? theme.smallButton
                          : "rounded-xl bg-neutral-950 px-4 py-2 text-sm font-bold text-stone-50 transition hover:bg-neutral-800"
                      }
                    >
                      {task.status === "done" ? "Undo" : "Done"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteTask(task)}
                      className={theme.dangerButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}