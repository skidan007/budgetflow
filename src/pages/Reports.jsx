import { useState } from "react";
import SummaryCard from "../components/SummaryCard";
import { useFinance } from "../context/FinanceContext";
import ExpensePieChart from "../components/charts/ExpensePieChart";
import IncomeExpenseChart from "../components/charts/IncomeExpenseChart";
import { Wallet, TrendingDown, PiggyBank, Landmark } from "lucide-react";

function Reports() {
  const [selectedMonth, setSelectedMonth] = useState("All");

  const { transactions } = useFinance();

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

  console.log({
    totalIncome,
    totalExpenses,
  });

  const totalSavings = totalIncome - totalExpenses;
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

  const monthlyData = [
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
    const income = filteredTransactions
      .filter(
        (t) => t.type === "Income" && new Date(t.date).getMonth() === index,
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = filteredTransactions
      .filter(
        (t) => t.type === "Expense" && new Date(t.date).getMonth() === index,
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      month,
      Income: income,
      Expenses: expenses,
    };
  });

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

      <div className={`mt-8 rounded-xl border p-5 ${insightColor}`}>
        <p className="font-medium">{insight}</p>
      </div>

      <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-6">
        <h2 className="text-xl font-bold text-orange-700">
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
