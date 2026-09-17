import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { ArrowRight, Target, Sparkles } from "lucide-react";

import GoalCard from "../components/GoalCard";
import GoalFormModal from "../components/GoalFormModal";
import { useFinance } from "../context/FinanceContext";

function Goals() {
  const { goals, defaultCurrency, addGoal, setGoals } = useFinance();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const currencyGoals = goals.filter(
    (goal) => (goal.currency || "NGN") === defaultCurrency,
  );

  const handleSaveGoal = async (goalValues) => {
    const newGoal = {
      id: `goal-${Date.now()}`,
      ...goalValues,
      currentAmount: 0,
      savingsHistory: [],
    };

    try {
    
      await addGoal(goalValues);
    } catch {
      setGoals((previous) => [...previous, newGoal]);
    }

    toast.success("Goal created successfully!");
    setIsFormOpen(false);
  };

  return (
    <section className="relative mx-auto max-w-6xl pb-24">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-600">Build toward what matters</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Goals</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-500">Turn good intentions into visible progress, one contribution at a time.</p>
        </div>
        <button type="button" onClick={() => setIsFormOpen(true)} className="hidden min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:inline-flex">
          <Plus size={18} aria-hidden="true" /> Add goal
        </button>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-300"><Target size={18} /><p className="text-sm font-semibold">Your savings journey</p></div>
            <p className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">{currencyGoals.length}</p>
            <p className="mt-1 text-sm text-slate-400">active {defaultCurrency} goal{currencyGoals.length === 1 ? "" : "s"}</p>
          </div>
          <div className="max-w-xs rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <Sparkles className="mb-3 text-emerald-300" size={20} />
            Keep your next milestone visible. Small, consistent deposits compound into meaningful progress.
          </div>
        </div>
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-emerald-500/15 blur-2xl" />
      </section>

      <div className="mt-6">
        {currencyGoals.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
            No goals in {defaultCurrency} yet. Add one to start tracking your
            savings.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {currencyGoals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setIsFormOpen(true)}
        aria-label="Add goal"
        className="fixed bottom-6 right-6 grid size-14 place-items-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 md:hidden"
      >
        <Plus size={26} aria-hidden="true" />
      </button>

      <GoalFormModal
        isOpen={isFormOpen}
        defaultCurrency={defaultCurrency}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSaveGoal}
      />
    </section>
  );
}

export default Goals;
