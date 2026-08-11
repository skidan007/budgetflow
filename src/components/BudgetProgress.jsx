function BudgetProgress({
  category,
  budget,
  spent,
  currencySymbol = "₦",
  onEdit,
  onDelete,
}) {
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

          <span className="font-semibold">
            {currencySymbol}
            {safeBudget.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-500">Spent</span>

          <span className="font-semibold">
            {currencySymbol}
            {safeSpent.toLocaleString()}
          </span>
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
            {currencySymbol}
            {Math.abs(remaining).toLocaleString()}
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

      {(onEdit || onDelete) && (
        <div className="mt-6 flex gap-3">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Edit
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full rounded-lg bg-red-600 px-4 py-3 font-medium text-white transition hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default BudgetProgress;
