function GoalCard({ goal, onAddSavings, onEdit, onDelete }) {
  const saved = goal.saved ?? 0;

  const percentage = Math.min(
    goal.target > 0 ? (saved / goal.target) * 100 : 0,
    100,
  );

  const remaining = goal.target - saved;

  // const remaining = goal.target - goal.saved;

  return (
    <div className="rounded-xl bg-white p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-3xl">{goal.icon}</span>

        <div>
          <h2 className="text-xl font-bold">{goal.title}</h2>

          <p className="text-sm text-slate-500">
            Target Date: {goal.targetDate || "Not Set"}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p>
          <strong>Target:</strong> ₦{goal.target.toLocaleString()}
        </p>

        <p>
          <strong>Saved:</strong> ₦{(goal.saved ?? 0).toLocaleString()}
        </p>

        <p>
          <strong>Remaining:</strong> ₦{remaining.toLocaleString()}
        </p>
      </div>

      {/* Progress Bar */}

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-right text-sm text-slate-500">
        {percentage.toFixed(0)}%
      </p>

      <div className="mt-6 space-y-3">
        <button
          onClick={() => onAddSavings(goal)}
          className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white"
        >
          Add Savings
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onEdit(goal)}
            className="rounded-lg bg-blue-600 py-3 text-white"
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(goal)}
            className="rounded-lg bg-red-600 py-3 text-white"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalCard;
