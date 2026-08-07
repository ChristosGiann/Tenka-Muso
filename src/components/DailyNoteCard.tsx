import { theme } from "../styles/theme";

type DailyNoteCardProps = {
  selectedDate: string;
  dailyNoteDraft: string;
  dailyNotesLoading: boolean;
  dailyNoteSaving: boolean;
  dailyNoteSaved: boolean;
  dailyNoteError: string | null;
  onDailyNoteDraftChange: (value: string) => void;
  onSaveDailyNote: () => void | Promise<void>;
};

export function DailyNoteCard({
  selectedDate,
  dailyNoteDraft,
  dailyNotesLoading,
  dailyNoteSaving,
  dailyNoteSaved,
  dailyNoteError,
  onDailyNoteDraftChange,
  onSaveDailyNote,
}: DailyNoteCardProps) {
  return (
    <div className={theme.card}>
      <div className="mb-5">
        <p className={theme.eyebrow}>Daily Journal</p>

        <h3 className={`${theme.sectionTitle} ${theme.brushUnderline}`}>
          Σημείωση ημέρας
        </h3>

        <p className="mt-3 text-sm font-semibold text-neutral-500">
          {selectedDate}
        </p>
      </div>

      <textarea
        value={dailyNoteDraft}
        onChange={(event) => onDailyNoteDraftChange(event.target.value)}
        disabled={dailyNotesLoading}
        placeholder="Γράψε ελεύθερα πώς πήγε η ημέρα, τι έμαθες, τι θέλεις να θυμάσαι..."
        className={`${theme.inputFull} min-h-40 resize-y leading-6`}
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSaveDailyNote}
          disabled={dailyNoteSaving || dailyNotesLoading}
          className={theme.primaryButton}
        >
          {dailyNoteSaving ? "Saving..." : "Save note"}
        </button>

        {dailyNotesLoading && (
          <p className="text-sm font-semibold text-neutral-500">
            Φόρτωση note...
          </p>
        )}

        {dailyNoteSaved && (
          <p className="text-sm font-semibold text-neutral-700">
            Αποθηκεύτηκε.
          </p>
        )}

        {dailyNoteError && (
          <p className="text-sm font-semibold text-neutral-700">
            {dailyNoteError}
          </p>
        )}
      </div>
    </div>
  );
}