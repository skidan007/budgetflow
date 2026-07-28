import TransactionItem from "../components/TransactionItem";
import { useState } from "react";
import SummaryCard from "../components/SummaryCard";
import { Wallet, TrendingUp, Receipt, PiggyBank } from "lucide-react";

function Dashboard() {
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  const [incomeInput, setIncomeInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");

  const [incomeCategory, setIncomeCategory] = useState("Salary");
  const [expenseCategory, setExpenseCategory] = useState("Food");

  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [editingTransaction, setEditingTransaction] = useState(null);

  const handleAddIncome = () => {
    if (!incomeInput) return;

    const amount = Number(incomeInput);

    setIncome((prev) => prev + amount);
    setBalance((prev) => prev + amount);

    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "Income",
        amount,
        category: incomeCategory,
      },
      ...prev,
    ]);

    setIncomeInput("");
  };

  const handleAddExpense = () => {
    if (!expenseInput) return;

    const amount = Number(expenseInput);

    setExpenses((prev) => prev + amount);
    setBalance((prev) => prev - amount);

    setTransactions((prev) => [
      {
        id: Date.now(),
        type: "Expense",
        amount,
        category: expenseCategory,
      },
      ...prev,
    ]);

    setExpenseInput("");
  };

  const summaryCardData = [
    {
      title: "Total Balance",
      amount: `₦${balance.toLocaleString()}`,
      icon: Wallet,
    },
    {
      title: "Income",
      amount: `₦${income.toLocaleString()}`,
      icon: TrendingUp,
    },
    {
      title: "Expenses",
      amount: `₦${expenses.toLocaleString()}`,
      icon: Receipt,
    },
    { title: "Savings", amount: "₦300,000", icon: PiggyBank },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesFilter = filter === "All" || transaction.type === filter;

    const matchesSearch = transaction.category
      .toLowerCase()
      .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleDelete = (id) => {
    const transactionToDelete = transactions.find(
      (transaction) => transaction.id === id,
    );

    if (!transactionToDelete) return;

    if (transactionToDelete.type === "Income") {
      setIncome((prev) => prev - transactionToDelete.amount);
      setBalance((prev) => prev - transactionToDelete.amount);
    } else {
      setExpenses((prev) => prev - transactionToDelete.amount);
      setBalance((prev) => prev + transactionToDelete.amount);
    }

    setTransactions((prev) =>
      prev.filter((transaction) => transaction.id !== id),
    );
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    if (transaction.type === "Income") {
      setIncomeCategory(transaction.category);
    } else {
      setExpenseCategory(transaction.category);
    }

    if (transaction.type === "Income") {
      setIncomeInput(transaction.amount.toString());
      setExpenseInput("");
    } else {
      setExpenseInput(transaction.amount.toString());
      setIncomeInput("");
    }
  };



  const handleUpdateTransaction = () => {
    if (!editingTransaction) return;

    const oldTransaction = transactions.find(
      (transaction) => transaction.id === editingTransaction.id,
    );

    if (!oldTransaction) return;

    const amount =
      editingTransaction.type === "Income"
        ? Number(incomeInput)
        : Number(expenseInput);

    const category =
      editingTransaction.type === "Income" ? incomeCategory : expenseCategory;

    if (oldTransaction.type === "Income") {
      setIncome((prev) => prev - oldTransaction.amount);
      setBalance((prev) => prev - oldTransaction.amount);
    } else {
      setExpenses((prev) => prev - oldTransaction.amount);
      setBalance((prev) => prev + oldTransaction.amount);
    }

    if (editingTransaction.type === "Income") {
      setIncome((prev) => prev + amount);
      setBalance((prev) => prev + amount);
    } else {
      setExpenses((prev) => prev + amount);
      setBalance((prev) => prev - amount);
    }

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
          />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Add Income */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Add Income</h2>

            <div className="flex flex-col gap-4 lg:flex-row">
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
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-semibold">Add Expense</h2>

            <div className="flex flex-col gap-4 lg:flex-row">
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                className="w-full rounded-lg border p-3"
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Entertainment</option>
                <option>Other</option>
              </select>
              <input
                type="number"
                value={expenseInput}
                onChange={(e) => setExpenseInput(e.target.value)}
                placeholder="Enter expense"
                className="flex-1 rounded-lg border p-3"
              />

              <button
                onClick={
                  editingTransaction?.type === "Expense"
                    ? handleUpdateTransaction
                    : handleAddExpense
                }
                className="rounded-lg bg-red-600 px-6 py-3 text-white lg:w-40 w-full"
              >
                {editingTransaction?.type === "Expense"
                  ? "Save Changes"
                  : "Add Expense"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="rounded-xl bg-white p-6 shadow">
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
              filteredTransactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
