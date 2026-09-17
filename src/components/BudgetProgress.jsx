import { calculateDailyBudgetStatus, getDateKey } from "../utils/budgetCalculations";

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
  const spentToday = items
    .filter((item) => item.date?.slice(0, 10) === getDateKey())
    .reduce((total, item) => total + Number(item.amount || 0), 0);
  const dailyPlan = calculateDailyBudgetStatus({
    budgetAmount: safeBudget,
    spentAmount: safeSpent,
    spentToday,
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
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">Budget category</p>
          <h3 className="mt-1 text-xl font-bold tracking-tight">{category}</h3>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isOverBudget ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {isOverBudget ? "Over budget" : "On track"}
        </span>
      </div>

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
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
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
        <section className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="font-semibold">Daily Spending Plan</h4>
          <div className="mt-3 space-y-5 text-sm">
            <div>
              <p className="text-slate-500">Daily target</p>
              <p className="mt-1 font-semibold">{currencySymbol}{formatAmount(dailyPlan.originalDailyTarget)} / day</p>
            </div>
            {dailyPlan.isCurrentMonth && <>
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Today</p>
                <p className="mt-3 text-2xl font-bold">{currencySymbol}{formatAmount(dailyPlan.spentToday)}</p>
                <p className="mt-1 text-slate-500">Spent today</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <p><span className="block text-slate-500">Today&apos;s target</span><span className="font-semibold">{currencySymbol}{formatAmount(dailyPlan.originalDailyTarget)}</span></p>
                  <p><span className="block text-slate-500">{dailyPlan.todayOverspent > 0 ? "Overspent today" : "Remaining today"}</span><span className={`font-semibold ${dailyPlan.todayOverspent > 0 ? "text-red-600" : "text-green-600"}`}>{currencySymbol}{formatAmount(dailyPlan.todayOverspent > 0 ? dailyPlan.todayOverspent : dailyPlan.todayRemaining)}</span></p>
                </div>
                <p className={`mt-3 font-semibold ${dailyPlan.todayOverspent > 0 ? "text-red-600" : "text-green-600"}`}>{dailyPlan.todayOverspent > 0 ? `⚠️ Overspent today by ${currencySymbol}${formatAmount(dailyPlan.todayOverspent)}` : dailyPlan.todayRemaining === 0 ? "✓ On today's target" : `✓ ${currencySymbol}${formatAmount(dailyPlan.todayRemaining)} remaining today`}</p>
              </div>
              <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Monthly progress</p>
                <div className="mt-3 space-y-2">
                  <p><span className="text-slate-500">Expected so far: </span><span className="font-semibold">{currencySymbol}{formatAmount(dailyPlan.expectedSpent)}</span></p>
                  <p><span className="text-slate-500">Actual spending: </span><span className="font-semibold">{currencySymbol}{formatAmount(safeSpent)}</span></p>
                  <p><span className="text-slate-500">Monthly budget remaining: </span><span className="font-semibold">{currencySymbol}{formatAmount(Math.abs(remaining))}</span></p>
                </div>
              </div>
              {dailyPlan.todayOverspent > 0 && (
                <div className="border-t border-red-200 pt-4 text-red-700 dark:border-red-900">
                  <p className="font-semibold">⚠️ Catch-up plan</p>
                  {dailyPlan.daysRemainingAfterToday > 0 && remaining > 0 ? <p className="mt-1">Suggested spending for the remaining days: <strong>{currencySymbol}{formatAmount(dailyPlan.catchUpDailyAmount)} / day</strong></p> : <p className="mt-1">There are no days left after today to adjust your spending.</p>}
                </div>
              )}
            </>}
          </div>
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
