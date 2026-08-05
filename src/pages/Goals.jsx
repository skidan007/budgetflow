import { useState } from "react";
import GoalForm from "../components/GoalForm";
import GoalCard from "../components/GoalCard";
import { useFinance } from "../context/FinanceContext";
import toast from "react-hot-toast";

const Goals = () => {
  const [goalTitle, setGoalTitle] = useState("");
  const [goalIcon, setGoalIcon] = useState("🎯");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalDate, setGoalDate] = useState("");

  const { goals, setGoals } = useFinance();

  const [selectedGoal, setSelectedGoal] = useState(null);
  const [savingAmount, setSavingAmount] = useState("");
  const [showSavingsModal, setShowSavingsModal] = useState(false);

  const [editingGoal, setEditingGoal] = useState(null);
  const isEditing = Boolean(editingGoal);

  const handleAddGoal = () => {
    const target = Number(goalTarget);

    if (!goalTitle.trim()) {
      toast.error("Enter a goal name");
      return;
    }

    if (!target || target <= 0) {
      toast.error("Enter a valid target amount");
      return;
    }

    if (editingGoal) {
      setGoals((prev) =>
        prev.map((goal) =>
          goal.id === editingGoal.id
            ? {
                ...goal,
                title: goalTitle,
                icon: goalIcon,
                target,
                targetDate: goalDate,
              }
            : goal,
        ),
      );

      toast.success("Goal updated successfully!");
    } else {
      setGoals((prev) => [
        {
          id: Date.now(),
          title: goalTitle,
          icon: goalIcon,
          target,
          saved: 0,
          targetDate: goalDate,
        },
        ...prev,
      ]);

      toast.success("Goal created successfully!");
    }

    setGoalTitle("");
    setGoalIcon("🎯");
    setGoalTarget("");
    setGoalDate("");

    setEditingGoal(null);
  };

  const openSavingsModal = (goal) => {
    setSelectedGoal(goal);
    setSavingAmount("");
    setShowSavingsModal(true);
  };

  const handleSaveSavings = () => {
    const amount = Number(savingAmount);

    if (!amount || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === selectedGoal.id
          ? {
              ...goal,
              saved: goal.saved + amount,
            }
          : goal,
      ),
    );

    toast.success("Savings added successfully!");

    setShowSavingsModal(false);
    setSelectedGoal(null);
    setSavingAmount("");
  };

  const handleEditGoal = (goal) => {
    setGoalTitle(goal.title);
    setGoalIcon(goal.icon);
    setGoalTarget(goal.target);
    setGoalDate(goal.targetDate);

    setEditingGoal(goal);
  };

  const handleCancelEdit = () => {
    setGoalTitle("");
    setGoalIcon("🎯");
    setGoalTarget("");
    setGoalDate("");

    setEditingGoal(null);

    toast("Edit cancelled");
  };

  return (
    <section>
      <h1 className="text-2xl font-semibold">Goals</h1>
      <GoalForm
        goalTitle={goalTitle}
        setGoalTitle={setGoalTitle}
        goalIcon={goalIcon}
        setGoalIcon={setGoalIcon}
        goalTarget={goalTarget}
        setGoalTarget={setGoalTarget}
        goalDate={goalDate}
        setGoalDate={setGoalDate}
        onSubmit={handleAddGoal}
        buttonText={isEditing ? "Update Goal" : "Save Goal"}
        formTitle={isEditing ? "Edit Goal" : "Set a New Goal"}
        isEditing={isEditing}
        onCancel={handleCancelEdit}
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {goals.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500 md:col-span-2 lg:col-span-3">
            No goals yet. Create your first financial goal.
          </p>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onAddSavings={openSavingsModal}
              onEdit={handleEditGoal}
              onDelete={() => {}}
            />
          ))
        )}
      </div>

      {showSavingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-2xl font-bold">Add Savings</h2>

            <p className="mb-2">
              Goal:
              <strong> {selectedGoal?.title}</strong>
            </p>

            <p className="mb-4 text-slate-500">
              Current Saved: ₦{selectedGoal?.saved.toLocaleString()}
            </p>

            <input
              type="number"
              placeholder="Enter amount"
              value={savingAmount}
              onChange={(e) => setSavingAmount(e.target.value)}
              className="w-full rounded-lg border p-3"
            />

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowSavingsModal(false)}
                className="rounded-lg bg-slate-300 px-5 py-2"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveSavings}
                className="rounded-lg bg-green-600 px-5 py-2 text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Goals;
