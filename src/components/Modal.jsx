const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-2xl text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white"
          >
            x
          </button>
        </div>

        {children}
      </div>
    </div>
  );
};

export default Modal;