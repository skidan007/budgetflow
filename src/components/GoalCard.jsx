import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

function GoalCard({ goal }) {
  const navigate = useNavigate();
  const target = Number(goal?.targetAmount || 0);
  const saved = Number(goal?.currentAmount || 0);
  const remaining = Math.max(target - saved, 0);
  const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const currency = goal?.currency || "NGN";
  const icon = String(goal?.type || "").match(/^\S+/)?.[0] || "🎯";

  return (
    <button
      type="button"
      onClick={() => navigate(`/goals/${goal.id}`)}
      className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="text-2xl" aria-hidden="true">{icon}</span>
        <ArrowRight size={19} className="text-slate-400" aria-hidden="true" />
      </div>
      <h2 className="mt-3 text-lg font-semibold">{goal?.name || "Goal"}</h2>
      <p className="mt-1 text-sm text-slate-500">{goal?.type || "Goal"}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-sm dark:border-slate-800">
        <div>
          <p className="text-slate-500">Saved</p>
          <p className="mt-1 font-bold">{currency}{saved.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Target</p>
          <p className="mt-1 font-bold">{currency}{target.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-slate-500">Remaining {currency}{remaining.toLocaleString()}</span>
        <span className="font-semibold text-indigo-600">{progress.toFixed(0)}%</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${progress >= 100 ? "bg-green-500" : "bg-indigo-600"}`} style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}

export default GoalCard;
