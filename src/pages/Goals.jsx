import { useState } from "react";
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

  const [editingGoalId, setEditingGoalId] = useState(null);
  const [selectedGoal, setSelectedGoal] = useState(null);

  const currency = "₦";

  // -----------------------------
  // RESET FORM
  // -----------------------------

  const resetForm = () => {
    setGoalName("");
    setGoalType("🎯 Goal");
    setTargetAmount("");
    setTargetDate("");
    setEditingGoalId(null);
  };

  // -----------------------------
  // SAVE / UPDATE GOAL
  // -----------------------------

  const handleSaveGoal = (e) => {
    e.preventDefault();

    const amount = Number(targetAmount);

    if (!goalName.trim()) {
      return;
    }

    if (!amount || amount <= 0) {
      return;
    }

    if (!targetDate) {
      return;
    }

    // UPDATE
    if (editingGoalId !== null) {
      setGoals((prevGoals) =>
        prevGoals.map((goal) =>
          goal.id === editingGoalId
            ? {
                ...goal,
                name: goalName.trim(),
                type: goalType,
                targetAmount: amount,
                targetDate,
              }
            : goal,
        ),
      );

      resetForm();
      return;
    }

    // CREATE
    const newGoal = {
      id: generateId(),
      name: goalName.trim(),
      type: goalType,
      targetAmount: amount,
      currentAmount: 0,
      targetDate,
      currency,
      savingsHistory: [],
    };

    setGoals((prevGoals) => [
      ...prevGoals,
      newGoal,
    ]);

    resetForm();
  };

  // -----------------------------
  // EDIT GOAL
  // -----------------------------

  const handleEditGoal = (goal) => {
    setEditingGoalId(goal.id);
    setGoalName(goal.name || "");
    setGoalType(goal.type || "🎯 Goal");
    setTargetAmount(goal.targetAmount || "");
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
    const confirmed = window.confirm(
      "Are you sure you want to delete this goal?",
    );

    if (!confirmed) {
      return;
    }

    setGoals((prevGoals) =>
      prevGoals.filter(
        (goal) => goal.id !== goalId,
      ),
    );

    if (editingGoalId === goalId) {
      resetForm();
    }

    if (selectedGoal?.id === goalId) {
      setSelectedGoal(null);
    }
  };

  // -----------------------------
  // OPEN SAVINGS MODAL
  // -----------------------------

  const handleOpenSavings = (goal) => {
    setSelectedGoal(goal);
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

    const savingsAmount = Number(amount);

    if (!savingsAmount || savingsAmount <= 0) {
      return;
    }

    setGoals((prevGoals) =>
      prevGoals.map((goal) => {
        if (goal.id !== selectedGoal.id) {
          return goal;
        }

        const savingsHistory =
          goal.savingsHistory || [];

        const newSaving = {
          id: generateId(),
          amount: savingsAmount,
          date: new Date()
            .toISOString()
            .split("T")[0],
        };

        return {
          ...goal,

          currentAmount:
            Number(goal.currentAmount || 0) +
            savingsAmount,

          savingsHistory: [
            ...savingsHistory,
            newSaving,
          ],
        };
      }),
    );

    setSelectedGoal(null);
  };

  return (
    <section className="space-y-6">
      {/* PAGE HEADER */}

      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Goals
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Set savings goals and track your progress.
        </p>
      </div>

      {/* GOAL FORM */}

      <div className="rounded-xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold text-slate-900">
          {editingGoalId !== null
            ? "Edit Goal"
            : "Set a New Goal"}
        </h2>

        <form
          onSubmit={handleSaveGoal}
          className="mt-5 space-y-5"
        >
          {/* GOAL NAME */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Goal Name
            </label>

            <input
              type="text"
              value={goalName}
              onChange={(e) =>
                setGoalName(e.target.value)
              }
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
              onChange={(e) =>
                setGoalType(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-indigo-500"
            >
              <option value="🎯 Goal">
                🎯 Goal
              </option>

              <option value="🏠 House">
                🏠 House
              </option>

              <option value="🚗 Car">
                🚗 Car
              </option>

              <option value="💍 Wedding">
                💍 Wedding
              </option>

              <option value="✈️ Travel">
                ✈️ Travel
              </option>

              <option value="🎓 Education">
                🎓 Education
              </option>

              <option value="💰 Emergency Fund">
                💰 Emergency Fund
              </option>

              <option value="💼 Business">
                💼 Business
              </option>
            </select>
          </div>

          {/* TARGET AMOUNT */}

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
                onChange={(e) =>
                  setTargetAmount(
                    e.target.value,
                  )
                }
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
              onChange={(e) =>
                setTargetDate(e.target.value)
              }
              className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-indigo-500"
            />
          </div>

          {/* BUTTONS */}

          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            >
              {editingGoalId !== null
                ? "Update Goal"
                : "Save Goal"}
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
          <div className="text-4xl">
            🎯
          </div>

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
              onAddSavings={
                handleOpenSavings
              }
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