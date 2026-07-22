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

  const handleAddIncome = () => {
    if (!incomeInput) return;

    const amount = Number(incomeInput);

    setIncome((prev) => prev + amount);
    setBalance((prev) => prev + amount);

    setTransactions((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "Income",
        amount,
        category: incomeCategory,
      },
    ]);

    setIncomeInput("");
  };

  const handleAddExpense = () => {
    if (!expenseInput) return;

    const amount = Number(expenseInput);

    setExpenses((prev) => prev + amount);
    setBalance((prev) => prev - amount);

    setTransactions((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "Expense",
        amount,
        category: expenseCategory,
      },
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
                onClick={handleAddIncome}
                className="rounded-lg bg-blue-600 px-6 py-3 text-white lg:w-40 w-full"
              >
                Add Income
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
                onClick={handleAddExpense}
                className="rounded-lg bg-red-600 px-6 py-3 text-white lg:w-40 w-full"
              >
                Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>

          <div className="space-y-3 max-h-125 overflow-y-auto pr-2">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-500">No transactions yet.</p>
            ) : (
              transactions.map((transaction) => (
                <TransactionItem
                  key={transaction.id}
                  transaction={transaction}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Recent Transactions</h2>

        <div className="space-y-3 max-h-125 overflow-y-auto">
          {transactions.length === 0 ? (
            <p className="text-center text-gray-500">No transactions yet.</p>
          ) : (
            transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </div>
      </div> */}
    </div>
  );
}

export default Dashboard;
