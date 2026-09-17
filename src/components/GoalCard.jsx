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
  const goalTypeLabel = goal?.type === "AI Plan" ? "Smart Plan" : goal?.type || "Goal";

  return (
    <button
      type="button"
      onClick={() => navigate(`/goals/${goal.id}`)}
      className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-2xl" aria-hidden="true">{icon}</span>
        <ArrowRight size={19} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-600" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-lg font-bold tracking-tight text-slate-900">{goal?.name || "Goal"}</h2>
      <p className="mt-1 text-sm text-slate-500">{goalTypeLabel}</p>
      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-sm">
        <div>
          <p className="text-slate-500">Saved</p>
          <p className="mt-1 font-bold text-slate-900">{currency}{saved.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500">Target</p>
          <p className="mt-1 font-bold text-slate-900">{currency}{target.toLocaleString()}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-between text-sm">
        <span className="text-slate-500">Remaining {currency}{remaining.toLocaleString()}</span>
        <span className="font-semibold text-emerald-600">{progress.toFixed(0)}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${progress >= 100 ? "bg-emerald-500" : "bg-emerald-600"}`} style={{ width: `${progress}%` }} />
      </div>
    </button>
  );
}

export default GoalCard;
