import SavingsHistory from "./SavingsHistory";

function GoalCard({ goal, onOpen, onDelete, onAddSavings, onDeleteSaving }) {
  const targetAmount = Number(goal?.targetAmount) || 0;
  const currentAmount = Number(goal?.currentAmount) || 0;

  const remainingAmount = Math.max(targetAmount - currentAmount, 0);

  const progress =
    targetAmount > 0 ? Math.min((currentAmount / targetAmount) * 100, 100) : 0;

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      {/* GOAL NAME */}
      <h2 className="text-xl font-bold text-slate-900">
        {goal?.name || "Goal"}
      </h2>

      {/* TARGET */}
      <p className="mt-3 text-slate-600">
        Target: {goal?.currency || "₦"}
        {targetAmount.toLocaleString()}
      </p>

      {/* SAVED */}
      <p className="mt-2 text-slate-600">
        Saved: {goal?.currency || "₦"}
        {currentAmount.toLocaleString()}
      </p>

      <p className="mt-2 text-slate-600">
        Remaining: {goal?.currency || "₦"}
        {remainingAmount.toLocaleString()}
      </p>

      {progress >= 100 && (
        <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="font-semibold text-green-700">🎉 Goal Achieved!</p>

          <p className="mt-1 text-sm text-green-600">
            You have reached your savings target.
          </p>
        </div>
      )}

      {/* PROGRESS */}
      <div className="mt-5">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-slate-500">Progress</span>

          <span className="font-semibold text-slate-700">
            {progress.toFixed(0)}%
          </span>
        </div>

        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${
              progress >= 100 ? "bg-green-500" : "bg-indigo-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* TARGET DATE */}
      <p className="mt-4 text-sm text-slate-500">
        Target date: {goal?.targetDate || "No date"}
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <div className="mt-2 flex  gap-3">
          {/* EDIT BUTTON */}
          <button
            type="button"
            disabled={progress >= 100}
            onClick={() => onOpen(goal)}
            className={`mt-3 w-full rounded-lg px-4 py-3 font-medium transition ${
              progress >= 100
                ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-400"
                : "border border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            {progress >= 100 ? "🔒 Goal Completed" : "Edit Goal"}
          </button>

          {/* DELETE BUTTON */}
          <button
            type="button"
            onClick={() => onDelete(goal.id)}
            className="mt-3 w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
          >
            Delete Goal
          </button>
        </div>

        {/* ADD SAVINGS BUTTON */}
        <button
          type="button"
          disabled={progress >= 100}
          onClick={() => onAddSavings(goal)}
          className={`mt-2 w-full rounded-lg px-4 py-3 font-semibold transition ${
            progress >= 100
              ? "cursor-not-allowed bg-slate-300 text-slate-500"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {progress >= 100 ? "🔒 Savings Completed" : "Add Savings"}
        </button>
        <SavingsHistory goal={goal} onDeleteSaving={onDeleteSaving}  />
      </div>
    </div>
  );
}

export default GoalCard;
