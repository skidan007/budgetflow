function BudgetProgress({ category, budget, spent }) {
  const safeBudget = Number(budget) || 0;
  const safeSpent = Number(spent) || 0;
  const remaining = safeBudget - safeSpent;
  const isOverBudget = remaining < 0;

  const percentage = Math.min(
    safeBudget > 0 ? (safeSpent / safeBudget) * 100 : safeSpent > 0 ? 100 : 0,
    100,
  );

  const progressColor =
    percentage < 70
      ? "bg-green-500"
      : percentage < 100
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h3 className="mb-4 text-xl font-semibold">{category}</h3>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-slate-500">Budget</span>

          <span className="font-semibold">₦{safeBudget.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Spent</span>

          <span className="font-semibold">₦{safeSpent.toLocaleString()}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">
            {isOverBudget ? "Over Budget" : "Remaining"}
          </span>

          <span
            className={`font-semibold ${
              isOverBudget ? "text-red-600" : "text-green-600"
            }`}
          >
            ₦{Math.abs(remaining).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Progress Bar */}

      <div className="mt-3 flex items-center gap-3">
        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <span className="text-sm font-medium text-slate-600">
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export default BudgetProgress;
