import { useState } from "react";
import SummaryCard from "../components/SummaryCard";
import { useFinance } from "../context/FinanceContext";
import ExpensePieChart from "../components/charts/ExpensePieChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import { Wallet, TrendingDown, PiggyBank, Landmark } from "lucide-react";

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("All");

  const { transactions, goals } = useFinance();

  const months = [
    "All",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const filteredTransactions =
    selectedMonth === "All"
      ? transactions
      : transactions.filter(
          (transaction) =>
            new Date(transaction.date).getMonth() + 1 ===
            months.indexOf(selectedMonth),
        );

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "Income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "Expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSavings = totalIncome - totalExpenses;

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

const goalRemainingByCurrency = Object.keys(
  goalTargetsByCurrency,
).reduce((acc, currency) => {
  const target = goalTargetsByCurrency[currency] || 0;
  const saved = goalSavingsByCurrency[currency] || 0;

  acc[currency] = Math.max(target - saved, 0);

  return acc;
}, {});

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
            insight: `🎉 Great job! Your income exceeded your expenses by ₦${difference.toLocaleString()}. Keep it up!`,
            insightColor: "border-green-200 bg-green-50 text-green-700",
          }
        : difference < 0
          ? {
              insight: `⚠️ You spent ₦${Math.abs(difference).toLocaleString()} more than you earned. Consider reducing your expenses.`,
              insightColor: "border-red-200 bg-red-50 text-red-700",
            }
          : {
              insight: "ℹ️ Your income and expenses are perfectly balanced.",
              insightColor: "border-blue-200 bg-blue-50 text-blue-700",
            };

  const monthlyData =
    selectedMonth === "All"
      ? [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ].map((month, index) => {
          const income = transactions
            .filter(
              (t) =>
                t.type === "Income" && new Date(t.date).getMonth() === index,
            )
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          const expenses = transactions
            .filter(
              (t) =>
                t.type === "Expense" && new Date(t.date).getMonth() === index,
            )
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

          return {
            month,
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
              month: selectedMonth,
              Income: income,
              Expenses: expenses,
            },
          ];
        })();

  const categoryTotals = filteredTransactions
    .filter((t) => t.type === "Expense")
    .reduce((acc, transaction) => {
      acc[transaction.category] =
        (acc[transaction.category] || 0) + transaction.amount;

      return acc;
    }, {});

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
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Income"
          amount={totalIncome}
          icon={Wallet}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />

        <SummaryCard
          title="Total Expenses"
          amount={totalExpenses}
          icon={TrendingDown}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />

        <SummaryCard
          title="Savings"
          amount={totalSavings}
          icon={PiggyBank}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />

        <SummaryCard
          title="Net Balance"
          amount={totalSavings}
          icon={Landmark}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-purple-700">Savings Rate</p>

            <p className="mt-2 text-3xl font-bold text-purple-900">
              {savingsRate.toFixed(1)}%
            </p>

            <p className="mt-1 text-sm text-purple-700">
              Percentage of your income remaining after expenses.
            </p>
          </div>

          <div className="text-4xl">📈</div>
        </div>
      </div>

      <div className={`mt-8 rounded-xl border p-5 ${insightColor}`}>
        <p className="font-medium">{insight}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6">
        <div className="mt-8">
          <h2 className="text-xl font-bold text-slate-900">
            💡 Financial Insights
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <p className="font-medium text-green-800">Savings Performance</p>

              <p className="mt-2 text-sm text-green-700">{savingsInsight}</p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="font-medium text-blue-800">Spending Pattern</p>

              <p className="mt-2 text-sm text-blue-700">{spendingInsight}</p>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-medium text-amber-800">Expense Level</p>

              <p className="mt-2 text-sm text-amber-700">{expenseInsight}</p>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  🎯 Savings Goals
                </h2>

                <p className="mt-1 text-sm text-slate-500">
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
              <div className="mb-5 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
                <p className="text-sm font-medium text-indigo-700">
                  Total saved toward goals
                </p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(goalSavingsByCurrency).length === 0 ? (
                    <p className="text-sm text-indigo-700">
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
        <h2 className=" mt-6 text-xl font-bold text-orange-700">
          🏆 Top Spending Category
        </h2>

        {topCategory ? (
          <>
            <p className="mt-3 text-2xl font-bold">{topCategory[0]}</p>

            <p className="text-lg">₦{topCategory[1].toLocaleString()}</p>

            <p className="text-sm text-slate-600">
              {topCategoryPercentage.toFixed(1)}% of all expenses
            </p>
          </>
        ) : (
          <p className="mt-3 text-slate-500">No expense data available.</p>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <IncomeExpenseChart data={monthlyData} />

        <ExpensePieChart transactions={filteredTransactions} />
      </div>
    </section>
  );
}

export default Reports;
