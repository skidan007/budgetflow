import { useState } from "react";
import SummaryCard from "../components/SummaryCard";
import { Wallet, TrendingUp, Receipt, PiggyBank } from "lucide-react";

const Dashboard = () => {
  const [balance, setBalance] = useState(0);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  const [incomeInput, setIncomeInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");

  const handleAddIncome = () => {
    if (!incomeInput) return;

    const amount = Number(incomeInput);

    setIncome((prev) => prev + amount);
    setBalance((prev) => prev + amount);

    setIncomeInput("");
  };

  const handleAddExpense = () => {
    if (!expenseInput) return;

    const amount = Number(expenseInput);

    setExpenses((prev) => prev + amount);
    setBalance((prev) => prev - amount);

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

      <div className="rounded-xl bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold">Add Income</h2>

        <div className="flex gap-4">
          <input
            type="number"
            value={incomeInput}
            onChange={(e) => setIncomeInput(e.target.value)}
            placeholder="Enter amount"
            className="flex-1 rounded-lg border p-3"
          />

          <button
            onClick={handleAddIncome}
            className="rounded-lg bg-blue-600 px-6 text-white"
          >
            Add Income
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow mt-6">
        <h2 className="mb-4 text-xl font-semibold">Add Expense</h2>

        <div className="flex gap-4">
          <input
            type="number"
            value={expenseInput}
            onChange={(e) => setExpenseInput(e.target.value)}
            placeholder="Enter expense"
            className="flex-1 rounded-lg border p-3"
          />

          <button
            onClick={handleAddExpense}
            className="rounded-lg bg-red-600 px-6 text-white"
          >
            Add Expense
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
