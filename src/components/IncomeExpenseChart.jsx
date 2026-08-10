function IncomeExpenseChart({ data = [] }) {
  const maxValue = Math.max(
    ...data.flatMap((item) => [
      Number(item.Income) || 0,
      Number(item.Expense) || 0,
    ]),
    0,
  );

  if (data.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-xl bg-white p-6 shadow-md">
        <p className="text-sm text-slate-500">
          No income or expense data available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Income vs Expenses
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Monthly financial activity.
        </p>
      </div>

      {/* LEGEND */}
      <div className="mt-5 flex gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-indigo-600" />
          <span className="text-slate-600">Income</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-red-500" />
          <span className="text-slate-600">Expenses</span>
        </div>
      </div>

      {/* CHART */}
      <div className="mt-6 space-y-5">
        {data.map((item) => {
          const income = Number(item.Income) || 0;
          const expense = Number(item.Expense) || 0;

          const incomeWidth =
            maxValue > 0 ? (income / maxValue) * 100 : 0;

          const expenseWidth =
            maxValue > 0 ? (expense / maxValue) * 100 : 0;

          return (
            <div key={item.name}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-slate-700">
                  {item.name}
                </span>

                <div className="text-right text-xs text-slate-500">
                  <span>
                    Income: ₦{income.toLocaleString()}
                  </span>

                  <span className="ml-3">
                    Expense: ₦{expense.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* INCOME */}
              <div className="mb-2 flex items-center gap-3">
                <span className="w-16 text-xs text-slate-500">
                  Income
                </span>

                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-600 transition-all"
                    style={{
                      width: `${incomeWidth}%`,
                    }}
                  />
                </div>
              </div>

              {/* EXPENSE */}
              <div className="flex items-center gap-3">
                <span className="w-16 text-xs text-slate-500">
                  Expense
                </span>

                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-red-500 transition-all"
                    style={{
                      width: `${expenseWidth}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IncomeExpenseChart;