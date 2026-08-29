import type { Project, Task } from "../types";

const projectMentionPattern = /(^|\s)@([a-zA-Z0-9_\-\u0370-\u03ff]+)/g;

export function extractProjectMentionSlugs(text: string) {
  const slugs = new Set<string>();

  for (const match of text.matchAll(projectMentionPattern)) {
    const slug = match[2]?.trim().toLowerCase();

    if (slug) {
      slugs.add(slug);
    }
  }

  return Array.from(slugs);
}

export function taskMentionsProject(task: Task, project: Project) {
  const mentionedSlugs = extractProjectMentionSlugs(task.notes);

  return mentionedSlugs.includes(project.slug.toLowerCase());
}

export function getProjectLinkedTasks(tasks: Task[], project: Project) {
  return tasks.filter((task) => taskMentionsProject(task, project));
}