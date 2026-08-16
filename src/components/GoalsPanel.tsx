import type { Dispatch, SetStateAction } from "react";

import type { Goal, GoalMetric, GoalPeriod } from "../types";
import type { GoalFormState } from "../hooks/useGoals";
import { theme } from "../styles/theme";

type GoalsPanelProps = {
  categories: string[];
  goals: Goal[];
  goalsLoading: boolean;
  goalForm: GoalFormState;
  setGoalForm: Dispatch<SetStateAction<GoalFormState>>;
  editingGoalId: string | null;
  onSaveGoal: () => void | Promise<void>;
  onCancelEditGoal: () => void;
  onEditGoal: (goal: Goal) => void;
  onDeleteGoal: (goal: Goal) => void;
  onToggleGoalActive: (goalId: string) => void | Promise<void>;
};

function getGoalMetricLabel(metric: GoalMetric) {
  if (metric === "hours") return "hours";
  if (metric === "completions") return "completed tasks";
  return "count";
}

function getGoalPeriodLabel(period: GoalPeriod) {
  return period === "weekly" ? "weekly" : "monthly";
}

export function GoalsPanel({
  categories,
  goals,
  goalsLoading,
  goalForm,
  setGoalForm,
  editingGoalId,
  onSaveGoal,
  onCancelEditGoal,
  onEditGoal,
  onDeleteGoal,
  onToggleGoalActive,
}: GoalsPanelProps) {
  return (
    <div className={`${theme.card} mt-8`}>
      <div className="mb-5">
        <p className={theme.eyebrow}>Goals</p>

        <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
          Στόχοι προόδου
        </h3>

        <p className="mt-3 text-sm font-semibold text-neutral-500">
          Φτιάξε στόχους ανά κατηγορία, όπως Coding 10 ώρες/εβδομάδα ή
          Training 4 sessions/εβδομάδα.
        </p>
      </div>

      <div className={`${theme.innerPanel} mb-6 space-y-4 p-4`}>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={goalForm.title}
            onChange={(event) =>
              setGoalForm({
                ...goalForm,
                title: event.target.value,
              })
            }
            placeholder="Τίτλος π.χ. Coding weekly goal"
            className={theme.input}
          />

          <select
            value={goalForm.category}
            onChange={(event) =>
              setGoalForm({
                ...goalForm,
                category: event.target.value,
              })
            }
            className={theme.input}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="0"
            step="0.25"
            value={goalForm.targetValue}
            onChange={(event) =>
              setGoalForm({
                ...goalForm,
                targetValue: event.target.value,
              })
            }
            placeholder="Target π.χ. 10"
            className={theme.input}
          />

          <select
            value={goalForm.metric}
            onChange={(event) =>
              setGoalForm({
                ...goalForm,
                metric: event.target.value as GoalMetric,
              })
            }
            className={theme.input}
          >
            <option value="hours">Hours</option>
            <option value="completions">Completed tasks</option>
            <option value="count">Count</option>
          </select>

          <select
            value={goalForm.period}
            onChange={(event) =>
              setGoalForm({
                ...goalForm,
                period: event.target.value as GoalPeriod,
              })
            }
            className={theme.input}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <label className="flex items-center gap-3 rounded-xl border border-neutral-300 bg-stone-100 px-4 py-3 text-sm font-bold text-neutral-700">
            <input
              type="checkbox"
              checked={goalForm.active}
              onChange={(event) =>
                setGoalForm({
                  ...goalForm,
                  active: event.target.checked,
                })
              }
            />
            Active goal
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSaveGoal}
            className={theme.primaryButton}
          >
            {editingGoalId ? "Update goal" : "+ Add goal"}
          </button>

          {editingGoalId && (
            <button
              type="button"
              onClick={onCancelEditGoal}
              className={theme.secondaryButton}
            >
              Cancel edit
            </button>
          )}
        </div>
      </div>

      {goalsLoading && (
        <p className="text-sm font-semibold text-neutral-500">
          Φόρτωση goals...
        </p>
      )}

      {!goalsLoading && goals.length === 0 && (
        <div className={`${theme.innerPanel} p-4 text-sm font-semibold text-neutral-500`}>
          Δεν έχεις goals ακόμα. Πρόσθεσε έναν πρώτο στόχο για να αρχίσεις να
          μετράς πρόοδο.
        </div>
      )}

      {!goalsLoading && goals.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {goals.map((goal) => (
            <div key={goal.id} className={`${theme.innerPanel} p-4`}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className={theme.badge}>{goal.category}</span>
                <span className={theme.badge}>
                  {getGoalPeriodLabel(goal.period)}
                </span>
                <span className={goal.active ? theme.darkBadge : theme.badge}>
                  {goal.active ? "active" : "inactive"}
                </span>
              </div>

              <h4 className="text-lg font-bold text-neutral-950">
                {goal.title}
              </h4>

              <p className="mt-2 text-sm font-semibold text-neutral-600">
                Target: {goal.targetValue} {getGoalMetricLabel(goal.metric)}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => onEditGoal(goal)}
                  className={theme.smallButton}
                >
                  Edit
                </button>

                <button
                  type="button"
                  onClick={() => onToggleGoalActive(goal.id)}
                  className={theme.smallButton}
                >
                  {goal.active ? "Pause" : "Activate"}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteGoal(goal)}
                  className={theme.dangerButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}