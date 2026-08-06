function GoalCard({ goal, onAddSavings, onEdit, onDelete }) {
  const saved = goal.saved ?? 0;

  const percentage = Math.min(
    goal.target > 0 ? (saved / goal.target) * 100 : 0,
    100,
  );

  const remaining = goal.target - saved;

  const completed = saved >= goal.target;
  const exceeded = Math.max(saved - goal.target, 0);

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

        {completed ? (
          <div className="rounded-lg bg-green-50 p-3 border border-green-200">
            <p className="font-semibold text-green-700">🎉 Goal Achieved!</p>

            {exceeded > 0 && (
              <p className="mt-1 text-sm text-green-600">
                Exceeded Target by ₦{exceeded.toLocaleString()}
              </p>
            )}
          </div>
        ) : (
          <p>
            <strong>Remaining:</strong> ₦{remaining.toLocaleString()}
          </p>
        )}
      </div>

      {/* Progress Bar */}

      <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            percentage >= 100 ? "bg-green-500" : "bg-indigo-600"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-right text-sm text-slate-500">
        {percentage.toFixed(0)}%
      </p>

      <div className="mt-6 space-y-3">
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => onAddSavings(goal)}
            disabled={completed}
            className={`w-full rounded-lg py-3 font-semibold text-white transition ${
              completed
                ? "cursor-not-allowed bg-slate-400"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {completed ? "🎉 Goal Completed" : "Add Savings"}
          </button>

          {!completed && (
            <button
              onClick={() => onEdit(goal)}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Edit
            </button>
          )}

          <button
            onClick={() => onDelete(goal)}
            className={`${completed ? "w-full" : "flex-1"} rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700`}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalCard;
