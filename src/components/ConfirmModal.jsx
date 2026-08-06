function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-2xl font-bold">{title}</h2>

        <p className="text-slate-600">{message}</p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg bg-slate-300 px-5 py-2 font-semibold"
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
