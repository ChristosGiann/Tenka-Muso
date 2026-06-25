import type { ConfirmModalState } from "../types";

type ConfirmModalProps = {
  confirmModal: ConfirmModalState | null;
  onClose: () => void;
};

export function ConfirmModal({ confirmModal, onClose }: ConfirmModalProps) {
  if (!confirmModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-bold text-slate-950">
          {confirmModal.title}
        </h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {confirmModal.message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          {confirmModal.cancelText && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
            >
              {confirmModal.cancelText}
            </button>
          )}

          <button
            type="button"
            onClick={async () => {
              await confirmModal.onConfirm();
              onClose();
            }}
            className={`rounded-xl px-5 py-3 text-sm font-bold text-white ${
              confirmModal.danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-slate-950 hover:bg-slate-800"
            }`}
          >
            {confirmModal.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}