import { useMemo, useState } from "react";
import { ArrowLeft, Pencil, Trash2, Wallet } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useFinance } from "../context/FinanceContext";
import { calculateDailyBudgetStatus } from "../utils/budgetCalculations";

const categoryIcons = { Food: "🍔", Transport: "🚗", Bills: "💡", Entertainment: "🎬", Shopping: "🛍️", Health: "🏥" };
const getTransactionMonth = (transaction) => transaction.month || transaction.date?.slice(0, 7) || "";

function BudgetDetails() {
  const navigate = useNavigate();
  const { budgetId } = useParams();
  const { budgets, budgetsLoading, transactions, updateBudget, deleteBudget, defaultCurrency, currencySymbol, currentMonth, getMonthLabel } = useFinance();
  const budget = budgets.find((item) => String(item.id) === String(budgetId));
  const [isEditing, setIsEditing] = useState(false);
  const [category, setCategory] = useState(budget?.category || "Food");
  const [budgetAmount, setBudgetAmount] = useState(String(budget?.amount || ""));

  const expenses = useMemo(() => {
    if (!budget) return [];
    const budgetMonth = budget.month || currentMonth;
    return transactions.filter((transaction) => transaction.type === "Expense" && transaction.category === budget.category && getTransactionMonth(transaction) === budgetMonth);
  }, [budget, currentMonth, transactions]);

  if (!budget && budgetsLoading) return <section className="mx-auto max-w-5xl"><p className="text-sm text-slate-500">Loading your budget...</p></section>;
  if (!budget) return <section className="mx-auto max-w-5xl"><button type="button" onClick={() => navigate("/budgets")} className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600"><ArrowLeft size={18} />Back to Budgets</button><div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center"><h1 className="text-xl font-bold">Budget not found</h1><p className="mt-2 text-slate-500">This budget may have been deleted.</p></div></section>;

  const budgetMonth = budget.month || currentMonth;
  const safeBudget = Number(budget.amount || 0);
  const spent = expenses.reduce((total, item) => total + Number(item.amount || 0), 0);
  const remaining = safeBudget - spent;
  const percentage = Math.min(safeBudget > 0 ? (spent / safeBudget) * 100 : spent > 0 ? 100 : 0, 100);
  const dailyPlan = calculateDailyBudgetStatus({ budgetAmount: safeBudget, spentAmount: spent, month: budgetMonth });
  const progressColor = percentage < 70 ? "bg-green-500" : percentage < 100 ? "bg-yellow-500" : "bg-red-500";
  const format = (value) => `${currencySymbol}${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const dates = expenses.reduce((groups, item) => {
    const date = item.date || "Unknown date";
    (groups[date] ||= []).push(item);
    return groups;
  }, {});
  const categoryOptions = ["Food", "Transport", "Bills", "Entertainment", "Shopping", "Health"];

  const saveEdit = async () => {
    const nextAmount = Number(budgetAmount);
    if (!nextAmount || nextAmount <= 0 || Number.isNaN(nextAmount)) return toast.error("Enter a valid budget amount");
    try {
      await updateBudget(budget.id, { category, amount: nextAmount, currency: defaultCurrency, month: budget.month });
      setIsEditing(false);
      toast.success("Budget updated successfully!");
    } catch (error) {
      console.error("Update budget error:", error);
      toast.error(error?.message || "Unable to update budget.");
    }
  };
  const handleDeleteBudget = async () => {
    if (!window.confirm("Are you sure you want to delete this budget?")) return;
    try {
      await deleteBudget(budget.id);
      toast.success("Budget deleted successfully!");
      navigate("/budgets");
    } catch (error) {
      console.error("Delete budget error:", error);
      toast.error(error?.message || "Unable to delete budget.");
    }
  };

  return <section className="mx-auto max-w-5xl space-y-6 pb-10"><button type="button" onClick={() => navigate("/budgets")} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50"><ArrowLeft size={18} />Back to Budgets</button><header className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-3xl">{categoryIcons[budget.category] || "💰"}</span><div><h1 className="text-3xl font-bold text-slate-900">{budget.category}</h1><p className="mt-1 text-sm text-slate-500">Budget for {getMonthLabel(budgetMonth)}</p></div></div><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setIsEditing(true)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"><Pencil size={17} />Edit Budget</button><button type="button" onClick={handleDeleteBudget} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white"><Trash2 size={17} />Delete Budget</button></div></header>{isEditing && <section className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 sm:p-5"><h2 className="font-semibold text-indigo-950">Edit Budget</h2><div className="mt-4 grid gap-3 sm:grid-cols-3"><select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3">{categoryOptions.map((item) => <option key={item}>{item}</option>)}</select><input type="number" min="0" value={budgetAmount} onChange={(event) => setBudgetAmount(event.target.value)} className="min-h-11 rounded-lg border border-slate-300 bg-white px-3" placeholder="Budget amount" /><div className="flex gap-2"><button type="button" onClick={() => setIsEditing(false)} className="flex-1 rounded-lg border border-slate-300 px-3 text-sm font-semibold">Cancel</button><button type="button" onClick={saveEdit} className="flex-1 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">Save</button></div></div></section>}<section className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Budget</p><p className="mt-2 text-2xl font-bold">{format(safeBudget)}</p></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total Spent</p><p className="mt-2 text-2xl font-bold">{format(spent)}</p></div><div className={`rounded-2xl border p-5 shadow-sm ${remaining < 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}><p className="text-sm text-slate-500">{remaining < 0 ? "Over Budget" : "Remaining"}</p><p className={`mt-2 text-2xl font-bold ${remaining < 0 ? "text-red-600" : "text-green-600"}`}>{format(Math.abs(remaining))}</p></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-semibold text-slate-900">{budget.category} Budget</p><p className="mt-1 text-sm text-slate-500">{format(spent)} spent of {format(safeBudget)}</p></div><p className="text-lg font-bold text-slate-900">{percentage.toFixed(0)}% used</p></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${progressColor}`} style={{ width: `${percentage}%` }} /></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Daily Spending Plan</h2><p className="mt-1 text-sm text-slate-500">Daily Budget Target: <span className="font-semibold text-indigo-600">{format(dailyPlan.originalDailyTarget)} per day</span></p></div>{dailyPlan.isCurrentMonth && <p className="text-sm text-slate-500">{dailyPlan.daysRemaining} days remaining</p>}</div>{dailyPlan.isCurrentMonth && <div className="mt-4 grid gap-3 sm:grid-cols-3"><p className="text-sm"><span className="block text-slate-500">Expected so far</span><span className="font-semibold">{format(dailyPlan.expectedSpent)}</span></p><p className="text-sm"><span className="block text-slate-500">Actual spending</span><span className="font-semibold">{format(spent)}</span></p><p className="text-sm"><span className="block text-slate-500">Remaining daily allowance</span><span className="font-semibold">{format(dailyPlan.recommendedDailySpending)} / day</span></p></div>}<p className={`mt-4 text-sm font-medium ${dailyPlan.status === "on_track" ? "text-green-600" : dailyPlan.status === "slightly_above" ? "text-yellow-600" : "text-red-600"}`}>{dailyPlan.status === "on_track" ? "On track" : dailyPlan.status === "slightly_above" ? `Slightly above target by ${format(dailyPlan.amountAboveTarget)}` : dailyPlan.status === "overspending" ? `Overspending — adjust to ${format(dailyPlan.recommendedDailySpending)} per day` : dailyPlan.status === "budget_reached" ? "Budget limit reached" : `Over budget by ${format(Math.abs(dailyPlan.remaining))}`}</p></section><section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><h2 className="text-lg font-bold text-slate-900">Spending History</h2>{expenses.length === 0 ? <div className="mt-5 grid place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center"><Wallet className="text-slate-400" size={26} /><p className="mt-3 text-sm text-slate-500">No spending recorded for {budget.category} yet.</p></div> : <div className="mt-4 space-y-5">{Object.entries(dates).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => <div key={date}><h3 className="text-sm font-semibold text-slate-500">{date === new Date().toISOString().slice(0, 10) ? "Today" : new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</h3><ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100">{items.map((item) => <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm"><span className="min-w-0 truncate text-slate-700">{item.description || "Expense"}</span><span className="shrink-0 font-semibold text-slate-900">{format(item.amount)}</span></li>)}</ul></div>)}</div>}</section></section>;
}

export default BudgetDetails;
