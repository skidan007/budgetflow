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

const Expenses = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [editingExpense, setEditingExpense] = useState(null);

  const {
    transactions,
    setTransactions,
    defaultCurrency,
  } = useFinance();

  // Only expenses belonging to the current/default currency
  const expenses = transactions.filter(
    (transaction) =>
      transaction.type === "Expense" &&
      (transaction.currency || "NGN") === defaultCurrency,
  );

  const currencySymbol =
    currencyMap[defaultCurrency] || "₦";

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch = expense.category
      ?.toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      expense.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

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

  // Total only for the selected/default currency
  const totalExpenses = expenses.reduce(
    (total, expense) =>
      total + (Number(expense.amount) || 0),
    0,
  );

  const handleDeleteExpense = (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this expense?",
      )
    ) {
      return;
    }

    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== id),
    );

    toast.success("Expense deleted successfully!");
  };

  const handleEditChange = (field, value) => {
    setEditingExpense((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;

    const amount = Number(editingExpense.amount);

    if (!amount || amount <= 0 || Number.isNaN(amount)) {
      toast.error("Enter a valid amount");
      return;
    }

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === editingExpense.id
          ? {
              ...editingExpense,
              amount,
            }
          : transaction,
      ),
    );

    toast.success("Expense updated successfully!");

    setEditingExpense(null);
  };

  return (
    <section>
      <h1 className="text-3xl font-bold text-slate-900">
        Expenses
      </h1>

      <p className="text-gray-500">
        Track and categorize your spending.
      </p>

      {/* TOTAL EXPENSES */}
      <div className="mt-6 mb-6 rounded-xl bg-white p-6 shadow-md">
        <p className="text-sm text-slate-500">
          Total Expenses
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
          onChange={(e) =>
            setSelectedCategory(e.target.value)
          }
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
            No expenses yet.
          </p>
        ) : (
          sortedExpenses.map((expense) => {
            const expenseCurrency =
              currencyMap[expense.currency] || "₦";

            return (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-xl border p-4 shadow-sm"
              >
                <div>
                  <h3 className="font-semibold">
                    {expense.category}
                  </h3>

                  <p className="text-sm text-slate-500">
                    {expense.date}
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
                    className="rounded bg-blue-500 px-3 py-1 text-sm text-white transition hover:bg-blue-600"
                  >
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDeleteExpense(expense.id)
                    }
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
          expenseInput={editingExpense?.amount || ""}
          setExpenseInput={(value) =>
            handleEditChange("amount", value)
          }
          expenseCategory={
            editingExpense?.category || "Food"
          }
          setExpenseCategory={(value) =>
            handleEditChange("category", value)
          }
          expenseDate={editingExpense?.date || ""}
          setExpenseDate={(value) =>
            handleEditChange("date", value)
          }
          onSubmit={handleUpdateExpense}
          buttonText="Update Expense"
        />
      </Modal>
    </section>
  );
};

export default Expenses;