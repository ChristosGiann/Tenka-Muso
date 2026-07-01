export type TaskStatus = "pending" | "done";
export type TaskType = "task" | "routine" | "backlog";
export type View =
  | "today"
  | "week"
  | "month"
  | "stats"
  | "backlog"
  | "search"
  | "profile";
export type BacklogPriority = "low" | "medium" | "high";
export type BacklogStatus = "idea" | "someday" | "planned";


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