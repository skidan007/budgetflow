import { useState } from "react";
import toast from "react-hot-toast";

import GoalCard from "../components/GoalCard";
import AddSavingsModal from "../components/AddSavingsModal";
import { useFinance } from "../context/FinanceContext";

let nextGoalId = 1;

function generateId() {
  nextGoalId += 1;
  return nextGoalId;
}

function Goals() {
  const { goals, setGoals } = useFinance();

  const [goalName, setGoalName] = useState("");
  const [goalType, setGoalType] = useState("🎯 Goal");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [goalCurrency, setGoalCurrency] = useState("NGN");

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  // -----------------------------
  // RESET FORM
  // -----------------------------

  const resetForm = () => {
    setGoalName("");
    setGoalType("🎯 Goal");
    setTargetAmount("");
    setTargetDate("");
    setGoalCurrency("NGN");
    setEditingGoalId(null);
  };
  // -----------------------------
  // SAVE / UPDATE GOAL
  // -----------------------------

  const handleSaveGoal = (e) => {
    e.preventDefault();

    const amount = Number(targetAmount);

    console.log("SAVE/UPDATE CLICKED");
    console.log("Editing Goal ID:", editingGoalId);
    console.log("New Amount:", amount);

    // VALIDATION
    if (!goalName.trim()) {
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

    // =========================
    // UPDATE EXISTING GOAL
    // =========================
    if (editingGoalId !== null) {
      setGoals((prevGoals) => {
        const updatedGoals = prevGoals.map((goal) => {
          if (String(goal.id) !== String(editingGoalId)) {
            return goal;
          }

          return {
            ...goal,
            name: goalName.trim(),
            type: goalType,
            targetAmount: amount,
            targetDate: targetDate,
            currency: goalCurrency,
          };
        });

        return updatedGoals;
      });

      toast.success("Goal updated successfully!");

      resetForm();

      return;
    }

    // =========================
    // CREATE NEW GOAL
    // =========================
    const newGoal = {
      id: `goal-${Date.now()}`,
      name: goalName.trim(),
      type: goalType,
      targetAmount: amount,
      currentAmount: 0,
      targetDate,
      currency: goalCurrency,
      savingsHistory: [],
    };

    setGoals((prevGoals) => [...prevGoals, newGoal]);

    toast.success("Goal created successfully!");

    resetForm();
  };
  // CREATE

  // -----------------------------
  // EDIT GOAL
  // -----------------------------

  const handleEditGoal = (goal) => {
    const targetAmount = Number(goal?.targetAmount) || 0;
    const currentAmount = Number(goal?.currentAmount) || 0;

    if (currentAmount >= targetAmount && targetAmount > 0) {
      toast.error("This goal has already been completed.");
      return;
    }

    setEditingGoalId(goal.id);
    setGoalCurrency(goal.currency || "NGN");

    setGoalName(goal.name || "");
    setGoalType(goal.type || "🎯 Goal");
    setTargetAmount(String(goal.targetAmount ?? ""));
    setTargetDate(goal.targetDate || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };
  // -----------------------------
  // DELETE GOAL
  // -----------------------------

  const handleDeleteGoal = (goalId) => {
    // Prevent another delete confirmation from opening
    if (pendingDeleteId !== null) {
      toast.error("Please confirm or cancel the current delete first.");
      return;
    }

    setPendingDeleteId(goalId);

    toast.custom(
      (t) => (
        <div className="w-[320px] rounded-xl bg-white p-5 shadow-xl">
          <h3 className="text-base font-semibold text-slate-900">
            Delete this goal?
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            This action cannot be undone.
          </p>

          <div className="mt-4 flex gap-2">
            {/* CANCEL */}
            <button
              type="button"
              onClick={() => {
                setPendingDeleteId(null);
                toast.dismiss(t.id);
              }}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>

            {/* DELETE */}
            <button
              type="button"
              onClick={() => {
                setGoals((prevGoals) =>
                  prevGoals.filter((goal) => goal.id !== goalId),
                );

                setPendingDeleteId(null);

                toast.dismiss(t.id);

                toast.success("Goal deleted successfully!");
              }}
              className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: Infinity,
        position: "top-right",
      },
    );
  };

  // -----------------------------
  // OPEN SAVINGS MODAL
  // -----------------------------

  const handleOpenSavings = (goal) => {
    const targetAmount = Number(goal?.targetAmount) || 0;
    const currentAmount = Number(goal?.currentAmount) || 0;

    if (currentAmount >= targetAmount && targetAmount > 0) {
      toast.error("This goal has already been completed.");
      return;
    }

    setSelectedGoal(goal);
  };

  const handleDeleteSaving = (goalId, savingId) => {
    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        if (goal.id !== goalId) {
          return goal;
        }

        const savingsHistory = Array.isArray(goal.savingsHistory)
          ? goal.savingsHistory
          : [];

        const savingToDelete = savingsHistory.find(
          (saving) => String(saving.id) === String(savingId),
        );

        if (!savingToDelete) {
          return goal;
        }

        const savingAmount = Number(savingToDelete.amount) || 0;

        const updatedSavingsHistory = savingsHistory.filter(
          (saving) => String(saving.id) !== String(savingId),
        );

        return {
          ...goal,
          currentAmount: Math.max(
            Number(goal.currentAmount || 0) - savingAmount,
            0,
          ),
          savingsHistory: updatedSavingsHistory,
        };
      }),
    );

    toast.success("Savings deleted successfully!");
  };

  // -----------------------------
  // CLOSE SAVINGS MODAL
  // -----------------------------

  const handleCloseSavings = () => {
    setSelectedGoal(null);
  };

  // -----------------------------
  // ADD SAVINGS
  // -----------------------------

  const handleAddSavings = (amount) => {
    if (!selectedGoal) {
      return;
    }

    const targetAmount = Number(selectedGoal.targetAmount) || 0;
    const currentAmount = Number(selectedGoal.currentAmount) || 0;

    if (currentAmount >= targetAmount && targetAmount > 0) {
      toast.error("This goal has already been completed.");
      setSelectedGoal(null);
      return;
    }

    const savingsAmount = Number(amount);

    if (!savingsAmount || savingsAmount <= 0) {
      return;
    }

    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        if (goal.id !== selectedGoal.id) {
          return goal;
        }

        const savingsHistory = goal.savingsHistory || [];

        const newSaving = {
          id: generateId(),
          amount: savingsAmount,
          date: new Date().toISOString().split("T")[0],
        };

        return {
          ...goal,

          currentAmount: Number(goal.currentAmount || 0) + savingsAmount,

          savingsHistory: [...savingsHistory, newSaving],
        };
      }),
    );

    setSelectedGoal(null);
  };

  return (
    <section className="space-y-6">
      {/* PAGE HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Goals</h1>

        <p className="mt-1 text-sm text-slate-500">
          Set savings goals and track your progress.
        </p>
      </div>

      {/* GOAL FORM */}

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold text-slate-900">
          {editingGoalId !== null ? "Edit Goal" : "Set a New Goal"}
        </h2>

        <form onSubmit={handleSaveGoal} className="mt-5 space-y-5">
          {/* GOAL NAME */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Goal Name
            </label>

            <input
              type="text"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              placeholder="Emergency Fund"
              className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-indigo-500"
            />
          </div>

          {/* GOAL TYPE */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Goal Type
            </label>

            <select
              value={goalType}
              onChange={(e) => setGoalType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
            >
              <option value="🎯 Goal">🎯 Goal</option>

              <option value="🏠 House">🏠 House</option>

              <option value="🚗 Car">🚗 Car</option>

              <option value="💍 Wedding">💍 Wedding</option>

              <option value="✈️ Travel">✈️ Travel</option>

              <option value="🎓 Education">🎓 Education</option>

              <option value="💰 Emergency Fund">💰 Emergency Fund</option>

              <option value="💼 Business">💼 Business</option>
            </select>

            {/* CURRENCY */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Currency
              </label>

              <select
                value={goalCurrency}
                onChange={(e) => setGoalCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
              >
                <option value="NGN">₦ Nigerian Naira</option>
                <option value="USD">$ US Dollar</option>
                <option value="GBP">£ British Pound</option>
                <option value="EUR">€ Euro</option>
                <option value="JPY">¥ Japanese Yen</option>
                <option value="CNY">¥ Chinese Yuan</option>
                <option value="CAD">C$ Canadian Dollar</option>
                <option value="AUD">A$ Australian Dollar</option>
                <option value="CHF">CHF Swiss Franc</option>
              </select>
            </div>
          </div>

          {/* TARGET AMOUNT */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Target Amount
            </label>

            <div className="flex">
              <span className="flex items-center rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 px-4 text-slate-600">
                {goalCurrency}
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

          {/* TARGET DATE */}

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

          {/* BUTTONS */}

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              {editingGoalId !== null ? "Update Goal" : "Save Goal"}
            </button>

            {editingGoalId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* GOALS LIST */}

      {goals.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-md">
          <div className="text-4xl">🎯</div>

          <h2 className="mt-3 text-xl font-semibold text-slate-900">
            No goals yet
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Create your first savings goal above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onDelete={handleDeleteGoal}
              onOpen={handleEditGoal}
              onAddSavings={handleOpenSavings}
              onDeleteSaving={handleDeleteSaving}
            />
          ))}
        </div>
      )}

      {/* ADD SAVINGS MODAL */}

      {selectedGoal && (
        <AddSavingsModal
          goal={selectedGoal}
          onClose={handleCloseSavings}
          onSave={handleAddSavings}
        />
      )}
    </section>
  );
}

export default Goals;
