import { useState } from "react";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";
import { ArrowRight } from "lucide-react";

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
      // Existing goals are locally persisted. Use the Supabase helper when a
      // logged-in session is available, and retain the established local flow
      // for offline/local goals and AI Planner compatibility.
      await addGoal(goalValues);
    } catch {
      setGoals((previous) => [...previous, newGoal]);
    }

    toast.success("Goal created successfully!");
    setIsFormOpen(false);
  };

  return (
    <section className="relative mx-auto max-w-5xl pb-24">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Goals</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set savings goals and track your progress.
        </p>
      </header>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-6 shadow-sm dark:border-indigo-800/50 dark:bg-indigo-950/30 sm:p-8">
        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-200">
          Total Goals
        </p>
        <p className="mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100 sm:text-5xl">
          {currencyGoals.length}
        </p>

        <div className="mt-8 flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
          {/* <h2 className="text-xl font-bold">Add Goal</h2> */}
          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            aria-label="Add goal"
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
            // className="grid size-11 place-items-center rounded-lg bg-indigo-600 text-white transition hover:bg-indigo-700"
          >
            Add Goal <ArrowRight size={18} aria-hidden="true" />
            {/* <Plus size={22} aria-hidden="true" /> */}
          </button>
        </div>
      </section>

      <div className="mt-6">
        {currencyGoals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/30">
            No goals in {defaultCurrency} yet. Add one to start tracking your
            savings.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        className="fixed bottom-6 right-6 grid size-14 place-items-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 md:absolute md:right-0 md:top-44"
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
