function BudgetProgress({
  category,
  budget,
  spent,
}) {
  const remaining = budget - spent;

  const percentage = Math.min(
    (spent / budget) * 100,
    100
  );

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h3 className="mb-4 text-xl font-semibold">
        {category}
      </h3>

      <div className="space-y-2">

        <p>
          <strong>Budget:</strong> ₦
          {budget.toLocaleString()}
        </p>

        <p>
          <strong>Spent:</strong> ₦
          {spent.toLocaleString()}
        </p>

        <p>
          <strong>Remaining:</strong> ₦
          {remaining.toLocaleString()}
        </p>

      </div>

      {/* Progress Bar */}

      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-right text-sm text-slate-500">
        {percentage.toFixed(0)}%
      </p>
    </div>
  );
}

export default BudgetProgress;