import type { Dispatch, SetStateAction } from "react";
import type { Project, ProjectStatus, Task } from "../types";
import { getProjectLinkedTasks } from "../utils/projectMentions";
import type { ProjectFormState } from "../hooks/useProjects";
import { theme } from "../styles/theme";

type ProjectsViewProps = {
    projects: Project[];
    tasks: Task[];
    projectsLoading: boolean;
    projectForm: ProjectFormState;
    setProjectForm: Dispatch<SetStateAction<ProjectFormState>>;
    editingProjectId: string | null;
    onSaveProject: () => void | Promise<void>;
    onCancelEditProject: () => void;
    onEditProject: (project: Project) => void;
    onDeleteProject: (project: Project) => void;
    onUpdateProjectStatus: (
        projectId: string,
        status: ProjectStatus
    ) => void | Promise<void>;
};

function getProjectStatusLabel(status: ProjectStatus) {
    if (status === "active") return "Active";
    if (status === "paused") return "Paused";
    return "Completed";
}

export function ProjectsView({
    projects,
    tasks,
    projectsLoading,
    projectForm,
    setProjectForm,
    editingProjectId,
    onSaveProject,
    onCancelEditProject,
    onEditProject,
    onDeleteProject,
    onUpdateProjectStatus,
}: ProjectsViewProps) {
    return (
        <>
            <header className="mb-8">
                <p className={theme.eyebrow}>Projects</p>

                <h2 className={`${theme.title} ${theme.brushUnderline}`}>Projects</h2>

                <p className="mt-3 text-sm font-semibold text-[color:var(--tm-muted)]">
                    Οργάνωσε μεγάλα κομμάτια δουλειάς και σύνδεσέ τα αργότερα με tasks
                    μέσω mentions όπως <span className="font-bold">@tenka_muso</span>.
                </p>
            </header>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
                <section className={theme.card}>
                    <p className={theme.eyebrow}>
                        {editingProjectId ? "Edit project" : "New project"}
                    </p>

                    <h3 className={`${theme.sectionTitle} mt-2`}>
                        {editingProjectId ? "Επεξεργασία project" : "Δημιουργία project"}
                    </h3>

                    <form
                        className="mt-6 space-y-4"
                        onSubmit={(event) => {
                            event.preventDefault();
                            onSaveProject();
                        }}
                    >
                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-[color:var(--tm-secondary-text)]">
                                Title
                            </span>

                            <input
                                value={projectForm.title}
                                onChange={(event) =>
                                    setProjectForm((currentForm) => ({
                                        ...currentForm,
                                        title: event.target.value,
                                    }))
                                }
                                placeholder="Π.χ. Tenka Muso"
                                className={theme.inputFull}
                            />
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-[color:var(--tm-secondary-text)]">
                                Slug / mention
                            </span>

                            <input
                                value={projectForm.slug}
                                onChange={(event) =>
                                    setProjectForm((currentForm) => ({
                                        ...currentForm,
                                        slug: event.target.value,
                                    }))
                                }
                                placeholder="Π.χ. tenka_muso — αν μείνει άδειο βγαίνει από τον τίτλο"
                                className={theme.inputFull}
                            />

                            <p className="text-xs font-semibold text-[color:var(--tm-muted)]">
                                Αυτό θα χρησιμοποιηθεί αργότερα ως mention, π.χ. @tenka_muso.
                            </p>
                        </label>

                        <label className="block space-y-2">
                            <span className="text-sm font-bold text-[color:var(--tm-secondary-text)]">
                                Description
                            </span>

                            <textarea
                                value={projectForm.description}
                                onChange={(event) =>
                                    setProjectForm((currentForm) => ({
                                        ...currentForm,
                                        description: event.target.value,
                                    }))
                                }
                                placeholder="Τι είναι αυτό το project;"
                                className={`${theme.inputFull} min-h-28 resize-y`}
                            />
                        </label>

                        <div className="grid gap-4 md:grid-cols-3">
                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-[color:var(--tm-secondary-text)]">
                                    Status
                                </span>

                                <select
                                    value={projectForm.status}
                                    onChange={(event) =>
                                        setProjectForm((currentForm) => ({
                                            ...currentForm,
                                            status: event.target.value as ProjectStatus,
                                        }))
                                    }
                                    className={theme.inputFull}
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-[color:var(--tm-secondary-text)]">
                                    Start date
                                </span>

                                <input
                                    type="date"
                                    value={projectForm.startDate}
                                    onChange={(event) =>
                                        setProjectForm((currentForm) => ({
                                            ...currentForm,
                                            startDate: event.target.value,
                                        }))
                                    }
                                    className={theme.inputFull}
                                />
                            </label>

                            <label className="block space-y-2">
                                <span className="text-sm font-bold text-[color:var(--tm-secondary-text)]">
                                    Deadline
                                </span>

                                <input
                                    type="date"
                                    value={projectForm.deadline}
                                    onChange={(event) =>
                                        setProjectForm((currentForm) => ({
                                            ...currentForm,
                                            deadline: event.target.value,
                                        }))
                                    }
                                    className={theme.inputFull}
                                />
                            </label>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <button type="submit" className={theme.primaryButton}>
                                {editingProjectId ? "Update project" : "+ Add project"}
                            </button>

                            {editingProjectId && (
                                <button
                                    type="button"
                                    onClick={onCancelEditProject}
                                    className={theme.secondaryButton}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className={theme.card}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <p className={theme.eyebrow}>Saved projects</p>

                            <h3 className={`${theme.sectionTitle} mt-2`}>
                                Project list
                            </h3>
                        </div>

                        <span className={theme.badge}>{projects.length} projects</span>
                    </div>

                    {projectsLoading && (
                        <p className="mt-6 text-sm font-semibold text-[color:var(--tm-muted)]">
                            Φόρτωση projects...
                        </p>
                    )}

                    {!projectsLoading && projects.length === 0 && (
                        <div className={`${theme.innerPanel} mt-6 p-4`}>
                            <p className="text-sm font-semibold text-[color:var(--tm-muted)]">
                                Δεν έχεις projects ακόμα. Δημιούργησε το πρώτο project για να
                                αρχίσεις να οργανώνεις tasks γύρω από μεγαλύτερους στόχους.
                            </p>
                        </div>
                    )}

                    <div className="mt-6 space-y-4">
                        {projects.map((project) => {
                            const linkedTasks = getProjectLinkedTasks(tasks, project);

                            return (
                                <article key={project.id} className={`${theme.innerPanel} p-4`}>
                                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={theme.darkBadge}>
                                                    @{project.slug}
                                                </span>

                                                <span className={theme.badge}>
                                                    {getProjectStatusLabel(project.status)}
                                                </span>

                                                <span className={theme.badge}>
                                                    {linkedTasks.length} linked items
                                                </span>
                                            </div>

                                            <h4 className="mt-4 text-lg font-bold text-[color:var(--tm-title)]">
                                                {project.title}
                                            </h4>

                                            {project.description && (
                                                <p className="mt-2 text-sm font-semibold text-[color:var(--tm-muted)]">
                                                    {project.description}
                                                </p>
                                            )}

                                            <p className="mt-3 text-xs font-semibold text-[color:var(--tm-muted)]">
                                                Start: {project.startDate}
                                                {project.deadline ? ` · Deadline: ${project.deadline}` : ""}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2">
                                            <select
                                                value={project.status}
                                                onChange={(event) =>
                                                    onUpdateProjectStatus(
                                                        project.id,
                                                        event.target.value as ProjectStatus
                                                    )
                                                }
                                                className="min-h-10 rounded-xl border border-[color:var(--tm-border)] bg-[var(--tm-input-bg)] px-3 py-2 text-sm font-bold text-[color:var(--tm-input-text)]"
                                            >
                                                <option value="active">Active</option>
                                                <option value="paused">Paused</option>
                                                <option value="completed">Completed</option>
                                            </select>

                                            <button
                                                type="button"
                                                onClick={() => onEditProject(project)}
                                                className={theme.smallButton}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onDeleteProject(project)}
                                                className={theme.dangerButton}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
        </>
    );
}