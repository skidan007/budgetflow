import { useFinance } from "../context/FinanceContext";
import GoalCard from "../components/GoalCard";

function Goals() {
  const { goals } = useFinance();

  return (
    <div className="rounded-xl bg-white p-6 shadow-md">
      <h1 className="text-3xl font-bold text-slate-900">
        Goals Test
      </h1>

      <p className="mt-3 text-slate-500">
        Goals in context: {goals.length}
      </p>

      <div className="mt-6">
        <GoalCard
          goal={{
            id: 1,
            name: "Test Goal",
            type: "🎯 Goal",
            targetAmount: 100000,
            currentAmount: 25000,
            targetDate: "2026-12-31",
            currency: "₦",
            savingsHistory: [],
          }}
          onDelete={() => {}}
          onOpen={() => {}}
          onAddSavings={() => {}}
        />
      </div>
    </div>
  );
}

export default Goals;