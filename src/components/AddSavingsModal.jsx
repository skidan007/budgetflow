import { useState } from "react";

function AddSavingsModal({ goal, onClose, onSave }) {
  const [amount, setAmount] = useState("");

  if (!goal) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    const savingsAmount = Number(amount);

    if (!savingsAmount || savingsAmount <= 0) {
      return;
    }

    onSave(savingsAmount);
    setAmount("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Add Savings
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Add money to your {goal.name} goal.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-slate-400 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* CURRENT SAVINGS */}
        <div className="my-5 rounded-lg bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Current savings
            </span>

            <span className="font-semibold text-slate-900">
              {goal.currency || "₦"}
              {Number(goal.currentAmount || 0).toLocaleString(
                undefined,
                {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                },
              )}
            </span>
          </div>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Amount to add
          </label>

          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 50000"
            className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />

          {/* BUTTONS */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              Add Savings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSavingsModal;