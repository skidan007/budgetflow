import { calculateDailyBudgetStatus } from "../utils/budgetCalculations";

function BudgetProgress({
  category,
  budget,
  spent,
  month,
  currencySymbol = "₦",
  items = [],
  onEdit,
  onDelete,
}) {
  const safeBudget = Number(budget) || 0;
  const safeSpent = Number(spent) || 0;
  const remaining = safeBudget - safeSpent;
  const isOverBudget = remaining < 0;
  const dailyPlan = calculateDailyBudgetStatus({
    budgetAmount: safeBudget,
    spentAmount: safeSpent,
    month,
  });
  const formatAmount = (amount) => Number(amount || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

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

      {dailyPlan.totalDays > 0 && (
        <section className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <h4 className="font-semibold">Daily Spending Plan</h4>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Monthly Daily Target</p>
              <p className="mt-1 font-semibold">{currencySymbol}{formatAmount(dailyPlan.originalDailyTarget)} / day</p>
            </div>
            <div>
              <p className="text-slate-500">Days in Budget Month</p>
              <p className="mt-1 font-semibold">{dailyPlan.totalDays} days</p>
            </div>
            {dailyPlan.isCurrentMonth && <>
              <div>
                <p className="text-slate-500">Expected Spending So Far</p>
                <p className="mt-1 font-semibold">{currencySymbol}{formatAmount(dailyPlan.expectedSpent)}</p>
              </div>
              <div>
                <p className="text-slate-500">Actual Spending</p>
                <p className="mt-1 font-semibold">{currencySymbol}{formatAmount(safeSpent)}</p>
              </div>
              <div>
                <p className="text-slate-500">Remaining Daily Allowance</p>
                <p className="mt-1 font-semibold">{currencySymbol}{formatAmount(dailyPlan.recommendedDailySpending)} / day</p>
              </div>
              <div>
                <p className="text-slate-500">Days Remaining</p>
                <p className="mt-1 font-semibold">{dailyPlan.daysRemaining} {dailyPlan.daysRemaining === 1 ? "day" : "days"}</p>
              </div>
            </>}
          </div>

          {dailyPlan.status === "on_track" && (
            <p className="mt-4 text-sm font-medium text-green-600">🟢 You&apos;re on track.</p>
          )}
          {dailyPlan.status === "slightly_above" && (
            <p className="mt-4 text-sm font-medium text-yellow-600">🟡 You&apos;re spending slightly above your daily target. You have spent {currencySymbol}{formatAmount(dailyPlan.amountAboveTarget)} above your expected spending so far.</p>
          )}
          {dailyPlan.status === "overspending" && (
            <div className="mt-4 text-sm text-red-600">
              <p className="font-medium">🔴 Spending Alert</p>
              <p className="mt-1">You have spent {currencySymbol}{formatAmount(dailyPlan.amountAboveTarget)} above your expected spending so far.</p>
              <p className="mt-1">To stay on track, spend no more than {currencySymbol}{formatAmount(dailyPlan.recommendedDailySpending)} per day for the remaining days.</p>
            </div>
          )}
          {dailyPlan.status === "budget_reached" && (
            <p className="mt-4 text-sm font-medium text-red-600">🔴 Budget limit reached.</p>
          )}
          {dailyPlan.status === "exceeded" && (
            <p className="mt-4 text-sm font-medium text-red-600">🔴 You have exceeded this budget by {currencySymbol}{formatAmount(Math.abs(dailyPlan.remaining))}.</p>
          )}
        </section>
      )}

      {items.filter((item) => item.description).length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-slate-500">What you spent it on</p>

          <ul className="mt-2 max-h-64 space-y-1.5 overflow-y-auto pr-1 text-sm text-slate-600">
            {items
              .filter((item) => item.description)
              .map((item) => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>{item.description}</span>
                  <span className="font-medium">
                    {currencySymbol}
                    {Number(item.amount || 0).toLocaleString()}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

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
