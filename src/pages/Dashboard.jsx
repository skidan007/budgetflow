import ExpensePieChart from "../components/ExpensePieChart";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import TransactionItem from "../components/TransactionItem";
import { useState, useEffect } from "react";
import SummaryCard from "../components/SummaryCard";
import { Wallet, TrendingUp, Receipt, PiggyBank } from "lucide-react";
import { useFinance } from "../context/FinanceContext";
import ExpenseForm from "../components/ExpenseForm";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

function Dashboard() {
  const [incomeInput, setIncomeInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");

  const [incomeCategory, setIncomeCategory] = useState("Salary");
  const [expenseCategory, setExpenseCategory] = useState("Food");

  const today = new Date().toISOString().split("T")[0];

  const [incomeDate, setIncomeDate] = useState(today);
  const [expenseDate, setExpenseDate] = useState(today);

  const { transactions, setTransactions } = useFinance();

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);

  const navigate = useNavigate();

  const income = transactions.reduce(
    (total, transaction) =>
      transaction.type === "Income"
        ? total + (Number(transaction.amount) || 0)
        : total,
    0,
  );

  const expenses = transactions.reduce(
    (total, transaction) =>
      transaction.type === "Expense"
        ? total + (Number(transaction.amount) || 0)
        : total,
    0,
  );
  const balance = income - expenses;

  const { goals } = useFinance();
  const savings = goals.reduce(
    (total, goal) => total + (Number(goal.currentAmount) || 0),
    0,
  );

  const totalGoals = goals.length;

  const totalTarget = goals.reduce(
    (total, goal) => total + Number(goal.targetAmount || 0),
    0,
  );

  const totalSaved = goals.reduce(
    (total, goal) => total + Number(goal.currentAmount || 0),
    0,
  );

  const overallProgress =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  // pie chart data for expenses by category
  const expenseChartData = Object.values(
    transactions
      .filter((transaction) => transaction.type === "Expense")
      .reduce((acc, transaction) => {
        if (!acc[transaction.category]) {
          acc[transaction.category] = {
            name: transaction.category,
            value: 0,
          };
        }

        acc[transaction.category].value += Number(transaction.amount) || 0;

        return acc;
      }, {}),
  );
  // bar chart data for income vs expenses
  const incomeExpenseChartData = (() => {
    const monthlyData = {};

    transactions.forEach((transaction) => {
      if (!transaction?.date) return;

      const date = new Date(transaction.date);

      if (Number.isNaN(date.getTime())) return;

      const month = date.toLocaleString("en-US", {
        month: "short",
      });

      if (!monthlyData[month]) {
        monthlyData[month] = {
          name: month,
          Income: 0,
          Expense: 0,
        };
      }

      const amount = Number(transaction.amount) || 0;

      if (transaction.type === "Income") {
        monthlyData[month].Income += amount;
      }

      if (transaction.type === "Expense") {
        monthlyData[month].Expense += amount;
      }
    });

    return Object.values(monthlyData);
  })();
  // ✅ 2. Save transactions whenever they change
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const handleAddIncome = () => {
    if (!incomeInput) return;

    const amount = Number(incomeInput);

    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "Income",
        amount,
        category: incomeCategory,
        date: incomeDate,
      },
      ...prev,
    ]);

    setIncomeInput("");
    toast.success("Income added successfully!");
  };

  const handleAddExpense = () => {
    if (!expenseInput) return;

    const amount = Number(expenseInput);

    console.log(expenseDate);

    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "Expense",
        amount,
        category: expenseCategory,
        date: expenseDate,
      },
      ...prev,
    ]);

    setExpenseInput("");
    toast.success("Expense added successfully!");
  };

  const summaryCardData = [
    {
      title: "Total Balance",
      amount: balance,
      icon: Wallet,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Income",
      amount: income,
      icon: TrendingUp,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Expenses",
      amount: expenses,
      icon: Receipt,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
    {
      title: "Savings",
      amount: savings,
      icon: PiggyBank,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesFilter = filter === "All" || transaction.type === filter;

    const matchesSearch = transaction.category
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleUpdateTransaction = () => {
    if (!editingTransaction) return;

    const amount =
      editingTransaction.type === "Income"
        ? Number(incomeInput)
        : Number(expenseInput);

    const category =
      editingTransaction.type === "Income" ? incomeCategory : expenseCategory;

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === editingTransaction.id
          ? {
              ...transaction,
              amount,
              category,
            }
          : transaction,
      ),
    );

    setEditingTransaction(null);
    setIncomeInput("");
    setExpenseInput("");
    setIncomeCategory("Salary");
    setExpenseCategory("Food");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Welcome Back 👋</h1>

        <p className="text-gray-500">Here's your financial overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {summaryCardData.map((card) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            amount={card.amount}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
          />
        ))}
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Goals Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Track your savings goals from your dashboard.
            </p>
          </div>

          <div className="text-3xl">🎯</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* TOTAL GOALS */}
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Goals</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalGoals}
            </p>
          </div>

          {/* TOTAL TARGET */}
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Target</p>

            <p className="mt-2 text-2xl font-bold text-slate-900">
              ₦{totalTarget.toLocaleString()}
            </p>
          </div>

          {/* TOTAL SAVED */}
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Saved</p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              ₦{totalSaved.toLocaleString()}
            </p>
          </div>
        </div>

        {/* OVERALL PROGRESS */}
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              Overall Progress
            </span>

            <span className="text-sm font-semibold text-slate-900">
              {overallProgress.toFixed(1)}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full transition-all ${
                overallProgress >= 100 ? "bg-green-500" : "bg-indigo-600"
              }`}
              style={{
                width: `${overallProgress}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Your Goals</h2>

          {goals.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/goals")}
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View All Goals →
            </button>
          )}
        </div>
        {goals.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            You haven't created any goals yet.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {goals.map((goal) => {
              const target = Number(goal.targetAmount || 0);
              const saved = Number(goal.currentAmount || 0);

              const progress =
                target > 0 ? Math.min((saved / target) * 100, 100) : 0;

              return (
                <div
                  key={goal.id}
                  onClick={() => navigate("/goals")}
                  className="cursor-pointer rounded-lg border border-slate-200 p-4 transition hover:border-indigo-300 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {goal.name}
                      </h3>

                      <p className="text-sm text-slate-500">{goal.type}</p>
                    </div>

                    <span className="font-semibold text-slate-700">
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        progress >= 100 ? "bg-green-500" : "bg-indigo-600"
                      }`}
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">
                      Saved: ₦{saved.toLocaleString()}
                    </span>

                    <span className="text-slate-500">
                      Target: ₦{target.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* <DashboardGoals /> */}

      <div>
        {/* Left Column */}
        <div className="space-y-6 grid gap-6 lg:grid-cols-2">
          {/* Add Income */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Add Income</h2>

            <div className="grid gap-4 ">
              <select
                value={incomeCategory}
                onChange={(e) => setIncomeCategory(e.target.value)}
                className="w-full rounded-lg border p-3"
              >
                <option>Salary</option>
                <option>Business</option>
                <option>Investment</option>
                <option>Gift</option>
                <option>Other</option>
              </select>

              <input
                type="date"
                value={incomeDate}
                onChange={(e) => setIncomeDate(e.target.value)}
                className="rounded-lg border p-3"
              />

              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                placeholder="Enter amount"
                className="flex-1 rounded-lg border p-3"
              />

              <button
                onClick={
                  editingTransaction?.type === "Income"
                    ? handleUpdateTransaction
                    : handleAddIncome
                }
                className="rounded-lg bg-blue-600 px-6 text-white lg-w-40 py-3 w-full"
              >
                {editingTransaction?.type === "Income"
                  ? "Save Changes"
                  : "Add Income"}
              </button>
            </div>
          </div>

          {/* Add Expense */}

          <ExpenseForm
            setExpenseCategory={setExpenseCategory}
            setExpenseDate={setExpenseDate}
            setExpenseInput={setExpenseInput}
            expenseCategory={expenseCategory}
            expenseDate={expenseDate}
            expenseInput={expenseInput}
            onSubmit={handleAddExpense}
            buttonText="Add Expense"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ExpensePieChart data={expenseChartData} />

          <IncomeExpenseChart data={incomeExpenseChartData} />
        </div>

        {/* Recent Transactions */}
        <div className="mt-6 rounded-xl bg-white p-6 shadow">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Recent Transactions</h2>

            <div className="flex gap-3">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border p-2"
              >
                <option>All</option>
                <option>Income</option>
                <option>Expense</option>
              </select>

              <input
                type="text"
                placeholder="Search category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border p-2"
              />
            </div>
          </div>
          <div className="space-y-3 max-h-125 overflow-y-auto pr-2">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500">No transactions yet.</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-center text-gray-500">No matching results.</p>
            ) : (
              filteredTransactions.slice(0, 5).map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  // onDelete={handleDelete}
                  // onEdit={handleEdit}
                />
              ))
            )}
            <div className="mt-6 flex justify-center">
              <Link
                to="/expenses"
                className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white transition hover:bg-slate-800"
              >
                View All Expenses →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
