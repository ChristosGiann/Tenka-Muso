import { theme } from "../styles/theme";

export type EmptyStateOptions = {
  eyebrow?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({
  eyebrow = "Empty state",
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateOptions) {
  return (
    <div className={`${theme.innerPanel} p-5`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-400">
        {eyebrow}
      </p>

      <h4 className="mt-2 text-lg font-black text-neutral-950">{title}</h4>

      <p className="mt-2 text-sm font-semibold leading-6 text-neutral-500">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`${theme.secondaryButton} mt-4`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}