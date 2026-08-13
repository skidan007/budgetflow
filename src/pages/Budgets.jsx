import { useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import BudgetProgress from "../components/BudgetProgress";
import Modal from "../components/Modal";
import { useFinance } from "../context/FinanceContext";

const budgetCategories = [
  "Food",
  "Transport",
  "Bills",
  "Entertainment",
  "Shopping",
  "Health",
];

const categoryIcons = {
  Food: "🍔",
  Transport: "🚗",
  Bills: "💡",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Health: "🏥",
};

function getTransactionMonth(transaction) {
  return transaction.month || transaction.date?.slice(0, 7) || "";
}

function Budgets() {
  const navigate = useNavigate();
  const {
    transactions,
    budgets,
    setBudgets,
    defaultCurrency,
    currencySymbol,
    currentMonth,
    currentMonthLabel,
    getMonthLabel,
  } = useFinance();

  const [activeTab, setActiveTab] = useState("ongoing");
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [selectedHistoryMonth, setSelectedHistoryMonth] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [editingBudget, setEditingBudget] = useState(null);

  // Only budgets and transactions in the active month affect this screen.
  const currentMonthBudgets = budgets.filter(
    (budget) =>
      (budget.currency || "NGN") === defaultCurrency &&
      (budget.month || currentMonth) === currentMonth,
  );

  const currentMonthTransactions = transactions.filter(
    (transaction) =>
      (transaction.currency || "NGN") === defaultCurrency &&
      getTransactionMonth(transaction) === currentMonth,
  );

  const totalIncome = currentMonthTransactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const totalBudgetAmount = currentMonthBudgets.reduce(
    (total, budget) => total + Number(budget.amount || 0),
    0,
  );

  const historyMonths = Array.from(
    new Set(
      budgets
        .filter((budget) => (budget.currency || "NGN") === defaultCurrency)
        .map((budget) => budget.month)
        .filter((month) => month && month !== currentMonth),
    ),
  ).sort((first, second) => second.localeCompare(first));

  const historyMonth = selectedHistoryMonth || historyMonths[0] || "";
  const historyBudgets = budgets.filter(
    (budget) =>
      (budget.currency || "NGN") === defaultCurrency &&
      budget.month === historyMonth,
  );
  const historyTransactions = transactions.filter(
    (transaction) =>
      (transaction.currency || "NGN") === defaultCurrency &&
      getTransactionMonth(transaction) === historyMonth,
  );
  const historyTotalBudget = historyBudgets.reduce(
    (total, budget) => total + Number(budget.amount || 0),
    0,
  );
  const historyTotalSpent = historyTransactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const getSpent = (budget, monthTransactions) =>
    monthTransactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" && transaction.category === budget.category,
      )
      .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const resetForm = () => {
    setBudgetCategory("Food");
    setBudgetAmount("");
    setEditingBudget(null);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEditBudget = (budget) => {
    setEditingBudget(budget);
    setBudgetCategory(budget.category);
    setBudgetAmount(String(budget.amount || ""));
    setSelectedBudget(null);
    setIsFormOpen(true);
  };

  const handleSaveBudget = () => {
    const amount = Number(budgetAmount);

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      toast.error("Enter a valid budget amount");
      return;
    }

    if (totalIncome <= 0) {
      toast.error("Add income for this month before creating a budget.");
      return;
    }

    const existingBudget = currentMonthBudgets.find(
      (budget) => budget.category === budgetCategory,
    );

    if (editingBudget && existingBudget && existingBudget.id !== editingBudget.id) {
      toast.error(
        `A ${budgetCategory} budget already exists for ${currentMonthLabel}.`,
      );
      return;
    }

    const budgetToReplace = editingBudget || existingBudget;
    const adjustedTotal =
      totalBudgetAmount - Number(budgetToReplace?.amount || 0) + amount;

    if (adjustedTotal > totalIncome) {
      toast.error(
        `Total budget cannot exceed total income (${currencySymbol}${totalIncome.toLocaleString()}).`,
      );
      return;
    }

    setBudgets((previousBudgets) => {
      if (editingBudget) {
        // Keep an existing budget in its original financial month.
        return previousBudgets.map((budget) =>
          budget.id === editingBudget.id
            ? {
                ...budget,
                category: budgetCategory,
                amount,
                currency: defaultCurrency,
                month: editingBudget.month,
              }
            : budget,
        );
      }

      if (existingBudget) {
        return previousBudgets.map((budget) =>
          budget.id === existingBudget.id
            ? { ...budget, amount, currency: defaultCurrency, month: currentMonth }
            : budget,
        );
      }

      return [
        ...previousBudgets,
        {
          id: Date.now(),
          category: budgetCategory,
          amount,
          currency: defaultCurrency,
          month: currentMonth,
        },
      ];
    });

    toast.success(editingBudget ? "Budget updated successfully!" : "Budget saved successfully!");
    closeForm();
  };

  const handleDeleteBudget = (budgetId) => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;

    setBudgets((previousBudgets) =>
      previousBudgets.filter((budget) => budget.id !== budgetId),
    );
    setSelectedBudget(null);
    toast.success("Budget deleted successfully!");
  };

  return (
    <section className="relative mx-auto max-w-5xl pb-24">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <p className="mt-1 text-sm text-slate-500">Budget for {currentMonthLabel}</p>
      </header>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm dark:border-indigo-800/50 dark:bg-indigo-950/30 sm:p-8">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200">
          Budget for {currentMonthLabel}
        </p>
        <p className="mt-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          Total Budget
        </p>
        <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100 sm:text-5xl">
          {currencySymbol}{totalBudgetAmount.toLocaleString()}
        </p>
        <button
          type="button"
          onClick={openCreateForm}
          className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          Create a Budget <ArrowRight size={18} aria-hidden="true" />
        </button>
      </section>

      <div className="mt-8 border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-7">
          {["ongoing", "history"].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`min-h-12 border-b-2 px-1 text-sm font-semibold capitalize transition ${
                activeTab === tab
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "ongoing" ? (
        <div className="mt-6">
          {currentMonthBudgets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No budgets for {currentMonthLabel} yet. Create one to start tracking your spending.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {currentMonthBudgets.map((budget) => {
                const spent = getSpent(budget, currentMonthTransactions);
                const remaining = Number(budget.amount || 0) - spent;

                return (
                  <button
                    key={budget.id}
                    type="button"
                    onClick={() => setSelectedBudget(budget)}
                    className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-2xl" aria-hidden="true">
                        {categoryIcons[budget.category] || "💰"}
                      </span>
                      <ArrowRight size={19} className="text-slate-400" aria-hidden="true" />
                    </div>
                    <h2 className="mt-3 text-lg font-semibold">{budget.category}</h2>
                    <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
                      <div>
                        <p className="text-slate-500">Budget</p>
                        <p className="mt-1 font-bold">
                          {currencySymbol}{Number(budget.amount || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-500">{remaining < 0 ? "Over by" : "Remaining"}</p>
                        <p className={`mt-1 font-bold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>
                          {currencySymbol}{Math.abs(remaining).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-indigo-600">View progress</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <section className="mt-6">
          <h2 className="text-xl font-bold">Past Budgets</h2>
          <label htmlFor="history-month" className="mt-5 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Select Month
          </label>
          <select
            id="history-month"
            value={historyMonth}
            onChange={(event) => setSelectedHistoryMonth(event.target.value)}
            disabled={historyMonths.length === 0}
            className="mt-2 min-h-12 w-full max-w-sm rounded-lg border p-3"
          >
            {historyMonths.length === 0 ? (
              <option>No past budgets yet</option>
            ) : (
              historyMonths.map((month) => (
                <option key={month} value={month}>{getMonthLabel(month)}</option>
              ))
            )}
          </select>

          {historyMonth && (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700">
                <p className="text-sm text-slate-500">{getMonthLabel(historyMonth)}</p>
                <p className="mt-4 text-sm text-slate-500">Total Budget</p>
                <p className="mt-1 text-3xl font-bold">{currencySymbol}{historyTotalBudget.toLocaleString()}</p>
                <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
                  <p><span className="block text-slate-500">Spent</span><span className="font-semibold">{currencySymbol}{historyTotalSpent.toLocaleString()}</span></p>
                  <p><span className="block text-slate-500">Remaining</span><span className="font-semibold">{currencySymbol}{(historyTotalBudget - historyTotalSpent).toLocaleString()}</span></p>
                </div>
              </div>

              <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700">
                {historyBudgets.map((budget) => {
                  const spent = getSpent(budget, historyTransactions);
                  const percentage = budget.amount > 0 ? Math.min((spent / budget.amount) * 100, 100) : 0;

                  return (
                    <div key={budget.id} className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="font-semibold">{budget.category}</p>
                        <p className="font-semibold">{currencySymbol}{Number(budget.amount || 0).toLocaleString()}</p>
                      </div>
                      <p className="mt-1 text-sm text-slate-500">Spent {currencySymbol}{spent.toLocaleString()} · {percentage.toFixed(0)}%</p>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => navigate("/reports")}
                className="inline-flex min-h-12 items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700"
              >
                View More History <ArrowRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        onClick={openCreateForm}
        aria-label="Create a budget"
        title="Create a budget"
        className="fixed bottom-6 right-6 grid size-14 place-items-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 md:absolute md:right-0 md:top-44"
      >
        <Plus size={26} aria-hidden="true" />
      </button>

      <Modal
        isOpen={isFormOpen}
        onClose={closeForm}
        title={editingBudget ? "Edit Budget" : "Create a Budget"}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            {editingBudget ? `Editing ${getMonthLabel(editingBudget.month)}` : currentMonthLabel}
          </p>
          <select
            value={budgetCategory}
            onChange={(event) => setBudgetCategory(event.target.value)}
            className="min-h-12 w-full rounded-lg border p-3"
          >
            {budgetCategories.map((category) => <option key={category}>{category}</option>)}
          </select>
          <input
            type="number"
            min="0"
            placeholder="Budget amount"
            value={budgetAmount}
            onChange={(event) => setBudgetAmount(event.target.value)}
            className="min-h-12 w-full rounded-lg border p-3"
          />
          <button
            type="button"
            onClick={handleSaveBudget}
            className="min-h-12 w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            {editingBudget ? "Update Budget" : "Save Budget"}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={selectedBudget !== null}
        onClose={() => setSelectedBudget(null)}
        title={selectedBudget ? `${selectedBudget.category} Budget` : "Budget Details"}
      >
        {selectedBudget && (
          <BudgetProgress
            category={selectedBudget.category}
            budget={selectedBudget.amount}
            spent={getSpent(selectedBudget, currentMonthTransactions)}
            currencySymbol={currencySymbol}
            onEdit={() => handleEditBudget(selectedBudget)}
            onDelete={() => handleDeleteBudget(selectedBudget.id)}
          />
        )}
      </Modal>
    </section>
  );
}

export default Budgets;
