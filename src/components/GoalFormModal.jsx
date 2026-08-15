import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import Modal from "./Modal";

const goalTypes = [
  "🎯 Goal",
  "🏠 House",
  "🚗 Car",
  "💍 Wedding",
  "✈️ Travel",
  "🎓 Education",
  "💰 Emergency Fund",
  "💼 Business",
];

const currencyOptions = [
  { value: "NGN", label: "₦ Nigerian Naira" },
  { value: "USD", label: "$ US Dollar" },
  { value: "GBP", label: "£ British Pound" },
  { value: "EUR", label: "€ Euro" },
  { value: "JPY", label: "¥ Japanese Yen" },
  { value: "CNY", label: "¥ Chinese Yuan" },
  { value: "CAD", label: "C$ Canadian Dollar" },
  { value: "AUD", label: "A$ Australian Dollar" },
  { value: "CHF", label: "CHF Swiss Franc" },
];

function GoalFormModal({ isOpen, goal, defaultCurrency, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("🎯 Goal");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency || "NGN");

  // Populate the form with the goal being edited (or reset for create).
  useEffect(() => {
    if (!isOpen) return;

    setName(goal?.name || "");
    setType(goal?.type || "🎯 Goal");
    setTargetAmount(goal ? String(goal.targetAmount ?? "") : "");
    setTargetDate(goal?.targetDate || "");
    setCurrency(goal?.currency || defaultCurrency || "NGN");
  }, [isOpen, goal, defaultCurrency]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const amount = Number(targetAmount);

    if (!name.trim()) {
      toast.error("Please enter a goal name.");
      return;
    }

    if (!amount || amount <= 0) {
      toast.error("Please enter a valid target amount.");
      return;
    }

    if (!targetDate) {
      toast.error("Please select a target date.");
      return;
    }

    onSubmit({
      name: name.trim(),
      type,
      targetAmount: amount,
      targetDate,
      currency,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? "Edit Goal" : "Set a New Goal"}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Goal Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Emergency Fund"
            className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Goal Type
          </label>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
          >
            {goalTypes.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Currency
          </label>

          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
          >
            {currencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Target Amount
          </label>

          <div className="flex">
            <span className="flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-4 text-slate-600">
              {currency}
            </span>

            <input
              type="number"
              min="0"
              step="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="500000"
              className="w-full rounded-r-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Target Date
          </label>

          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
        >
          {goal ? "Update Goal" : "Save Goal"}
        </button>
      </form>
    </Modal>
  );
}

export default GoalFormModal;
