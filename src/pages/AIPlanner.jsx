import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Pencil,
  PiggyBank,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useFinance } from "../context/FinanceContext";

const OPTIONS = [
  ["food", "Food", 25, "Groceries, meals and everyday food."],
  ["transport", "Transport", 15, "Commuting, fuel and transport fares."],
  ["bills", "Bills", 15, "Utilities, phone, internet and regular bills."],
  ["entertainment", "Entertainment", 5, "Leisure and fun spending."],
  ["shopping", "Shopping", 5, "Personal purchases and shopping."],
  ["health", "Health", 10, "Healthcare, medication and wellness."],
  ["savings", "Savings", 20, "Money set aside for your savings plan."],
  ["emergency-fund", "Emergency Fund", 15, "A buffer for unexpected expenses."],
  ["investment", "Investment", 10, "Long-term wealth building."],
  ["rent", "Rent", 30, "Rent and housing costs."],
  ["education", "Education", 10, "School fees, courses and learning."],
  ["debt-repayment", "Debt Repayment", 20, "Loan, credit and debt repayments."],
  ["business", "Business", 15, "Business operations and growth."],
  ["personal-care", "Personal Care", 8, "Grooming and personal care."],
  ["other", "Other", 5, "Anything else you want to include."],
].map(([id, name, weight, description]) => ({ id, name, weight, description }));
const GOAL_IDS = new Set(["savings", "emergency-fund"]);
const amount = (value) => Math.round(Number(value) || 0);
const planTotal = (categories) =>
  categories.reduce((sum, category) => sum + amount(category.amount), 0);

// Reserves specific amounts first, then normalizes only the selected automatic weights.
// The final automatic category receives the rounding remainder exactly.
function allocate(totalValue, categories) {
  const total = amount(totalValue);
  const specificTotal = categories
    .filter((item) => item.mode === "specific")
    .reduce((sum, item) => sum + amount(item.amount), 0);
  const automatic = categories.filter((item) => item.mode === "automatic");
  const remaining = total - specificTotal;
  if (remaining < 0 || !automatic.length)
    return { categories, specificTotal, remaining };
  const weightTotal = automatic.reduce((sum, item) => sum + item.weight, 0);
  let used = 0;
  let index = 0;
  return {
    specificTotal,
    remaining: 0,
    categories: categories.map((item) => {
      if (item.mode === "specific")
        return { ...item, amount: amount(item.amount) };
      index += 1;
      const value =
        index === automatic.length
          ? remaining - used
          : Math.round((item.weight / weightTotal) * remaining);
      used += value;
      return { ...item, amount: value };
    }),
  };
}

