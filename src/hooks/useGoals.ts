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
import type { Goal, GoalMetric, GoalPeriod } from "../types";

export type GoalFormState = {
  title: string;
  category: string;
  targetValue: string;
  metric: GoalMetric;
  period: GoalPeriod;
  active: boolean;
};

type SaveGoalInput = {
  editingGoalId: string | null;
  form: GoalFormState;
};

export function createEmptyGoalForm(defaultCategory: string): GoalFormState {
  return {
    title: "",
    category: defaultCategory,
    targetValue: "",
    metric: "hours",
    period: "weekly",
    active: true,
  };
}

function isGoalMetric(value: unknown): value is GoalMetric {
  return value === "hours" || value === "completions" || value === "count";
}

function isGoalPeriod(value: unknown): value is GoalPeriod {
  return value === "weekly" || value === "monthly";
}

function getGoalMetric(value: unknown): GoalMetric {
  return isGoalMetric(value) ? value : "hours";
}

function getGoalPeriod(value: unknown): GoalPeriod {
  return isGoalPeriod(value) ? value : "weekly";
}

function getTargetValue(value: unknown): number {
  if (typeof value !== "number") {
    return 0;
  }

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, value);
}

function getBoolean(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

export function useGoals(firebaseUser: User | null) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) {
      setGoals([]);
      setGoalsLoading(true);
      return;
    }

    setGoalsLoading(true);

    const goalsRef = collection(db, "users", firebaseUser.uid, "goals");
    const goalsQuery = query(goalsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      goalsQuery,
      (snapshot) => {
        const firestoreGoals: Goal[] = snapshot.docs.map((docSnapshot) => {
          const data = docSnapshot.data();

          return {
            id: docSnapshot.id,
            title: data.title ?? "",
            category: data.category ?? "Προσωπικά",
            targetValue: getTargetValue(data.targetValue),
            metric: getGoalMetric(data.metric),
            period: getGoalPeriod(data.period),
            active: getBoolean(data.active, true),
          };
        });

        setGoals(firestoreGoals);
        setGoalsLoading(false);
      },
      (error) => {
        console.error("Firestore goals listener failed:", error);
        setGoalsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  async function saveGoal({ editingGoalId, form }: SaveGoalInput) {
    if (!firebaseUser) return;
    if (!form.title.trim()) return;

    const targetValue = Number(form.targetValue);

    if (!Number.isFinite(targetValue) || targetValue <= 0) {
      return;
    }

    if (editingGoalId) {
      const goalRef = doc(db, "users", firebaseUser.uid, "goals", editingGoalId);

      await updateDoc(goalRef, {
        title: form.title.trim(),
        category: form.category,
        targetValue,
        metric: form.metric,
        period: form.period,
        active: form.active,
        updatedAt: serverTimestamp(),
      });

      return;
    }

    const goalsRef = collection(db, "users", firebaseUser.uid, "goals");

    await addDoc(goalsRef, {
      title: form.title.trim(),
      category: form.category,
      targetValue,
      metric: form.metric,
      period: form.period,
      active: form.active,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  async function deleteGoal(goalId: string) {
    if (!firebaseUser) return;

    const goalRef = doc(db, "users", firebaseUser.uid, "goals", goalId);
    await deleteDoc(goalRef);
  }

  async function toggleGoalActive(goalId: string) {
    if (!firebaseUser) return;

    const goal = goals.find((currentGoal) => currentGoal.id === goalId);
    if (!goal) return;

    const goalRef = doc(db, "users", firebaseUser.uid, "goals", goalId);

    await updateDoc(goalRef, {
      active: !goal.active,
      updatedAt: serverTimestamp(),
    });
  }

  return {
    goals,
    goalsLoading,
    saveGoal,
    deleteGoal,
    toggleGoalActive,
  };
}