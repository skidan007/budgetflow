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

// -------------------------------------
// MONTH HELPER
// -------------------------------------

const getMonthFromDate = (date) => {
  if (!date) {
    const today = new Date();

    return `${today.getFullYear()}-${String(
      today.getMonth() + 1,
    ).padStart(2, "0")}`;
  }

  return date.slice(0, 7);
};

// -------------------------------------
// EXPENSES
// -------------------------------------

const Expenses = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [editingExpense, setEditingExpense] = useState(null);

  const {
  transactions,
  updateTransaction,
  deleteTransaction,
  budgets,
  defaultCurrency,
  currentMonth,
  currentMonthLabel,
  getMonthLabel,
} = useFinance();

  const currencySymbol = currencyMap[defaultCurrency] || "₦";

  // -------------------------------------
  // CURRENT MONTH EXPENSES
  // -------------------------------------

  const expenses = transactions.filter((transaction) => {
    const transactionMonth =
      transaction.month || getMonthFromDate(transaction.date);

    return (
      transaction.type === "Expense" &&
      (transaction.currency || "NGN") === defaultCurrency &&
      transactionMonth === currentMonth
    );
  });

  // -------------------------------------
  // CURRENT MONTH BUDGETS
  // -------------------------------------

  const currentMonthBudgets = budgets.filter((budget) => {
    return (
      (budget.currency || "NGN") === defaultCurrency &&
      (budget.month || currentMonth) === currentMonth
    );
  });

  // -------------------------------------
  // BUDGETED CATEGORIES
  // -------------------------------------

  const budgetedCategories = currentMonthBudgets
    .map((budget) => budget.category)
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  // -------------------------------------
  // CATEGORY REMAINING
  // -------------------------------------

  const getCategoryRemaining = (
    category,
    month = currentMonth,
    excludedExpenseId = null,
  ) => {
    const budget = budgets.find(
  (item) =>
    item.category === category &&
    (item.currency || "NGN") === defaultCurrency &&
    (item.month || currentMonth) === currentMonth
);

const budgetAmount = Number(budget?.amount || 0);

    if (!budget) {
      return 0;
    }

    const spent = transactions
      .filter((transaction) => {
        const transactionMonth =
          transaction.month || getMonthFromDate(transaction.date);

        return (
          transaction.type === "Expense" &&
          (transaction.currency || "NGN") === defaultCurrency &&
          transaction.category === category &&
          transactionMonth === month &&
          transaction.id !== excludedExpenseId
        );
      })
      .reduce(
        (total, transaction) =>
          total + Number(transaction.amount || 0),
        0,
      );

    return Math.max(
      budgetAmount - spent,
      0,
    );
  };

  // -------------------------------------
  // SEARCH & CATEGORY FILTER
  // -------------------------------------

  const filteredExpenses = expenses.filter((expense) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      expense.category?.toLowerCase().includes(searchTerm) ||
      expense.description?.toLowerCase().includes(searchTerm);

    const matchesCategory =
      selectedCategory === "All" ||
      expense.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // -------------------------------------
  // SORT
  // -------------------------------------

  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => {
      switch (sortBy) {
        case "Newest":
          return new Date(b.date) - new Date(a.date);

        case "Oldest":
          return new Date(a.date) - new Date(b.date);

        case "Highest Amount":
          return (
            Number(b.amount || 0) -
            Number(a.amount || 0)
          );

        case "Lowest Amount":
          return (
            Number(a.amount || 0) -
            Number(b.amount || 0)
          );

        default:
          return 0;
      }
    },
  );

  // -------------------------------------
  // TOTAL EXPENSES
  // -------------------------------------

  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + (Number(expense.amount) || 0),
    0,
  );

  // -------------------------------------
  // DELETE EXPENSE
  // -------------------------------------

  const handleDeleteExpense = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this expense?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteTransaction(id);

      toast.success(
        "Expense deleted successfully!",
      );
    } catch (error) {
      console.error(
        "Delete expense error:",
        error,
      );

      toast.error(
        "Failed to delete expense. Please try again.",
      );
    }
  };

  // -------------------------------------
  // EDIT EXPENSE
  // -------------------------------------

  const handleEditChange = (field, value) => {
    setEditingExpense((prev) => ({
      
      [field]: value,
      ...prev,
    }));
  };

  // -------------------------------------
  // UPDATE EXPENSE
  // -------------------------------------

  const handleUpdateExpense = async () => {
    if (!editingExpense) {
      return;
    }

    const amount = Number(
      editingExpense.amount,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      toast.error(
        "Please enter a valid expense amount.",
      );

      return;
    }

    const updatedDate =
      editingExpense.date ||
      new Date()
        .toISOString()
        .split("T")[0];

    const updatedMonth =
      getMonthFromDate(updatedDate);

    const category =
      editingExpense.category?.trim();

    if (!category) {
      toast.error(
        "Please select a category.",
      );

      return;
    }

    const sanitizedDescription = String(
      editingExpense.description ?? "",
    ).trim();

    if (!sanitizedDescription) {
      toast.error(
        "Please enter what you spent the money on.",
      );

      return;
    }

    // -------------------------------------
    // FIND BUDGET FOR UPDATED MONTH
    // -------------------------------------

    const categoryBudget =
      budgets.find(
        (budget) =>
          (budget.currency || "NGN") ===
            defaultCurrency &&
          budget.category === category &&
          (budget.month || currentMonth) ===
            updatedMonth,
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
    // CALCULATE SPENDING EXCLUDING
    // CURRENT EXPENSE
    // -------------------------------------

    const spentBeforeThisExpense =
      transactions
        .filter((transaction) => {
          const transactionMonth =
            transaction.month ||
            getMonthFromDate(
              transaction.date,
            );

          return (
            transaction.type === "Expense" &&
            transaction.id !==
              editingExpense.id &&
            (transaction.currency ||
              "NGN") === defaultCurrency &&
            transaction.category ===
              category &&
            transactionMonth ===
              updatedMonth
          );
        })
        .reduce(
          (total, transaction) =>
            total +
            Number(transaction.amount || 0),
          0,
        );

    // -------------------------------------
    // CHECK REMAINING BUDGET
    // -------------------------------------

    const remainingBudget =
      Number(categoryBudget.amount || 0) -
      spentBeforeThisExpense;

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
      await updateTransaction(
        editingExpense.id,
        {
          amount,
          category,
          date: updatedDate,
          month: updatedMonth,
          description: sanitizedDescription,
        },
      );

      toast.success(
        "Expense updated successfully!",
      );

      setEditingExpense(null);
    } catch (error) {
      console.error(
        "Update expense error:",
        error,
      );

      toast.error(
        "Failed to update expense. Please try again.",
      );
    }
  };

  // -------------------------------------
  // RENDER
  // -------------------------------------

  return (
    <section className="space-y-6">
      {/* HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Expenses
        </h1>

        <p className="text-gray-500">
          Track and categorize your spending.
        </p>
      </div>

      {/* CURRENT BUDGET PERIOD */}

      <div className="rounded-lg bg-indigo-50 p-4">
        <p className="text-sm text-indigo-600">
          Current Budget Period
        </p>

        <p className="mt-1 text-lg font-semibold text-indigo-900">
          {currentMonthLabel}
        </p>
      </div>

      {/* TOTAL EXPENSES */}

      <div className="rounded-xl bg-white p-6 shadow-md">
        <p className="text-sm text-slate-500">
          Total Expenses for{" "}
          {currentMonthLabel}
        </p>

        <h2 className="mt-2 text-3xl font-bold text-red-600">
          {currencySymbol}
          {totalExpenses.toLocaleString()}
        </h2>
      </div>

      {/* FILTERS */}

      <div className="flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search by category..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="flex-1 rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
        />

        <select
          value={selectedCategory}
          onChange={(e) =>
            setSelectedCategory(
              e.target.value,
            )
          }
          className="rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
        >
          <option value="All">
            All
          </option>

          {budgetedCategories.map(
            (category) => (
              <option
                key={category}
                value={category}
              >
                {category}
              </option>
            ),
          )}
        </select>

        <select
          value={sortBy}
          onChange={(e) =>
            setSortBy(e.target.value)
          }
          className="rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
        >
          <option value="Newest">
            Newest
          </option>

          <option value="Oldest">
            Oldest
          </option>

          <option value="Highest Amount">
            Highest Amount
          </option>

          <option value="Lowest Amount">
            Lowest Amount
          </option>
        </select>
      </div>

      {/* EXPENSE LIST */}

      <div className="space-y-4">
        {sortedExpenses.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-slate-500">
              No expenses for{" "}
              {currentMonthLabel}.
            </p>
          </div>
        ) : (
          sortedExpenses.map(
            (expense) => {
              const expenseCurrency =
                currencyMap[
                  expense.currency
                ] || "₦";

              return (
                <div
                  key={expense.id}
                  className="flex flex-col gap-4 rounded-xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {expense.description || expense.category}
                    </h3>

                    <p className="text-sm text-slate-500">
                      {expense.description
                        ? `${expense.category} • ${expense.date}`
                        : expense.date}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">
                      {expenseCurrency}
                      {Number(
                        expense.amount || 0,
                      ).toLocaleString()}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setEditingExpense({
                          ...expense,
                        })
                      }
                      className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteExpense(
                          expense.id,
                        )
                      }
                      className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            },
          )
        )}
      </div>

      {/* EDIT MODAL */}

      <Modal
        isOpen={
          editingExpense !== null
        }
        onClose={() =>
          setEditingExpense(null)
        }
        title="Edit Expense"
      >
        <ExpenseForm
          expenseInput={
            editingExpense?.amount || ""
          }
          setExpenseInput={(value) =>
            handleEditChange(
              "amount",
              value,
            )
          }
          expenseCategory={
            editingExpense?.category ||
            ""
          }
          setExpenseCategory={(value) =>
            handleEditChange(
              "category",
              value,
            )
          }
          expenseDate={
            editingExpense?.date || ""
          }
          setExpenseDate={(value) =>
            handleEditChange(
              "date",
              value,
            )
          }
          expenseDescription={
            editingExpense?.description || ""
          }
          setExpenseDescription={(value) =>
            handleEditChange(
              "description",
              value,
            )
          }
          categoryOptions={
            budgetedCategories
          }
          currencySymbol={currencySymbol}
          selectedCategoryRemaining={
            editingExpense
              ? getCategoryRemaining(
                  editingExpense.category,
                  getMonthFromDate(
                    editingExpense.date,
                  ),
                  editingExpense.id,
                ) +
                  Number(
                    editingExpense.amount ||
                      0,
                  )
              : 0
          }
          noBudgetMessage={`You don't have any budgeted categories for ${currentMonthLabel}. Create a budget first before adding an expense.`}
          onSubmit={
            handleUpdateExpense
          }
          buttonText="Update Expense"
        />
      </Modal>
    </section>
  );
};

export default Expenses;