import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import Modal from "../components/Modal";
import ExpenseForm from "../components/ExpenseForm";
import toast from "react-hot-toast";

const currencyMap = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
  CAD: "C$",
  AUD: "A$",
  CHF: "CHF",
};

const getMonthFromDate = (date) => {
  if (!date) {
    const today = new Date();

    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(
      2,
      "0",
    )}`;
  }

  return date.slice(0, 7);
};

const Expenses = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [editingExpense, setEditingExpense] = useState(null);

  const {
  transactions,
  defaultCurrency,
  currentMonth,
  currentMonthLabel,
  budgets,
  deleteTransaction,
  updateTransaction,
  getMonthLabel,
} = useFinance();

  // -------------------------------------
  // CURRENT MONTH EXPENSES
  // -------------------------------------

  const expenses = transactions.filter(
    (transaction) =>
      transaction.type === "Expense" &&
      (transaction.currency || "NGN") === defaultCurrency &&
      (transaction.month || getMonthFromDate(transaction.date)) ===
        currentMonth,
  );

  const currencySymbol = currencyMap[defaultCurrency] || "₦";

  // -------------------------------------
// BUDGETED CATEGORIES
// -------------------------------------

const currentMonthBudgets = budgets.filter(
  (budget) =>
    budget.currency === defaultCurrency &&
    budget.month === currentMonth,
);

const budgetedCategories =
  currentMonthBudgets.map(
    (budget) => budget.category,
  );

  const getCategoryRemaining = (category) => {
  const budget = currentMonthBudgets.find(
    (item) => item.category === category,
  );

  if (!budget) return 0;

  const spent = expenses
    .filter(
      (expense) =>
        expense.category === category,
    )
    .reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0,
    );

  return Math.max(
    Number(budget.amount) - spent,
    0,
  );
};

  // -------------------------------------
  // SEARCH & CATEGORY FILTER
  // -------------------------------------

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.category
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || expense.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // -------------------------------------
  // SORT
  // -------------------------------------

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortBy) {
      case "Newest":
        return new Date(b.date) - new Date(a.date);

      case "Oldest":
        return new Date(a.date) - new Date(b.date);

      case "Highest Amount":
        return Number(b.amount) - Number(a.amount);

      case "Lowest Amount":
        return Number(a.amount) - Number(b.amount);

      default:
        return 0;
    }
  });

  // -------------------------------------
  // TOTAL CURRENT MONTH EXPENSES
  // -------------------------------------

  const totalExpenses = expenses.reduce(
    (total, expense) => total + (Number(expense.amount) || 0),
    0,
  );

  // -------------------------------------
  // DELETE EXPENSE
  // -------------------------------------

  const handleDeleteExpense = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) {
      return;
    }

    try {
      await deleteTransaction(id);

      toast.success("Expense deleted successfully!");
    } catch (error) {
      console.error("Delete expense error:", error);

      toast.error("Failed to delete expense. Please try again.");
    }
  };

  // -------------------------------------
  // EDIT EXPENSE
  // -------------------------------------

  const handleEditChange = (field, value) => {
    setEditingExpense((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // -------------------------------------
  // UPDATE EXPENSE
  // -------------------------------------

  const handleUpdateExpense = async () => {
    if (!editingExpense) return;

    const amount = Number(editingExpense.amount);

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      toast.error("Enter a valid amount");
      return;
    }

    const updatedDate =
      editingExpense.date || new Date().toISOString().split("T")[0];

    const updatedMonth = getMonthFromDate(updatedDate);

    const category = editingExpense.category?.trim();

    if (!category) {
      toast.error("Please select a category.");
      return;
    }

    // -------------------------------------
    // CHECK THAT CATEGORY IS BUDGETED
    // -------------------------------------

    const categoryBudget = budgets.find(
      (budget) =>
        budget.category === category &&
        budget.currency === defaultCurrency &&
        budget.month === updatedMonth,
    );

    if (!categoryBudget) {
      toast.error(
        `${category} is not included in your budget for ${getMonthLabel(
          updatedMonth,
        )}.`,
      );

      return;
    }

    // -------------------------------------
    // CALCULATE CURRENT SPENDING
    // EXCLUDING THE EXPENSE BEING EDITED
    // -------------------------------------

    const spentBeforeThisExpense = transactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" &&
          transaction.id !== editingExpense.id &&
          transaction.category === category &&
          transaction.currency === defaultCurrency &&
          (transaction.month || getMonthFromDate(transaction.date)) ===
            updatedMonth,
      )
      .reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0,
      );

    // -------------------------------------
    // CHECK BUDGET LIMIT
    // -------------------------------------

    const remainingBudget =
      Number(categoryBudget.amount) - spentBeforeThisExpense;

    if (amount > remainingBudget) {
      toast.error(
        `This expense exceeds your ${category} budget. You have ${currencySymbol}${remainingBudget.toLocaleString()} remaining.`,
      );

      return;
    }

    // -------------------------------------
    // UPDATE SUPABASE
    // -------------------------------------

    try {
      await updateTransaction(editingExpense.id, {
        amount,
        category,
        date: updatedDate,
        month: updatedMonth,
      });

      toast.success("Expense updated successfully!");

      setEditingExpense(null);
    } catch (error) {
      console.error("Update expense error:", error);

      toast.error("Failed to update expense. Please try again.");
    }
  };

  return (
    <section>
      {/* HEADER */}

      <h1 className="text-3xl font-bold text-slate-900">Expenses</h1>

      <p className="text-gray-500">Track and categorize your spending.</p>

      {/* CURRENT MONTH */}

      <div className="mt-4 rounded-lg bg-indigo-50 p-4">
        <p className="text-sm text-indigo-600">Current Budget Period</p>

        <p className="mt-1 text-lg font-semibold text-indigo-900">
          {currentMonthLabel}
        </p>
      </div>

      {/* TOTAL EXPENSES */}

      <div className="mt-6 mb-6 rounded-xl bg-white p-6 shadow-md">
        <p className="text-sm text-slate-500">
          Total Expenses for {currentMonthLabel}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-red-600">
          {currencySymbol}
          {totalExpenses.toLocaleString()}
        </h2>
      </div>

      {/* FILTERS */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search by category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border p-3"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border p-3"
        >
          <option>All</option>
          <option>Food</option>
          <option>Transport</option>
          <option>Bills</option>
          <option>Entertainment</option>
          <option>Shopping</option>
          <option>Health</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="rounded-lg border p-3"
        >
          <option>Newest</option>
          <option>Oldest</option>
          <option>Highest Amount</option>
          <option>Lowest Amount</option>
        </select>
      </div>

      {/* EXPENSE LIST */}

      <div className="space-y-4">
        {sortedExpenses.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-slate-500">
            No expenses for {currentMonthLabel}.
          </p>
        ) : (
          sortedExpenses.map((expense) => {
            const expenseCurrency = currencyMap[expense.currency] || "₦";

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-xl border p-4 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold">{expense.category}</h3>

                  <p className="text-sm text-slate-500">{expense.date}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-600">
                    {expenseCurrency}
                    {Number(expense.amount || 0).toLocaleString()}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingExpense({
                        ...expense,
                      })
                    }
                    className="rounded bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="rounded bg-red-500 px-3 py-1 text-sm text-white transition hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* EDIT MODAL */}

      <Modal
        isOpen={editingExpense !== null}
        onClose={() => setEditingExpense(null)}
        title="Edit Expense"
      >
        <ExpenseForm
  expenseInput={
    editingExpense?.amount || ""
  }
  setExpenseInput={(value) =>
    handleEditChange("amount", value)
  }

  expenseCategory={
    editingExpense?.category || ""
  }
  setExpenseCategory={(value) =>
    handleEditChange("category", value)
  }

  expenseDate={
    editingExpense?.date || ""
  }
  setExpenseDate={(value) =>
    handleEditChange("date", value)
  }

  categoryOptions={budgetedCategories}

  currencySymbol={currencySymbol}

  selectedCategoryRemaining={
    editingExpense
      ? getCategoryRemaining(
          editingExpense.category,
        ) + Number(editingExpense.amount || 0)
      : 0
  }

  noBudgetMessage={`You don't have any budgeted categories for ${currentMonthLabel}. Create a budget first before adding an expense.`}

  onSubmit={handleUpdateExpense}

  buttonText="Update Expense"
/>
      </Modal>
    </section>
  );
};

export default Expenses;
