export type TaskStatus = "pending" | "done";
export type TaskType = "task" | "routine" | "backlog";

export type View =
  | "today"
  | "week"
  | "month"
  | "stats"
  | "backlog"
  | "search"
  | "projects"
  | "profile";

export type BacklogPriority = "low" | "medium" | "high";
export type BacklogStatus = "idea" | "someday" | "planned";

export type GoalPeriod = "weekly" | "monthly";
export type GoalMetric = "hours" | "completions" | "count";

export type Goal = {
  id: string;
  title: string;
  category: string;
  targetValue: number;
  metric: GoalMetric;
  period: GoalPeriod;
  active: boolean;
};

export type WeekdayNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type RoutineRecurrence = {
  type: "weekly";
  weekdays: WeekdayNumber[];
};

export type Task = {
  id: string;
  title: string;
  type: TaskType;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TaskStatus;
  notes: string;
  priority?: BacklogPriority;
  backlogStatus?: BacklogStatus;
  recurrence?: RoutineRecurrence;
  routineCompletions?: Record<string, TaskStatus>;
  routineSkips?: Record<string, boolean>;
  isRoutineOccurrence?: boolean;
  routineStartDate?: string;
};

export type CustomCategory = {
  id: string;
  name: string;
};

export type ConfirmModalState = {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
};

export type CalendarDay = {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
};

export type ProjectStatus = "active" | "paused" | "completed";

export type ProjectGoal = {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  status: ProjectStatus;
  description: string;
  startDate: string;
  deadline?: string;
  goals: ProjectGoal[];
};