import { useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import AddSavingsModal from "../components/AddSavingsModal";
import GoalFormModal from "../components/GoalFormModal";
import SavingsHistory from "../components/SavingsHistory";
import { useFinance } from "../context/FinanceContext";

function GoalDetails() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { goals, defaultCurrency, updateGoal, deleteGoal, addSavingToGoal, deleteSavingFromGoal } = useFinance();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isSavingOpen, setIsSavingOpen] = useState(false);
  const goal = goals.find((item) => String(item.id) === String(goalId));

  if (!goal) return <Navigate to="/goals" replace />;

  const target = Number(goal.targetAmount || 0);
  const saved = Number(goal.currentAmount || 0);
  const remaining = Math.max(target - saved, 0);
  const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const currency = goal.currency || defaultCurrency;

  const handleEdit = (values) => {
    if (Number(values.targetAmount) < saved) {
      toast.error("Target amount cannot be lower than the amount already saved.");
      return;
    }
    updateGoal(goal.id, values);
    setIsEditOpen(false);
    toast.success("Goal updated successfully!");
  };

  const handleAddSaving = (saving) => {
    try {
      addSavingToGoal(goal.id, saving);
      setIsSavingOpen(false);
      toast.success("Saving added successfully!");
    } catch (error) {
      toast.error(error.message || "Unable to add this saving.");
    }
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this goal? This action cannot be undone.")) return;
    deleteGoal(goal.id);
    toast.success("Goal deleted successfully!");
    navigate("/goals");
  };

  const handleDeleteSaving = (savingId) => {
    deleteSavingFromGoal(goal.id, savingId);
    toast.success("Saving deleted successfully!");
  };

  return (
    <section className="mx-auto max-w-5xl pb-16">
      <Link to="/goals" className="inline-flex min-h-11 items-center gap-2 font-semibold text-indigo-600 hover:text-indigo-700">
        <ArrowLeft size={18} aria-hidden="true" /> Back to Goals
      </Link>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-3xl font-bold">{goal.name}</h1>
            <p className="mt-2 text-sm text-slate-500">{goal.type}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setIsSavingOpen(true)} disabled={remaining <= 0} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
              <Plus size={18} aria-hidden="true" /> Add Saving
            </button>
            <button type="button" onClick={() => setIsEditOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
              <Pencil size={17} aria-hidden="true" /> Edit Goal
            </button>
            <button type="button" onClick={handleDelete} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 font-semibold text-white transition hover:bg-red-700">
              <Trash2 size={17} aria-hidden="true" /> Delete Goal
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Target", target], ["Saved", saved], ["Remaining", remaining], ["Progress", `${progress.toFixed(0)}%`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-1 text-xl font-bold">{typeof value === "number" ? `${currency}${value.toLocaleString()}` : value}</p>
            </div>
          ))}
        </div>

        <div className="mt-7">
          <div className="flex justify-between text-sm"><span className="text-slate-500">Progress</span><span className="font-semibold">{progress.toFixed(0)}%</span></div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className={`h-full rounded-full ${progress >= 100 ? "bg-green-500" : "bg-indigo-600"}`} style={{ width: `${progress}%` }} /></div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <SavingsHistory goal={goal} onDeleteSaving={(_goalId, savingId) => handleDeleteSaving(savingId)} />
      </div>

      <GoalFormModal isOpen={isEditOpen} goal={goal} defaultCurrency={defaultCurrency} onClose={() => setIsEditOpen(false)} onSubmit={handleEdit} />
      {isSavingOpen && <AddSavingsModal goal={goal} onClose={() => setIsSavingOpen(false)} onSave={handleAddSaving} />}
    </section>
  );
}

export default GoalDetails;