function AIPlanner() {
  const navigate = useNavigate();
  const {
    defaultCurrency,
    currencySymbol,
    setGoals,
    setBudgets,
    currentMonth,
    transactions,
    addTransaction,
    updateTransaction,
    financialProfile,
  } = useFinance();
  const [income, setIncome] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [plan, setPlan] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [savedPlan, setSavedPlan] = useState(null);
  const [isApplyingPlan, setIsApplyingPlan] = useState(false);
  const [isCategorySelectorOpen, setIsCategorySelectorOpen] = useState(false);

  const money = (value) => `${currencySymbol}${amount(value).toLocaleString()}`;
  const icon = (item) =>
    item.id === "savings"
      ? PiggyBank
      : item.id === "emergency-fund"
        ? ShieldCheck
        : item.id === "investment"
          ? TrendingUp
          : Wallet;
  const style = (item) =>
    item.id === "savings"
      ? ["bg-green-100", "text-green-600", "bg-green-600"]
      : item.id === "emergency-fund"
        ? ["bg-red-100", "text-red-600", "bg-red-600"]
        : item.id === "investment"
          ? ["bg-purple-100", "text-purple-600", "bg-purple-600"]
          : ["bg-indigo-100", "text-indigo-600", "bg-indigo-600"];
  const selected = (id) => selectedCategories.some((item) => item.id === id);
  const updateSelected = (id, values) =>
    setSelectedCategories((items) =>
      items.map((item) => (item.id === id ? { ...item, ...values } : item)),
    );

  function toggle(option) {
    setSelectedCategories((items) =>
      selected(option.id)
        ? items.filter((item) => item.id !== option.id)
        : [...items, { ...option, mode: "automatic", amount: "" }],
    );
  }
  function generate(event) {
    event.preventDefault();
    const available = amount(income || financialProfile?.monthly_income);
    const specificTotal = selectedCategories
      .filter((item) => item.mode === "specific")
      .reduce((sum, item) => sum + amount(item.amount), 0);
    const autoCount = selectedCategories.filter(
      (item) => item.mode === "automatic",
    ).length;
    if (available <= 0)
      return toast.error("Available money must be greater than zero.");
    if (!selectedCategories.length)
      return toast.error("Select at least one category.");
    if (
      selectedCategories.some(
        (item) => item.mode === "specific" && Number(item.amount) < 0,
      )
    )
      return toast.error("Specific amounts cannot be negative.");
    if (specificTotal > available)
      return toast.error(
        "The amounts you specified exceed your available money.",
      );
    if (!autoCount && specificTotal !== available)
      return toast.error(
        `You still have ${money(available - specificTotal)} unallocated. Add an automatic category or edit the amounts.`,
      );
    const result = allocate(available, selectedCategories);
    setPlan({
      income: available,
      categories: result.categories.map((item) => ({
        ...item,
        percentage: Number(((item.amount / available) * 100).toFixed(2)),
      })),
    });
    toast.success("Your Smart Plan is ready!");
  }
  function editAmount(id, value) {
    const nextAmount = Number(value);
    setPlan((current) => ({
      ...current,
      categories: current.categories.map((item) => {
        const itemAmount =
          item.id === id
            ? Number.isNaN(nextAmount) || nextAmount < 0
              ? 0
              : amount(nextAmount)
            : item.amount;
        return {
          ...item,
          amount: itemAmount,
          percentage: Number(((itemAmount / current.income) * 100).toFixed(2)),
        };
      }),
    }));
  }
  function saveEdit() {
    if (planTotal(plan.categories) > plan.income)
      return toast.error(
        "The total allocation cannot exceed your available money.",
      );
    setSavedPlan(null);
    setIsEditing(false);
    toast.success("Plan updated successfully.");
  }
  function reset() {
    setPlan(null);
    setSelectedCategories([]);
    setIncome("");
    setSavedPlan(null);
    setIsEditing(false);
  }
  async function usePlan() {
    if (!plan || planTotal(plan.categories) !== plan.income)
      return toast.error(
        "Allocate exactly your available money before using this plan.",
      );
    setIsApplyingPlan(true);
    try {
      const incomeTransaction = transactions.find(
        (item) =>
          item.type === "Income" &&
          item.category === "Smart Planned Income" &&
          item.month === currentMonth &&
          item.currency === defaultCurrency,
      );
      if (incomeTransaction)
        await updateTransaction(incomeTransaction.id, { amount: plan.income });
      else
        await addTransaction({
          type: "Income",
          category: "Smart Planned Income",
          amount: plan.income,
          date: new Date().toISOString().split("T")[0],
          currency: defaultCurrency,
          month: currentMonth,
        });
      setGoals((goals) => {
        const next = [...goals];
        plan.categories
          .filter((item) => GOAL_IDS.has(item.id) && item.amount > 0)
          .forEach((item) => {
            const name =
              item.id === "savings"
                ? "BudgetFlow Savings Plan"
                : "BudgetFlow Emergency Fund";
            const index = next.findIndex((goal) => goal.name === name);
            const old = next[index];
            const goal = {
              id: old?.id ?? `smart-${item.id}-${Date.now()}`,
              name,
              type: item.id === "savings" ? "Savings Plan" : "Emergency Fund",
              targetAmount: item.amount,
              currentAmount: old?.currentAmount ?? 0,
              targetDate: old?.targetDate ?? "",
              currency: old?.currency ?? defaultCurrency,
              savingsHistory: old?.savingsHistory ?? [],
            };
            if (index >= 0) next[index] = goal;
            else next.push(goal);
          });
        return next;
      });
      setBudgets((budgets) => {
        const next = [...budgets];
        plan.categories
          .filter((item) => !GOAL_IDS.has(item.id) && item.amount > 0)
          .forEach((item) => {
            const index = next.findIndex(
              (budget) =>
                budget.category === item.name &&
                budget.currency === defaultCurrency &&
                budget.month === currentMonth,
            );
            const budget = {
              id:
                index >= 0
                  ? next[index].id
                  : `smart-budget-${Date.now()}-${item.id}`,
              category: item.name,
              amount: item.amount,
              currency: defaultCurrency,
              month: currentMonth,
            };
            if (index >= 0) next[index] = budget;
            else next.push(budget);
          });
        return next;
      });
      toast.success("Smart Plan saved");
      navigate("/budgets");
    } catch (error) {
      console.error("Apply Smart Plan error:", error);
      toast.error(error?.message || "Unable to apply the plan.");
    } finally {
      setIsApplyingPlan(false);
    }
  }
  const allocated = plan ? planTotal(plan.categories) : 0;
  const remaining = plan ? plan.income - allocated : 0;
  const allSelected = selectedCategories.length === OPTIONS.length;
  const displayedIncome =
    income ||
    (Number(financialProfile?.monthly_income) > 0
      ? String(financialProfile.monthly_income)
      : "");

  const categoryPicker = (
    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {OPTIONS.map((option) => {
        const Icon = icon(option);
        const active = selected(option.id);
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-xl border p-4 text-left transition ${active ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500" : "border-slate-200 bg-white hover:border-indigo-300"}`}
          >
            <Icon
              size={20}
              className={active ? "text-indigo-600" : "text-slate-400"}
            />
            <p className="mt-3 text-sm font-semibold text-slate-800">
              {option.name}
            </p>
            <span
              className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${active ? "text-indigo-700" : "text-slate-400"}`}
            >
              {active && <CheckCircle2 size={13} />}
              {active ? "Selected" : "Select"}
            </span>
          </button>
        );
      })}
    </div>
  );

  if (!plan)
    return (
      <section className="mx-auto max-w-3xl space-y-5 pb-8">
        <header className="px-1 pt-2">
          <div className="flex items-center gap-2 text-indigo-600">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
              <Sparkles size={18} />
            </span>
            <span className="text-sm font-semibold">BudgetFlow</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Smart Planner
          </h1>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Build a practical financial plan from your available money and the
            categories that matter to you.
          </p>
        </header>
        <form
          onSubmit={generate}
          className="space-y-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6"
        >
          <div>
            <p className="text-xs font-bold tracking-wider text-indigo-600">
              STEP 1
            </p>
            <label className="mt-1 block text-base font-semibold text-slate-900">
              How much money do you want to plan?
            </label>
            <div className="mt-3 flex overflow-hidden rounded-xl border border-slate-300 bg-white transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
              <span className="flex shrink-0 items-center border-r border-slate-300 bg-slate-100 px-4 text-sm font-semibold text-slate-600">
                {currencySymbol}
                <span className="ml-1.5 hidden text-xs text-slate-400 sm:inline">
                  {defaultCurrency}
                </span>
              </span>
              <input
                type="number"
                min="0"
                value={displayedIncome}
                onChange={(event) => setIncome(event.target.value)}
                placeholder="Enter amount"
                className="min-w-0 flex-1 px-4 py-3 text-base text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Currency: {defaultCurrency}
            </p>
          </div>
          <div className="border-t border-slate-100 pt-5">
            <p className="text-xs font-bold tracking-wider text-indigo-600">
              STEP 2
            </p>
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Select categories for your plan
                </h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Choose only the categories you want BudgetFlow to include.
                </p>
              </div>
              <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {selectedCategories.length} selected
              </span>
            </div>
            <div className="relative mt-3">
              <button
                type="button"
                onClick={() => setIsCategorySelectorOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-indigo-300 hover:bg-slate-50"
              >
                <span>+ Select categories</span>
                <span className="text-indigo-600">
                  {isCategorySelectorOpen ? "▲" : "▼"}
                </span>
              </button>
              {isCategorySelectorOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
                  <div className="grid max-h-64 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
                    {OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selected(option.id)}
                          onChange={() => toggle(option)}
                          className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                        />
                        {option.name}
                      </label>
                    ))}
                  </div>
                  <div className="mt-3 flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedCategories(
                          OPTIONS.map((item) => ({
                            ...item,
                            mode: "automatic",
                            amount: "",
                          })),
                        )
                      }
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedCategories([])}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>
            {selectedCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedCategories.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggle(item)}
                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                  >
                    {item.name}
                    <X size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedCategories.length > 0 && (
            <div className="border-t border-slate-100 pt-5">
              <p className="text-xs font-bold tracking-wider text-indigo-600">
                STEP 3
              </p>
              <h2 className="mt-1 text-base font-semibold text-slate-900">
                Set priorities and amounts
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Automatic categories share the money remaining after your
                specific amounts.
              </p>
              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {selectedCategories.map((item) => {
                  const Icon = icon(item);
                  const [bg, colour] = style(item);
                  return (
                    <div key={item.id} className="p-3.5 sm:p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-slate-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg} ${colour}`}
                          >
                            <Icon size={18} />
                          </span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {item.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              Priority: {item.weight}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-4  text-sm">
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              checked={item.mode === "automatic"}
                              onChange={() =>
                                updateSelected(item.id, { mode: "automatic" })
                              }
                              className="accent-indigo-600"
                            />
                            Automatic allocation
                          </label>
                          <label className="flex cursor-pointer items-center gap-2">
                            <input
                              type="radio"
                              checked={item.mode === "specific"}
                              onChange={() =>
                                updateSelected(item.id, { mode: "specific" })
                              }
                              className="accent-indigo-600"
                            />
                            Specific amount
                          </label>
                        </div>
                      </div>
                      {item.mode === "specific" && (
                        <div className="mt-3 flex max-w-md overflow-hidden rounded-lg border border-slate-300 transition focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                          <span className="flex shrink-0 items-center border-r border-slate-300 bg-slate-100 px-3 text-sm font-semibold text-slate-600">
                            {currencySymbol}
                          </span>
                          <input
                            type="number"
                            min="0"
                            value={item.amount}
                            onChange={(event) =>
                              updateSelected(item.id, {
                                amount: event.target.value,
                              })
                            }
                            placeholder="Enter amount"
                            className="min-w-0 flex-1 px-3 py-2 text-sm outline-none placeholder:text-slate-400"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="border-t border-slate-100 pt-5">
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            >
              <Sparkles size={19} />
              Generate My Plan
              <ArrowRight size={19} />
            </button>
          </div>
        </form>
      </section>
    );

  if (!plan)
    return (
      <section className="mx-auto max-w-5xl space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Sparkles size={30} />
          </div>
          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            BudgetFlow Smart Planner
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-slate-500">
            Build a practical financial plan from your available money and the
            categories that matter to you.
          </p>
        </div>
        <form
          onSubmit={generate}
          className="space-y-6 rounded-2xl bg-white p-6 shadow-md sm:p-8"
        >
          <div>
            <p className="text-sm font-bold text-indigo-600">STEP 1</p>
            <label className="mt-1 mb-2 block text-lg font-semibold text-slate-900">
              How much money do you want to plan?
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                {currencySymbol}
              </span>
              <input
                type="number"
                min="0"
                value={displayedIncome}
                onChange={(event) => setIncome(event.target.value)}
                placeholder="500000"
                className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Currency: {defaultCurrency}
            </p>
          </div>
          <div className="border-t border-slate-100 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-indigo-600">STEP 2</p>
                <h2 className="mt-1 text-lg font-semibold text-slate-900">
                  Select the categories for your plan
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Only selected categories will be included.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedCategories(
                      allSelected
                        ? []
                        : OPTIONS.map((item) => ({
                            ...item,
                            mode: "automatic",
                            amount: "",
                          })),
                    )
                  }
                  className="rounded-lg border border-indigo-200 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  {allSelected ? "Clear All" : "Select All"}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategories([])}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear All
                </button>
              </div>
            </div>
            {categoryPicker}
          </div>
          {selectedCategories.length > 0 && (
            <div className="border-t border-slate-100 pt-6">
              <p className="text-sm font-bold text-indigo-600">STEP 3</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                Set priorities and amounts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Automatic categories share the money remaining after your
                specific amounts.
              </p>
              <div className="mt-4 space-y-3">
                {selectedCategories.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {item.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Priority weight: {item.weight}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm">
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            checked={item.mode === "automatic"}
                            onChange={() =>
                              updateSelected(item.id, { mode: "automatic" })
                            }
                            className="accent-indigo-600"
                          />
                          Automatic allocation
                        </label>
                        <label className="flex cursor-pointer items-center gap-2">
                          <input
                            type="radio"
                            checked={item.mode === "specific"}
                            onChange={() =>
                              updateSelected(item.id, { mode: "specific" })
                            }
                            className="accent-indigo-600"
                          />
                          Specific amount
                        </label>
                      </div>
                    </div>
                    {item.mode === "specific" && (
                      <div className="relative mt-3 max-w-xs">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                          {currencySymbol}
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={item.amount}
                          onChange={(event) =>
                            updateSelected(item.id, {
                              amount: event.target.value,
                            })
                          }
                          placeholder="Enter amount"
                          className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-3 outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white hover:bg-indigo-700"
          >
            <Sparkles size={20} />
            Generate My Plan
            <ArrowRight size={20} />
          </button>
        </form>
      </section>
    );

  return (
    <section className="mx-auto max-w-5xl space-y-6">
      <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-300">
              <Sparkles size={20} />
              <span className="text-sm font-semibold">
                BudgetFlow Smart Planner
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
              Here&apos;s your financial plan
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Built from {money(plan.income)} and your selected categories.
            </p>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <p className="text-sm text-slate-500">Available to plan</p>
          <p className="mt-1 text-3xl font-bold text-slate-900">
            {money(plan.income)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-md">
          <p className="text-sm text-slate-500">Remaining</p>
          <p
            className={`mt-1 text-3xl font-bold ${remaining === 0 ? "text-green-600" : "text-amber-600"}`}
          >
            {money(remaining)}
          </p>
        </div>
      </div>
      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Plan preview</h2>
            {isEditing && (
              <p className="mt-1 text-sm text-slate-500">
                Adjust amounts. Your total cannot exceed the available money.
              </p>
            )}
          </div>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => {
                setSavedPlan(structuredClone(plan));
                setIsEditing(true);
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Pencil size={16} />
              Edit Plan
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (savedPlan) setPlan(savedPlan);
                  setSavedPlan(null);
                  setIsEditing(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
              >
                <X size={16} />
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white"
              >
                <Check size={16} />
                Save
              </button>
            </div>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {plan.categories.map((item) => {
            const Icon = icon(item);
            const [bg, colour, progress] = style(item);
            return (
              <div key={item.id} className="rounded-2xl bg-white p-5 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bg} ${colour}`}
                    >
                      <Icon size={22} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {item.percentage}%
                      </p>
                    </div>
                  </div>
                  {isEditing ? (
                    <div className="relative w-32">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                        {currencySymbol}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={item.amount}
                        onChange={(event) =>
                          editAmount(item.id, event.target.value)
                        }
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-2 text-right font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-slate-900">
                      {money(item.amount)}
                    </p>
                  )}
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${progress}`}
                    style={{ width: `${Math.min(item.percentage, 100)}%` }}
                  />
                </div>
                <p className="mt-3 text-sm leading-5 text-slate-500">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-indigo-900">Total Planned</span>
          <span className="text-xl font-bold text-indigo-900">
            {money(allocated)}
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-indigo-700">Remaining</span>
          <span
            className={
              remaining === 0
                ? "font-semibold text-green-700"
                : "font-semibold text-amber-700"
            }
          >
            {money(remaining)}
          </span>
        </div>
        {remaining !== 0 && (
          <p className="mt-3 text-sm text-amber-700">
            Allocate the remaining amount before using this plan.
          </p>
        )}
      </div>
      <div className="rounded-2xl bg-white p-6 shadow-md">
        <h2 className="text-xl font-bold text-slate-900">
          Ready to use this plan?
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Savings and Emergency Fund become goals; all other selected categories
          become monthly budgets.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={usePlan}
            disabled={isEditing || isApplyingPlan || remaining !== 0}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CircleDollarSign size={19} />
            {isApplyingPlan ? "Applying..." : "Use This Plan"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={19} />
            Create Another Plan
          </button>
        </div>
      </div>
    </section>
  );
}

export default AIPlanner;
