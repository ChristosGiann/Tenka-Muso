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
import type { Project, ProjectGoal, ProjectStatus } from "../types";
import { getToday } from "../utils/date";

export type ProjectFormState = {
  title: string;
  slug: string;
  status: ProjectStatus;
  description: string;
  startDate: string;
  deadline: string;
};

type SaveProjectInput = {
  editingProjectId: string | null;
  form: ProjectFormState;
};

type SaveProjectGoalInput = {
  project: Project;
  title: string;
  dueDate: string;
};

export function createEmptyProjectForm(): ProjectFormState {
  return {
    title: "",
    slug: "",
    status: "active",
    description: "",
    startDate: getToday(),
    deadline: "",
  };
}

function isProjectStatus(value: unknown): value is ProjectStatus {
  return (
    value === "active" || value === "paused" || value === "completed"
  );
}

function getProjectStatus(value: unknown): ProjectStatus {
  return isProjectStatus(value) ? value : "active";
}

function getProjectGoals(value: unknown): ProjectGoal[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((goal): goal is ProjectGoal => {
      return (
        typeof goal === "object" &&
        goal !== null &&
        "id" in goal &&
        "title" in goal &&
        "completed" in goal &&
        typeof goal.id === "string" &&
        typeof goal.title === "string" &&
        typeof goal.completed === "boolean"
      );
    })
    .map((goal) => ({
      id: goal.id,
      title: goal.title,
      completed: goal.completed,
      dueDate:
        "dueDate" in goal && typeof goal.dueDate === "string" && goal.dueDate.trim()
          ? goal.dueDate
          : undefined,
    }));
}

export function createProjectSlug(title: string) {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-\u0370-\u03ff]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function createProjectGoalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useProjects(firebaseUser: User | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setProjects([]);
      setProjectsLoading(true);
      return;
    }

    setProjectsLoading(true);

    const projectsRef = collection(db, "users", firebaseUser.uid, "projects");
    const projectsQuery = query(projectsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const loadedProjects: Project[] = snapshot.docs.map((projectDoc) => {
          const data = projectDoc.data();

          const title =
            typeof data.title === "string" ? data.title : "Untitled project";

          const slug =
            typeof data.slug === "string" && data.slug.trim()
              ? data.slug
              : createProjectSlug(title);

          return {
            id: projectDoc.id,
            title,
            slug,
            status: getProjectStatus(data.status),
            description:
              typeof data.description === "string" ? data.description : "",
            startDate:
              typeof data.startDate === "string" ? data.startDate : getToday(),
            deadline:
              typeof data.deadline === "string" && data.deadline.trim()
                ? data.deadline
                : undefined,
            goals: getProjectGoals(data.goals),
          };
        });

        setProjects(loadedProjects);
        setProjectsLoading(false);
      },
      (error) => {
        console.error("Firestore projects listener failed:", error);
        setProjectsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  async function saveProject({ editingProjectId, form }: SaveProjectInput) {
    if (!firebaseUser) return;

    const title = form.title.trim();
    if (!title) return;

    const slug = form.slug.trim()
      ? createProjectSlug(form.slug)
      : createProjectSlug(title);

    if (!slug) return;

    const projectPayload = {
      title,
      slug,
      status: form.status,
      description: form.description.trim(),
      startDate: form.startDate || getToday(),
      deadline: form.deadline.trim() || null,
      updatedAt: serverTimestamp(),
    };

    if (editingProjectId) {
      const projectRef = doc(
        db,
        "users",
        firebaseUser.uid,
        "projects",
        editingProjectId
      );

      await updateDoc(projectRef, projectPayload);
      return;
    }

    const projectsRef = collection(db, "users", firebaseUser.uid, "projects");

    await addDoc(projectsRef, {
      ...projectPayload,
      goals: [],
      createdAt: serverTimestamp(),
    });
  }

  async function deleteProject(projectId: string) {
    if (!firebaseUser) return;

    const projectRef = doc(db, "users", firebaseUser.uid, "projects", projectId);

    await deleteDoc(projectRef);
  }

  async function updateProjectStatus(
    projectId: string,
    status: ProjectStatus
  ) {
    if (!firebaseUser) return;

    const projectRef = doc(db, "users", firebaseUser.uid, "projects", projectId);

    await updateDoc(projectRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  }

  async function addProjectGoal({
    project,
    title,
    dueDate,
  }: SaveProjectGoalInput) {
    if (!firebaseUser) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const projectRef = doc(db, "users", firebaseUser.uid, "projects", project.id);

    const nextGoal: ProjectGoal = {
      id: createProjectGoalId(),
      title: trimmedTitle,
      completed: false,
    };

    const trimmedDueDate = dueDate.trim();

    if (trimmedDueDate) {
      nextGoal.dueDate = trimmedDueDate;
    }

    await updateDoc(projectRef, {
      goals: [...project.goals, nextGoal],
      updatedAt: serverTimestamp(),
    });
  }

  async function toggleProjectGoalCompleted(project: Project, goalId: string) {
    if (!firebaseUser) return;

    const projectRef = doc(db, "users", firebaseUser.uid, "projects", project.id);

    const nextGoals = project.goals.map((goal) =>
      goal.id === goalId
        ? {
            ...goal,
            completed: !goal.completed,
          }
        : goal
    );

    await updateDoc(projectRef, {
      goals: nextGoals,
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteProjectGoal(project: Project, goalId: string) {
    if (!firebaseUser) return;

    const projectRef = doc(db, "users", firebaseUser.uid, "projects", project.id);

    const nextGoals = project.goals.filter((goal) => goal.id !== goalId);

    await updateDoc(projectRef, {
      goals: nextGoals,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    projects,
    projectsLoading,
    saveProject,
    deleteProject,
    updateProjectStatus,
    addProjectGoal,
    toggleProjectGoalCompleted,
    deleteProjectGoal,
  };
}