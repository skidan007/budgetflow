import { useState } from "react";
import BudgetProgress from "../components/BudgetProgress";
import { useFinance } from "../context/FinanceContext";
import toast from "react-hot-toast";

function Budgets() {
  const {
    transactions,
    budgets,
    setBudgets,
    defaultCurrency,
    currencySymbol,
  } = useFinance();

  const [budgetCategory, setBudgetCategory] = useState("Food");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [editingBudgetId, setEditingBudgetId] = useState(null);

  const currentCurrencyBudgets = budgets.filter(
    (budget) => (budget.currency || "NGN") === defaultCurrency,
  );

  const totalIncome = transactions
    .filter(
      (transaction) =>
        transaction.type === "Income" &&
        (transaction.currency || "NGN") === defaultCurrency,
    )
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const totalBudgetAmount = currentCurrencyBudgets.reduce(
    (total, budget) => total + Number(budget.amount || 0),
    0,
  );

  const handleAddBudget = () => {
    const amount = Number(budgetAmount);

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      toast.error("Enter a valid budget amount");
      return;
    }

    if (totalIncome <= 0) {
      toast.error("Add income first before creating a budget.");
      return;
    }

    if (amount > totalIncome) {
      toast.error(
        `A single budget cannot be greater than your total income (${currencySymbol}${totalIncome.toLocaleString()}).`,
      );
      return;
    }

    const existing = currentCurrencyBudgets.find(
      (budget) => budget.category === budgetCategory,
    );

    if (
      editingBudgetId &&
      existing &&
      existing.id !== editingBudgetId
    ) {
      toast.error(
        `A ${budgetCategory} budget already exists. Edit that budget instead.`,
      );
      return;
    }

    const editingBudget = editingBudgetId
      ? currentCurrencyBudgets.find((budget) => budget.id === editingBudgetId)
      : null;

    const budgetToReplace = editingBudget || existing;

    const adjustedTotal =
      totalBudgetAmount - Number(budgetToReplace?.amount || 0) + amount;

    if (adjustedTotal > totalIncome) {
      toast.error(
        `Total budget cannot exceed total income (${currencySymbol}${totalIncome.toLocaleString()}).`,
      );
      return;
    }

    setBudgets((prev) => {
      const existingBudget = prev.find(
        (budget) =>
          budget.category === budgetCategory &&
          (budget.currency || "NGN") === defaultCurrency,
      );

      const targetBudgetId = editingBudgetId || existingBudget?.id;

      if (targetBudgetId) {
        return prev.map((budget) =>
          budget.id === targetBudgetId
            ? {
                ...budget,
                category: budgetCategory,
                amount,
                currency: defaultCurrency,
              }
            : budget,
        );
      }

      return [
        ...prev,
        {
          id: Date.now(),
          category: budgetCategory,
          amount,
          currency: defaultCurrency,
        },
      ];
    });

    setBudgetAmount("");
    setBudgetCategory("Food");
    setEditingBudgetId(null);

    toast.success(
      editingBudgetId
        ? "Budget updated successfully!"
        : "Budget saved successfully!",
    );
  };

  const handleEditBudget = (budget) => {
    setEditingBudgetId(budget.id);
    setBudgetCategory(budget.category);
    setBudgetAmount(String(budget.amount || ""));
  };

  const handleDeleteBudget = (budgetId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this budget?",
    );

    if (!confirmed) return;

    setBudgets((prev) => prev.filter((budget) => budget.id !== budgetId));

    if (editingBudgetId === budgetId) {
      setEditingBudgetId(null);
      setBudgetCategory("Food");
      setBudgetAmount("");
    }

    toast.success("Budget deleted successfully!");
  };

  const progressItems = currentCurrencyBudgets;

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Budget Planner</h1>

      {/* Budget planner */}
      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Budget Planner</h2>

        <p className="mb-4 text-sm text-slate-500">
          Total Budget: {currencySymbol}
          {totalBudgetAmount.toLocaleString()} / Total Income: {currencySymbol}
          {totalIncome.toLocaleString()}
        </p>

        <div className="space-y-4">
          <select
            value={budgetCategory}
            onChange={(e) => setBudgetCategory(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Bills</option>
            <option>Entertainment</option>
            <option>Shopping</option>
            <option>Health</option>
          </select>

          <input
            type="number"
            placeholder="Budget Amount"
            value={budgetAmount}
            onChange={(e) => setBudgetAmount(e.target.value)}
            className="w-full rounded-lg border p-3"
          />

          <button
            onClick={handleAddBudget}
            className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            {editingBudgetId ? "Update Budget" : "Save Budget"}
          </button>

          {editingBudgetId && (
            <button
              type="button"
              onClick={() => {
                setEditingBudgetId(null);
                setBudgetCategory("Food");
                setBudgetAmount("");
              }}
              className="w-full rounded-lg border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel Edit
            </button>
          )}
        </div>
      </div>

      {/* progress bar */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Budget Progress</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {progressItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500 md:col-span-2 lg:col-span-3">
              No expenses or budgets yet. Add an expense or set a budget to see
              progress.
            </p>
          ) : (
            currentCurrencyBudgets.map((budget) => {
              const spent = transactions
                .filter(
                  (transaction) =>
                    transaction.type === "Expense" &&
                    (transaction.currency || "NGN") === defaultCurrency &&
                    transaction.category === budget.category,
                )
                .reduce((total, transaction) => total + transaction.amount, 0);

              return (
                <BudgetProgress
                  key={budget.id}
                  category={budget.category}
                  budget={budget.amount}
                  spent={spent}
                  currencySymbol={currencySymbol}
                  onEdit={() => handleEditBudget(budget)}
                  onDelete={() => handleDeleteBudget(budget.id)}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default Budgets;
