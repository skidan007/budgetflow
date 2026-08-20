import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wallet, TrendingUp, Receipt, PiggyBank, X } from "lucide-react";
import toast from "react-hot-toast";

import ExpensePieChart from "../components/ExpensePieChart";
import IncomeExpenseChart from "../components/IncomeExpenseChart";
import TransactionItem from "../components/TransactionItem";
import SummaryCard from "../components/SummaryCard";
import ExpenseForm, { TransactionForm } from "../components/ExpenseForm";

import { useFinance } from "../context/FinanceContext";
import { useAuth } from "../context/AuthContext";

// -------------------------------------
// GREETING HELPER
// -------------------------------------

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const getDisplayName = (user) => {
  const fullName =
    user?.user_metadata?.full_name || user?.user_metadata?.name || "";

  if (fullName.trim()) {
    return fullName.trim().split(" ")[0];
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "";
};

// -------------------------------------
// MONTH LABEL HELPER
// -------------------------------------

const formatMonthLabel = (month) => {
  if (!month) return "";

  const [year, monthNumber] = month.split("-");

  const date = new Date(Number(year), Number(monthNumber) - 1, 1);

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
};

// -------------------------------------
// EXPENSE CATEGORY → BUDGET CATEGORY
// -------------------------------------

const expenseCategoryMap = {
  Food: "Food",
  Transport: "Transport",
  Bills: "Bills",
  Health: "Health",
  Entertainment: "Entertainment",
  Shopping: "Shopping",
  Other: "Other",
};

const getBudgetCategory = (expenseCategory) => {
  return expenseCategoryMap[expenseCategory] || expenseCategory;
};

// -------------------------------------
// EXPENSE CATEGORIES
// -------------------------------------

const expenseCategories = [
  "Food",
  "Transport",
  "Bills",
  "Health",
  "Entertainment",
  "Shopping",
  "Other",
];

// -------------------------------------
// DASHBOARD
// -------------------------------------

function Dashboard() {
  const navigate = useNavigate();

  const { user } = useAuth();

  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    budgets,
    goals,
    defaultCurrency,
    currencySymbol,
    currentMonth,
    currentMonthLabel,
  } = useFinance();

  const displayName = getDisplayName(user);

  const greeting = displayName
    ? `${getTimeOfDayGreeting()}, ${displayName}`
    : getTimeOfDayGreeting();

  // -------------------------------------
  // FORM STATE
  // -------------------------------------

  const today = new Date().toISOString().split("T")[0];

  const [incomeInput, setIncomeInput] = useState("");

  const [expenseInput, setExpenseInput] = useState("");

  const [incomeCategory, setIncomeCategory] = useState("Salary");

  const [expenseCategory, setExpenseCategory] = useState("");

  const [incomeDate, setIncomeDate] = useState(today);

  const [expenseDate, setExpenseDate] = useState(today);

  // -------------------------------------
  // FILTER STATE
  // -------------------------------------

  const [filter, setFilter] = useState("All");

  const [search, setSearch] = useState("");

  // -------------------------------------
  // MODAL STATE
  // -------------------------------------

  const [showIncomeModal, setShowIncomeModal] = useState(false);

  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState(null);

  // -------------------------------------
  // MONTH HELPER
  // -------------------------------------

  const getTransactionMonth = (date) => {
    if (!date) {
      return currentMonth;
    }

    return date.slice(0, 7);
  };

  // -------------------------------------
  // CURRENT EXPENSE FORM MONTH
  // -------------------------------------

  const expenseFormMonth = getTransactionMonth(expenseDate);

  // -------------------------------------
  // BUDGETED CATEGORIES
  // -------------------------------------

  const budgetedCategories = budgets
    .filter(
      (budget) =>
        (budget.currency || "NGN") === defaultCurrency &&
        (budget.month || currentMonth) === expenseFormMonth &&
        [
          "Food",
          "Transport",
          "Bills",
          "Entertainment",
          "Shopping",
          "Health",
        ].includes(budget.category),
    )
    .map((budget) => budget.category)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
  // -------------------------------------
  // GET BUDGET FOR CATEGORY
  // -------------------------------------

  const getBudgetForCategory = (category, month = currentMonth) => {
    const budgetCategory = getBudgetCategory(category);

    return budgets.find(
      (budget) =>
        (budget.currency || "NGN") === defaultCurrency &&
        budget.category === budgetCategory &&
        (budget.month || currentMonth) === month,
    );
  };

  // -------------------------------------
  // EFFECTIVE EXPENSE CATEGORY
  // -------------------------------------

  const effectiveExpenseCategory = budgetedCategories.includes(expenseCategory)
    ? expenseCategory
    : budgetedCategories[0] || "";

  // -------------------------------------
  // GET CATEGORY SPENDING
  // -------------------------------------

  const getCategorySpent = (
    category,
    month = currentMonth,
    excludedTransactionId = null,
  ) => {
    const budgetCategory = getBudgetCategory(category);

    return transactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          (transaction.currency || "NGN") === defaultCurrency &&
          getBudgetCategory(transaction.category) === budgetCategory &&
          (transaction.month || transaction.date?.slice(0, 7)) === month &&
          transaction.id !== excludedTransactionId,
      )
      .reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0,
      );
  };

  // -------------------------------------
  // GET CATEGORY REMAINING
  // -------------------------------------

  const getCategoryRemaining = (
    category,
    month = currentMonth,
    excludedTransactionId = null,
  ) => {
    const budget = getBudgetForCategory(category, month);

    if (!budget) {
      return 0;
    }

    const spent = getCategorySpent(category, month, excludedTransactionId);

    return Number(budget.amount || 0) - spent;
  };

  // -------------------------------------
  // SELECTED CATEGORY REMAINING
  // -------------------------------------

  const selectedCategoryRemaining = effectiveExpenseCategory
    ? Math.max(
        getCategoryRemaining(effectiveExpenseCategory, expenseFormMonth),
        0,
      )
    : 0;

  // -------------------------------------
  // CURRENT CURRENCY TRANSACTIONS
  // -------------------------------------

  const currencyTransactions = transactions.filter(
    (transaction) => (transaction.currency || "NGN") === defaultCurrency,
  );

  // -------------------------------------
  // FINANCIAL CALCULATIONS
  // -------------------------------------

  const income = currencyTransactions.reduce((total, transaction) => {
    if (transaction.type === "Income") {
      return total + Number(transaction.amount || 0);
    }

    return total;
  }, 0);

  const expenses = currencyTransactions.reduce((total, transaction) => {
    if (transaction.type === "Expense") {
      return total + Number(transaction.amount || 0);
    }

    return total;
  }, 0);

  const balance = income - expenses;

  // -------------------------------------
  // GOALS
  // -------------------------------------

  const currencyGoals = goals.filter(
    (goal) => (goal.currency || "NGN") === defaultCurrency,
  );

  const totalGoals = currencyGoals.length;

  const totalTarget = currencyGoals.reduce(
    (total, goal) => total + Number(goal.targetAmount || 0),
    0,
  );

  const totalSaved = currencyGoals.reduce(
    (total, goal) => total + Number(goal.currentAmount || 0),
    0,
  );

  const overallProgress =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  // -------------------------------------
  // ADD INCOME
  // -------------------------------------

  const handleAddIncome = async () => {
    const amount = Number(incomeInput);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid income amount.");
      return;
    }

    if (!incomeCategory.trim()) {
      toast.error("Please select an income category.");
      return;
    }

    const month = getTransactionMonth(incomeDate);

    try {
      await addTransaction({
        type: "Income",
        amount,
        category: incomeCategory.trim(),
        date: incomeDate,
        currency: defaultCurrency,
        month,
      });

      setIncomeInput("");
      setShowIncomeModal(false);

      toast.success("Income added successfully!");
    } catch (error) {
      console.error("Add income error:", error);

      toast.error(error?.message || "Failed to add income. Please try again.");
    }
  };

  // -------------------------------------
  // ADD EXPENSE
  // -------------------------------------

  const handleAddExpense = async () => {
    if (budgetedCategories.length === 0) {
      toast.error(
        `Create a budget for ${formatMonthLabel(expenseFormMonth)} first.`,
      );
      return;
    }

    if (!effectiveExpenseCategory) {
      toast.error("Select an expense category.");
      return;
    }

    const sanitizedExpenseInput = String(expenseInput ?? "")
      .trim()
      .replace(/,/g, "");

    const amount = Number(sanitizedExpenseInput);

    if (!sanitizedExpenseInput || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid expense amount.");
      return;
    }

    const month = getTransactionMonth(expenseDate);

    const budget = getBudgetForCategory(effectiveExpenseCategory, month);

    if (!budget) {
      toast.error(
        `${effectiveExpenseCategory} is not covered by a budget for ${formatMonthLabel(
          month,
        )}.`,
      );
      return;
    }

    const remaining = getCategoryRemaining(effectiveExpenseCategory, month);

    if (remaining <= 0) {
      toast.error(
        `${getBudgetCategory(effectiveExpenseCategory)} budget is exhausted.`,
      );
      return;
    }

    if (amount > remaining) {
      toast.error(
        `Only ${currencySymbol}${remaining.toLocaleString()} remains in your ${getBudgetCategory(
          effectiveExpenseCategory,
        )} budget.`,
      );
      return;
    }

    try {
      await addTransaction({
        type: "Expense",
        amount,
        category: effectiveExpenseCategory,
        date: expenseDate,
        currency: defaultCurrency,
        month,
      });

      setExpenseInput("");
      setShowExpenseModal(false);

      toast.success("Expense added successfully!");
    } catch (error) {
      console.error("Add expense error:", error);

      toast.error(error?.message || "Failed to add expense. Please try again.");
    }
  };

  // -------------------------------------
  // EDIT TRANSACTION
  // -------------------------------------

  const handleEditTransaction = (transaction) => {
    setEditingTransaction({
      ...transaction,
      amount: String(transaction.amount),
    });
  };

  // -------------------------------------
  // UPDATE TRANSACTION
  // -------------------------------------

  const handleUpdateTransaction = async () => {
    if (!editingTransaction) {
      return;
    }

    const amount = Number(editingTransaction.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const updatedDate = editingTransaction.date || today;

    const updatedMonth = getTransactionMonth(updatedDate);

    const category = editingTransaction.category?.trim();

    if (!category) {
      toast.error("Please select a category.");
      return;
    }

    // -----------------------------------
    // EXPENSE BUDGET CHECK
    // -----------------------------------

    if (editingTransaction.type === "Expense") {
      const budget = getBudgetForCategory(category, updatedMonth);

      if (!budget) {
        toast.error(
          `You have not created a budget for ${getBudgetCategory(
            category,
          )} in ${formatMonthLabel(updatedMonth)}.`,
        );
        return;
      }

      const spentExcludingCurrent = getCategorySpent(
        category,
        updatedMonth,
        editingTransaction.id,
      );

      const remaining = Number(budget.amount || 0) - spentExcludingCurrent;

      if (amount > remaining) {
        toast.error(
          `Only ${currencySymbol}${Math.max(
            remaining,
            0,
          ).toLocaleString()} remains in your ${getBudgetCategory(
            category,
          )} budget.`,
        );
        return;
      }
    }

    // -----------------------------------
    // UPDATE SUPABASE
    // -----------------------------------

    try {
      await updateTransaction(editingTransaction.id, {
        amount,
        category,
        date: updatedDate,
        month: updatedMonth,
      });

      setEditingTransaction(null);

      toast.success("Transaction updated successfully!");
    } catch (error) {
      console.error("Update transaction error:", error);

      toast.error(
        error?.message || "Failed to update transaction. Please try again.",
      );
    }
  };

  // -------------------------------------
  // DELETE TRANSACTION
  // -------------------------------------

  const handleDeleteTransaction = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTransaction(id);

      toast.success("Transaction deleted successfully!");
    } catch (error) {
      console.error("Delete transaction error:", error);

      toast.error(
        error?.message || "Failed to delete transaction. Please try again.",
      );
    }
  };

  // -------------------------------------
  // FILTER TRANSACTIONS
  // -------------------------------------

  const filteredTransactions = currencyTransactions.filter((transaction) => {
    const matchesFilter = filter === "All" || transaction.type === filter;

    const matchesSearch = transaction.category
      ?.toLowerCase()
      .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // -------------------------------------
  // EXPENSE PIE CHART
  // -------------------------------------

  const expenseChartData = Object.values(
    currencyTransactions
      .filter((transaction) => transaction.type === "Expense")
      .reduce((acc, transaction) => {
        const category = transaction.category;

        if (!acc[category]) {
          acc[category] = {
            name: category,
            value: 0,
          };
        }

        acc[category].value += Number(transaction.amount || 0);

        return acc;
      }, {}),
  );

  // -------------------------------------
  // INCOME VS EXPENSE CHART
  // -------------------------------------

  const incomeExpenseChartData = (() => {
    const monthlyData = {};

    currencyTransactions.forEach((transaction) => {
      if (!transaction.date) {
        return;
      }

      const month = transaction.date.slice(0, 7);

      if (!monthlyData[month]) {
        monthlyData[month] = {
          month,
          Income: 0,
          Expenses: 0,
        };
      }

      const amount = Number(transaction.amount || 0);

      if (transaction.type === "Income") {
        monthlyData[month].Income += amount;
      }

      if (transaction.type === "Expense") {
        monthlyData[month].Expenses += amount;
      }
    });

    return Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        ...item,
        month: formatMonthLabel(item.month),
      }));
  })();

  // -------------------------------------
  // SUMMARY CARDS
  // -------------------------------------

  const summaryCards = [
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
      amount: totalSaved,
      icon: PiggyBank,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  // -------------------------------------
  // RENDER
  // -------------------------------------

  return (
    <section className="space-y-8">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          {greeting} 👋, welcome back
        </h1>

        <p className="text-gray-500">Here's your financial overview.</p>

        <p className="mt-1 text-sm font-medium text-indigo-600">
          Currency: {defaultCurrency}
        </p>

        <p className="mt-1 text-sm text-slate-500">
          Budget period:{" "}
          <span className="font-medium text-slate-700">
            {currentMonthLabel}
          </span>
        </p>
      </div>

      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-2 items-stretch gap-4 md:grid-cols-2 md:gap-5 xl:grid-cols-4 xl:gap-6">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.title}
            title={card.title}
            amount={card.amount}
            icon={card.icon}
            iconBg={card.iconBg}
            iconColor={card.iconColor}
            currency={currencySymbol}
          />
        ))}
      </div>

      {/* ADD INCOME / EXPENSE */}

      <div className="mx-auto grid grid-cols-2 justify-center gap-4 md:w-2/3">
        <button
          type="button"
          onClick={() => setShowIncomeModal(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl bg-green-600 p-5 text-white shadow-md transition hover:bg-green-700 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <TrendingUp size={26} />
          </div>

          <span className="text-sm font-semibold">Add Income</span>
        </button>

        <button
          type="button"
          onClick={() => setShowExpenseModal(true)}
          className="flex flex-col items-center justify-center gap-2 rounded-xl bg-red-600 p-5 text-white shadow-md transition hover:bg-red-700 active:scale-95"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20">
            <Receipt size={26} />
          </div>

          <span className="text-sm font-semibold">Add Expense</span>
        </button>
      </div>

      {/* GOALS OVERVIEW */}

      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Goals Overview
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Showing goals in your current currency.
            </p>
          </div>

          <div className="text-3xl">🎯</div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Goals</p>

            <p className="mt-2 text-2xl font-bold">{totalGoals}</p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Target</p>

            <p className="mt-2 text-2xl font-bold">
              {currencySymbol}
              {totalTarget.toLocaleString()}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total Saved</p>

            <p className="mt-2 text-2xl font-bold text-green-600">
              {currencySymbol}
              {totalSaved.toLocaleString()}
            </p>
          </div>
        </div>

        {/* PROGRESS */}

        <div className="mt-6">
          <div className="mb-2 flex justify-between">
            <span className="text-sm font-medium text-slate-600">
              Overall Progress
            </span>

            <span className="text-sm font-semibold">
              {overallProgress.toFixed(1)}%
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{
                width: `${overallProgress}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* YOUR GOALS */}

      <div className="rounded-xl bg-white p-6 shadow-md">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Goals</h2>

          {currencyGoals.length > 0 && (
            <button
              type="button"
              onClick={() => navigate("/goals")}
              className="text-sm font-semibold text-indigo-600"
            >
              View All Goals →
            </button>
          )}
        </div>

        {currencyGoals.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            You haven't created any goals yet.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {currencyGoals.map((goal) => {
              const target = Number(goal.targetAmount || 0);

              const saved = Number(goal.currentAmount || 0);

              const progress =
                target > 0 ? Math.min((saved / target) * 100, 100) : 0;

              return (
                <div
                  key={goal.id}
                  onClick={() => navigate("/goals")}
                  className="cursor-pointer rounded-lg border p-4 hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{goal.name}</h3>

                      <p className="text-sm text-slate-500">{goal.type}</p>
                    </div>

                    <span className="font-semibold">
                      {progress.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{
                        width: `${progress}%`,
                      }}
                    />
                  </div>

                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-slate-500">
                      Saved: {currencySymbol}
                      {saved.toLocaleString()}
                    </span>

                    <span className="text-slate-500">
                      Target: {currencySymbol}
                      {target.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INCOME MODAL */}

      {showIncomeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowIncomeModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <TrendingUp size={24} />
              </div>

              <h2 className="text-xl font-bold text-slate-900">Add Income</h2>

              <p className="mt-1 text-sm text-slate-500">
                Record money you've received.
              </p>
            </div>

            <TransactionForm
              amount={incomeInput}
              setAmount={setIncomeInput}
              category={incomeCategory}
              setCategory={setIncomeCategory}
              date={incomeDate}
              setDate={setIncomeDate}
              onSubmit={handleAddIncome}
              buttonText="Add Income"
              categoryOptions={[
                "Salary",
                "Business",
                "Investment",
                "Gift",
                "Other",
              ]}
              type="Income"
              categoryLabel="Category"
              dateLabel="Date"
              amountLabel="Amount"
              amountPlaceholder="Enter amount"
            />
          </div>
        </div>
      )}

      {/* EXPENSE MODAL */}

      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setShowExpenseModal(false)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Receipt size={24} />
              </div>

              <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>

              <p className="mt-1 text-sm text-slate-500">
                Record money you've spent.
              </p>

              <p className="mt-2 text-xs font-medium text-indigo-600">
                Budget period: {formatMonthLabel(expenseFormMonth)}
              </p>
            </div>

            <ExpenseForm
              setExpenseCategory={setExpenseCategory}
              setExpenseDate={setExpenseDate}
              setExpenseInput={setExpenseInput}
              expenseCategory={effectiveExpenseCategory}
              expenseDate={expenseDate}
              expenseInput={expenseInput}
              onSubmit={handleAddExpense}
              buttonText="Add Expense"
              categoryOptions={budgetedCategories}
              currencySymbol={currencySymbol}
              selectedCategoryRemaining={selectedCategoryRemaining}
              noBudgetMessage={`No budget found for ${formatMonthLabel(
                expenseFormMonth,
              )}. Create a budget first.`}
            />
          </div>
        </div>
      )}

      {/* CHARTS */}

      <div className="grid gap-6 lg:grid-cols-2">
        <ExpensePieChart data={expenseChartData} />

        <IncomeExpenseChart data={incomeExpenseChartData} />
      </div>

      {/* RECENT TRANSACTIONS */}

      <div className="rounded-xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-xl font-semibold">Recent Transactions</h2>

          <div className="flex gap-3 w-full md:w-auto flex-col md:flex-row">
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

        <div className="max-h-125 space-y-3 overflow-y-auto pr-2">
          {currencyTransactions.length === 0 ? (
            <p className="text-center text-gray-500">
              No {defaultCurrency} transactions yet.
            </p>
          ) : filteredTransactions.length === 0 ? (
            <p className="text-center text-gray-500">No matching results.</p>
          ) : (
            filteredTransactions
              .slice(0, 5)
              .map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  showActions={true}
                  onEdit={handleEditTransaction}
                  onDelete={handleDeleteTransaction}
                />
              ))
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <Link
            to="/expenses"
            className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
          >
            View All Expenses →
          </Link>
        </div>
      </div>

      {/* EDIT TRANSACTION MODAL */}

      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setEditingTransaction(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>

            <h2 className="text-xl font-bold text-slate-900">
              Edit {editingTransaction.type}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Update your transaction details.
            </p>

            <div className="mt-6 grid gap-4">
              {/* CATEGORY */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Category
                </label>

                <select
                  value={editingTransaction.category || ""}
                  onChange={(e) =>
                    setEditingTransaction((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                >
                  {editingTransaction.type === "Income" ? (
                    <>
                      <option>Salary</option>

                      <option>Business</option>

                      <option>Investment</option>

                      <option>Gift</option>

                      <option>Other</option>
                    </>
                  ) : (
                    <>
                      {expenseCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              {/* DATE */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Date
                </label>

                <input
                  type="date"
                  value={editingTransaction.date || ""}
                  max={today}
                  onChange={(e) =>
                    setEditingTransaction((prev) => ({
                      ...prev,
                      date: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              {/* AMOUNT */}

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Amount
                </label>

                <input
                  type="number"
                  min="0"
                  value={editingTransaction.amount || ""}
                  onChange={(e) =>
                    setEditingTransaction((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-300 p-3"
                />
              </div>

              {/* SAVE */}

              <button
                type="button"
                onClick={handleUpdateTransaction}
                className={`mt-2 rounded-lg py-3 font-semibold text-white ${
                  editingTransaction.type === "Income"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default Dashboard;
