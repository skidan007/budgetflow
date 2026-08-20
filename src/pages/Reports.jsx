import { useState } from "react";
import SummaryCard from "../components/SummaryCard";
import { useFinance } from "../context/FinanceContext";
import ExpensePieChart from "../components/charts/ExpensePieChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import { Wallet, TrendingDown, PiggyBank, Landmark, X } from "lucide-react";

function getTransactionMonth(transaction) {
  return transaction.month || transaction.date?.slice(0, 7) || "";
}

function formatShortMonth(monthKey) {
  if (!monthKey) return "";

  const [year, monthNumber] = monthKey.split("-");

  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("All");
  const [drilldownMonth, setDrilldownMonth] = useState(null);

  const {
    transactions,
    budgets,
    goals,
    currencySymbol,
    defaultCurrency,
    currentMonth,
    getMonthLabel,
  } = useFinance();

  // All financial months present in the data, most recent first.
  const allMonthKeys = Array.from(
    new Set([
      currentMonth,
      ...transactions.map(getTransactionMonth),
      ...budgets.map((budget) => budget.month).filter(Boolean),
    ]),
  )
    .filter(Boolean)
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

  const months = ["All", ...allMonthKeys];

  const filteredTransactions =
    selectedMonth === "All"
      ? transactions
      : transactions.filter(
          (transaction) => getTransactionMonth(transaction) === selectedMonth,
        );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = totalIncome - totalExpenses;

  const goalSavingsTotal = Array.isArray(goals)
    ? goals
        .filter((goal) => (goal.currency || "NGN") === defaultCurrency)
        .reduce((sum, goal) => sum + Number(goal.currentAmount || 0), 0)
    : 0;

  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;
  const completedGoals = Array.isArray(goals)
    ? goals.filter(
        (goal) =>
          Number(goal.currentAmount || 0) >= Number(goal.targetAmount || 0),
      ).length
    : 0;

  const goalSavingsByCurrency = Array.isArray(goals)
    ? goals.reduce((acc, goal) => {
        const currency = goal.currency || "₦";
        const amount = Number(goal.currentAmount || 0);

        acc[currency] = (acc[currency] || 0) + amount;

        return acc;
      }, {})
    : {};

  const goalTargetsByCurrency = Array.isArray(goals)
    ? goals.reduce((acc, goal) => {
        const currency = goal.currency || "₦";
        const amount = Number(goal.targetAmount || 0);

        acc[currency] = (acc[currency] || 0) + amount;

        return acc;
      }, {})
    : {};

  const goalRemainingByCurrency = Object.keys(goalTargetsByCurrency).reduce(
    (acc, currency) => {
      const target = goalTargetsByCurrency[currency] || 0;
      const saved = goalSavingsByCurrency[currency] || 0;

      acc[currency] = Math.max(target - saved, 0);

      return acc;
    },
    {},
  );

  const totalGoals = Array.isArray(goals) ? goals.length : 0;

  const difference = totalIncome - totalExpenses;

  const { insight, insightColor } =
    filteredTransactions.length === 0
      ? {
          insight:
            "📊 Add your first income or expense to start seeing financial insights.",
          insightColor: "border-slate-200 bg-slate-50 text-slate-700",
        }
      : difference > 0
        ? {
            insight: `🎉 Great job! Your income exceeded your expenses by ${currencySymbol}${difference.toLocaleString()}. Keep it up!`,
            insightColor: "border-green-200 bg-green-50 text-green-700",
          }
        : difference < 0
          ? {
              insight: `⚠️ You spent ${currencySymbol}${Math.abs(difference).toLocaleString()} more than you earned. Consider reducing your expenses.`,
              insightColor: "border-red-200 bg-red-50 text-red-700",
            }
          : {
              insight: "ℹ️ Your income and expenses are perfectly balanced.",
              insightColor: "border-blue-200 bg-blue-50 text-blue-700",
            };

  const monthlyData =
    selectedMonth === "All"
      ? [...allMonthKeys]
          .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
          .map((monthKey) => {
            const income = transactions
              .filter(
                (t) => t.type === "Income" && getTransactionMonth(t) === monthKey,
              )
              .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            const expenses = transactions
              .filter(
                (t) => t.type === "Expense" && getTransactionMonth(t) === monthKey,
              )
              .reduce((sum, t) => sum + Number(t.amount || 0), 0);

            return {
              month: formatShortMonth(monthKey),
              Income: income,
              Expenses: expenses,
            };
          })
      : (() => {
          const income = filteredTransactions
            .filter((t) => t.type === "Income")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          const expenses = filteredTransactions
            .filter((t) => t.type === "Expense")
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          return [
            {
              month: formatShortMonth(selectedMonth),
              Income: income,
              Expenses: expenses,
            },
          ];
        })();

  // -------------------------------------
  // BUDGET HISTORY (per financial month)
  // -------------------------------------

  const budgetHistory = allMonthKeys.map((monthKey) => {
    const monthTransactions = transactions.filter(
      (t) =>
        (t.currency || "NGN") === defaultCurrency &&
        getTransactionMonth(t) === monthKey,
    );

    const monthBudgets = budgets.filter(
      (budget) =>
        (budget.currency || "NGN") === defaultCurrency &&
        budget.month === monthKey,
    );

    const income = monthTransactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "Expense")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const budgetTotal = monthBudgets.reduce(
      (sum, budget) => sum + Number(budget.amount || 0),
      0,
    );

    const incomeByCategory = monthTransactions
      .filter((t) => t.type === "Income")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount || 0);
        return acc;
      }, {});

    const expensesByCategory = monthTransactions
      .filter((t) => t.type === "Expense")
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + Number(t.amount || 0);
        return acc;
      }, {});

    // Individual expense items (with descriptions) grouped by category.
    const expenseItemsByCategory = monthTransactions
      .filter((t) => t.type === "Expense")
      .reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = [];
        }

        acc[t.category].push({
          id: t.id,
          description: t.description || "",
          amount: Number(t.amount || 0),
          date: t.date,
        });

        return acc;
      }, {});

    return {
      month: monthKey,
      label: getMonthLabel(monthKey),
      status: monthKey === currentMonth ? "Current" : "Completed",
      income,
      expenses,
      budgetTotal,
      remaining: budgetTotal - expenses,
      incomeByCategory,
      expensesByCategory,
      expenseItemsByCategory,
      budgets: monthBudgets,
    };
  });

  const drilldownData = drilldownMonth
    ? budgetHistory.find((entry) => entry.month === drilldownMonth)
    : null;

  const categoryTotals = filteredTransactions
    .filter((t) => t.type === "Expense")
    .reduce((acc, transaction) => {
      acc[transaction.category] =
        (acc[transaction.category] || 0) + Number(transaction.amount || 0);

      return acc;
    }, {});

  const expenseChartData = Object.entries(categoryTotals).map(
    ([name, value]) => ({
      name,
      value: Number(value),
    }),
  );

  const topCategory = Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1],
  )[0];

  const topCategoryPercentage =
    totalExpenses > 0 && topCategory
      ? (topCategory[1] / totalExpenses) * 100
      : 0;

  const savingsInsight =
    totalIncome === 0
      ? "💰 Add income to see your savings performance."
      : savingsRate >= 50
        ? `🎉 Excellent! You are saving ${savingsRate.toFixed(
            1,
          )}% of your income.`
        : savingsRate >= 20
          ? `👍 Good progress! You are saving ${savingsRate.toFixed(
              1,
            )}% of your income.`
          : savingsRate > 0
            ? `💡 You are saving ${savingsRate.toFixed(
                1,
              )}% of your income. Consider increasing your savings.`
            : "⚠️ You currently have no savings from your income.";

  const spendingInsight = topCategory
    ? `📊 ${topCategory[0]} is your largest spending category, accounting for ${topCategoryPercentage.toFixed(
        1,
      )}% of your total expenses.`
    : "📊 Add expenses to see your biggest spending category.";

  const expenseRatio =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  const expenseInsight =
    totalIncome === 0
      ? "📈 Add income and expenses to receive spending analysis."
      : expenseRatio > 80
        ? "⚠️ Your expenses are taking up more than 80% of your income. Consider reviewing your spending."
        : expenseRatio > 50
          ? `💡 You are spending ${expenseRatio.toFixed(
              1,
            )}% of your income. Keep an eye on your expenses.`
          : `✅ Your expenses are ${expenseRatio.toFixed(
              1,
            )}% of your income. Your spending is currently under control.`;

  return (
    <section>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Financial Reports</h1>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-lg border p-2"
        >
          {months.map((month) => (
            <option key={month} value={month}>
              {month === "All"
                ? "All"
                : `${getMonthLabel(month)}${
                    month === currentMonth ? " (Current)" : ""
                  }`}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Income"
          amount={totalIncome}
          currency={currencySymbol}
          icon={Wallet}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />

        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          currency={currencySymbol}
          icon={TrendingDown}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />

        <SummaryCard
          title="Savings"
          currency={currencySymbol}
          amount={goalSavingsTotal}
          icon={PiggyBank}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />

        <SummaryCard
          title="Net Balance"
          currency={currencySymbol}
          amount={totalSavings}
          icon={Landmark}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-6 dark:border-purple-700/40 dark:bg-purple-950/40">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700 dark:text-purple-200">Savings Rate</p>

            <p className="mt-2 text-3xl font-bold text-purple-900 dark:text-purple-100">
              {savingsRate.toFixed(1)}%
            </p>

            <p className="mt-1 text-sm text-purple-700 dark:text-purple-200/90">
              Percentage of your income remaining after expenses.
            </p>
          </div>

          <div className="text-4xl">📈</div>
        </div>
      </div>

      <div className={`mt-8 rounded-xl border p-5 ${insightColor}`}>
        <p className="font-medium">{insight}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6 dark:border-orange-700/40 dark:bg-orange-950/30">
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            💡 Financial Insights
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5 dark:border-green-700/40 dark:bg-green-950/30">
              <p className="font-medium text-green-800 dark:text-green-200">Savings Performance</p>

              <p className="mt-2 text-sm text-green-700 dark:text-green-100/90">{savingsInsight}</p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-700/40 dark:bg-blue-950/30">
              <p className="font-medium text-blue-800 dark:text-blue-200">Spending Pattern</p>

              <p className="mt-2 text-sm text-blue-700 dark:text-blue-100/90">{spendingInsight}</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-700/40 dark:bg-amber-950/30">
              <p className="font-medium text-amber-800 dark:text-amber-200">Expense Level</p>

              <p className="mt-2 text-sm text-amber-700 dark:text-amber-100/90">{expenseInsight}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  🎯 Savings Goals
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Track your progress toward your financial goals.
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">
                  {completedGoals}/{totalGoals}
                </p>

                <p className="text-xs text-slate-500">Goals completed</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-5 dark:border-indigo-700/40 dark:bg-indigo-950/30">
                <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200">
                  Total saved toward goals
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(goalSavingsByCurrency).length === 0 ? (
                    <p className="text-sm text-indigo-700 dark:text-indigo-100/90">
                      No savings recorded yet.
                    </p>
                  ) : (
                    Object.entries(goalSavingsByCurrency).map(
                      ([currency, amount]) => {
                        const target = goalTargetsByCurrency[currency] || 0;
                        const remaining =
                          goalRemainingByCurrency[currency] || 0;

                        return (
                          <div
                            key={currency}
                            className="rounded-lg bg-white p-4 shadow-sm"
                          >
                            <p className="text-sm font-medium text-slate-500">
                              {currency}
                            </p>

                            <p className="mt-1 text-xl font-bold text-slate-900">
                              {currency}
                              {Number(amount).toLocaleString()}
                            </p>

                            <p className="mt-2 text-sm text-slate-500">
                              Target: {currency}
                              {Number(target).toLocaleString()}
                            </p>

                            <p className="mt-1 text-sm font-medium text-indigo-600">
                              Remaining: {currency}
                              {Number(remaining).toLocaleString()}
                            </p>
                          </div>
                        );
                      },
                    )
                  )}
                </div>
              </div>
              {totalGoals === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">
                    No savings goals created yet.
                  </p>
                </div>
              ) : (
                goals.map((goal) => {
                  const target = Number(goal.targetAmount || 0);
                  const saved = Number(goal.currentAmount || 0);

                  const progress =
                    target > 0 ? Math.min((saved / target) * 100, 100) : 0;

                  const completed = saved >= target && target > 0;

                  return (
                    <div
                      key={goal.id}
                      className="rounded-xl border border-slate-200 bg-white p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {goal.name}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {goal.currency || "₦"}
                            {saved.toLocaleString()} / {goal.currency || "₦"}
                            {target.toLocaleString()}
                          </p>
                        </div>

                        <span
                          className={`font-bold ${
                            completed ? "text-green-600" : "text-indigo-600"
                          }`}
                        >
                          {completed
                            ? "✓ Completed"
                            : `${progress.toFixed(1)}%`}
                        </span>
                      </div>

                      <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all ${
                            completed ? "bg-green-500" : "bg-indigo-600"
                          }`}
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <h2 className=" mt-6 text-xl font-bold text-orange-700 dark:text-orange-200">
          🏆 Top Spending Category
        </h2>

        {topCategory ? (
          <>
            <p className="mt-3 text-2xl font-bold">{topCategory[0]}</p>

            <p className="text-lg">
              {currencySymbol}
              {topCategory[1].toLocaleString()}
            </p>

            <p className="text-sm text-slate-600">
              {topCategoryPercentage.toFixed(1)}% of all expenses
            </p>
          </>
        ) : (
          <p className="mt-3 text-slate-500">No expense data available.</p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart data={monthlyData} currency={currencySymbol} />

        <ExpensePieChart data={expenseChartData} currency={currencySymbol} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          📅 Budget History
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Every financial month is preserved. Select a month to view its full report.
        </p>

        {budgetHistory.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No budget periods yet. Add income, budgets, or expenses to build your history.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  <th className="py-2 pr-4 font-medium">Month</th>
                  <th className="py-2 pr-4 font-medium">Income</th>
                  <th className="py-2 pr-4 font-medium">Budget</th>
                  <th className="py-2 pr-4 font-medium">Expenses</th>
                  <th className="py-2 pr-4 font-medium">Remaining</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>

              <tbody>
                {budgetHistory.map((entry) => (
                  <tr
                    key={entry.month}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                  >
                    <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-slate-100">
                      {entry.label}
                      <span
                        className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium ${
                          entry.status === "Current"
                            ? "bg-green-100 text-green-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {entry.status}
                      </span>
                    </td>

                    <td className="py-3 pr-4">
                      {currencySymbol}
                      {entry.income.toLocaleString()}
                    </td>

                    <td className="py-3 pr-4">
                      {currencySymbol}
                      {entry.budgetTotal.toLocaleString()}
                    </td>

                    <td className="py-3 pr-4">
                      {currencySymbol}
                      {entry.expenses.toLocaleString()}
                    </td>

                    <td
                      className={`py-3 pr-4 font-medium ${
                        entry.remaining < 0 ? "text-red-600" : "text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {currencySymbol}
                      {entry.remaining.toLocaleString()}
                    </td>

                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => setDrilldownMonth(entry.month)}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        View Report →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {drilldownData && (
          <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/60 p-6 dark:border-indigo-700/40 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                {drilldownData.label}
              </h3>

              <button
                type="button"
                onClick={() => setDrilldownMonth(null)}
                className="rounded-full p-1 text-slate-500 hover:bg-slate-200/60 dark:text-slate-400"
                aria-label="Close report"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 grid gap-6 md:grid-cols-3">
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Income</p>

                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {Object.entries(drilldownData.incomeByCategory).length === 0 ? (
                    <li>No income recorded.</li>
                  ) : (
                    Object.entries(drilldownData.incomeByCategory).map(
                      ([category, amount]) => (
                        <li key={category} className="flex justify-between gap-4">
                          <span>{category}</span>
                          <span>
                            {currencySymbol}
                            {amount.toLocaleString()}
                          </span>
                        </li>
                      ),
                    )
                  )}
                </ul>

                <p className="mt-2 border-t border-slate-200 pt-2 text-sm font-semibold dark:border-slate-700">
                  Total income: {currencySymbol}
                  {drilldownData.income.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">Budget</p>

                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {drilldownData.budgets.length === 0 ? (
                    <li>No budget set.</li>
                  ) : (
                    drilldownData.budgets.map((budget) => (
                      <li key={budget.id} className="flex justify-between gap-4">
                        <span>{budget.category}</span>
                        <span>
                          {currencySymbol}
                          {Number(budget.amount || 0).toLocaleString()}
                        </span>
                      </li>
                    ))
                  )}
                </ul>

                <p className="mt-2 border-t border-slate-200 pt-2 text-sm font-semibold dark:border-slate-700">
                  Total budget: {currencySymbol}
                  {drilldownData.budgetTotal.toLocaleString()}
                </p>
              </div>

              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200">
                  Actual Expenses
                </p>

                <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  {Object.entries(drilldownData.expensesByCategory).length === 0 ? (
                    <li>No expenses recorded.</li>
                  ) : (
                    Object.entries(drilldownData.expensesByCategory).map(
                      ([category, amount]) => (
                        <li key={category}>
                          <div className="flex justify-between gap-4">
                            <span>{category}</span>
                            <span>
                              {currencySymbol}
                              {amount.toLocaleString()}
                            </span>
                          </div>

                          {(drilldownData.expenseItemsByCategory[category] || [])
                            .filter((item) => item.description)
                            .map((item) => (
                              <div
                                key={item.id}
                                className="mt-1 flex justify-between gap-4 pl-3 text-xs text-slate-500 dark:text-slate-400"
                              >
                                <span>• {item.description}</span>
                                <span>
                                  {currencySymbol}
                                  {item.amount.toLocaleString()}
                                </span>
                              </div>
                            ))}
                        </li>
                      ),
                    )
                  )}
                </ul>

                <p className="mt-2 border-t border-slate-200 pt-2 text-sm font-semibold dark:border-slate-700">
                  Total spent: {currencySymbol}
                  {drilldownData.expenses.toLocaleString()}
                </p>
              </div>
            </div>

            <p
              className={`mt-4 text-sm font-semibold ${
                drilldownData.remaining < 0 ? "text-red-600" : "text-green-700"
              }`}
            >
              Remaining: {currencySymbol}
              {drilldownData.remaining.toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default Reports;
