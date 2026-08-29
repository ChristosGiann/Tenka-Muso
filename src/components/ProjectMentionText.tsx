import { useMemo, type ReactNode } from "react";
import type { Project } from "../types";
import { theme } from "../styles/theme";

type ProjectMentionTextProps = {
  text: string;
  projects: Project[];
  onOpenProject: (project: Project) => void;
  className?: string;
};

const projectMentionPattern = /@([a-zA-Z0-9_\-\u0370-\u03ff]+)/g;

export function ProjectMentionText({
  text,
  projects,
  onOpenProject,
  className = "",
}: ProjectMentionTextProps) {
  const projectBySlug = useMemo(() => {
    return new Map(
      projects.map((project) => [project.slug.toLowerCase(), project])
    );
  }, [projects]);

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(projectMentionPattern)) {
    const fullMatch = match[0];
    const slug = match[1];
    const matchIndex = match.index ?? 0;

    if (matchIndex > lastIndex) {
      parts.push(text.slice(lastIndex, matchIndex));
    }

    const project = projectBySlug.get(slug.toLowerCase());

    if (project) {
      parts.push(
        <button
          key={`${slug}-${matchIndex}`}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpenProject(project);
          }}
          className={`${theme.darkBadge} mx-0.5 align-baseline transition hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(23,23,23,0.18)]`}
          title={`Open project ${project.title}`}
        >
          @{slug}
        </button>
      );
    } else {
      parts.push(
        <span
          key={`${slug}-${matchIndex}`}
          className="font-bold text-[color:var(--tm-title)]"
          title="Project mention without matching project"
        >
          @{slug}
        </span>
      );
    }

    lastIndex = matchIndex + fullMatch.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <p className={`whitespace-pre-wrap ${className}`}>{parts}</p>;
}
