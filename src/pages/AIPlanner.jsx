import { useState } from "react";
import {
  Sparkles,
  ArrowRight,
  Target,
  TrendingUp,
  Wallet,
  PiggyBank,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import toast from "react-hot-toast";

import { useFinance } from "../context/FinanceContext";

function AIPlanner() {
const getCategoryIcon = (category) => {
  const name = category.toLowerCase();

  if (name.includes("saving")) {
    return PiggyBank;
  }

  if (
    name.includes("invest") ||
    name.includes("wealth")
  ) {
    return TrendingUp;
  }

  if (
    name.includes("emergency") ||
    name.includes("buffer")
  ) {
    return ShieldCheck;
  }

  if (
    name.includes("personal") ||
    name.includes("flexible")
  ) {
    return Target;
  }

  return Wallet;
};

  const { defaultCurrency, currencySymbol } = useFinance();

  const [income, setIncome] = useState("");
  const [goal, setGoal] = useState("");
  const [planningFor, setPlanningFor] = useState("Monthly");

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------------
  // FORMAT MONEY
  // -------------------------------------

  const formatMoney = (amount) => {
    return `${currencySymbol}${Number(amount).toLocaleString()}`;
  };

  // -------------------------------------
  // GENERATE PLAN
  // -------------------------------------

  const handleGeneratePlan = async (e) => {
  e.preventDefault();

  const amount = Number(income);

  if (!amount || amount <= 0) {
    toast.error("Please enter a valid amount.");
    return;
  }

  if (!goal.trim()) {
    toast.error(
      "Tell BudgetFlow what you want to achieve.",
    );
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/api/ai-planner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        income: amount,
        goal: goal.trim(),
        planningFor,
        currency: defaultCurrency,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ||
          "Failed to generate financial plan.",
      );
    }

    if (!data.plan) {
      throw new Error(
        "No financial plan was returned.",
      );
    }

    const normalizedPlan = {
      income: amount,
      summary: data.plan.summary || "",
      categories: data.plan.categories.map(
        (category, index) => ({
          id: index + 1,
          name: category.name,
          amount: Number(category.amount) || 0,
          percentage:
            Number(category.percentage) || 0,
          description:
            category.description || "",
        }),
      ),
    };

    setPlan(normalizedPlan);

    toast.success(
      "Your personalized financial plan is ready!",
    );
  } catch (error) {
    console.error(
      "Generate AI plan error:",
      error,
    );

    toast.error(
      error.message ||
        "Unable to generate your financial plan.",
    );
  } finally {
    setLoading(false);
  }
};

  // -------------------------------------
  // RESET
  // -------------------------------------

  const handleReset = () => {
    setPlan(null);
    setIncome("");
    setGoal("");
    setPlanningFor("Monthly");
  };

  // -------------------------------------
  // USE PLAN
  // -------------------------------------

  const handleUsePlan = () => {
    /*
     * We will connect this to FinanceContext later.
     *
     * Eventually this button will:
     *
     * 1. Create budgets
     * 2. Create savings goals
     * 3. Create investment allocation
     * 4. Save the AI plan
     */

    toast.success("Your plan is ready to be added to BudgetFlow.");
  };

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      {/* ================================= */}
      {/* HEADER */}
      {/* ================================= */}

      {!plan && (
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Sparkles size={30} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            AI Financial Planner
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-slate-500">
            Tell BudgetFlow about your money and what you want to achieve. We'll
            create a practical financial plan for you.
          </p>
        </div>
      )}

      {/* ================================= */}
      {/* FORM */}
      {/* ================================= */}

      {!plan && (
        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <form onSubmit={handleGeneratePlan} className="space-y-6">
            {/* MONEY */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                How much money do you have?
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                  {currencySymbol}
                </span>

                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder="500000"
                  min="0"
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <p className="mt-2 text-xs text-slate-400">
                Currency: {defaultCurrency}
              </p>
            </div>

            {/* PERIOD */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                What are you planning for?
              </label>

              <select
                value={planningFor}
                onChange={(e) => setPlanningFor(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Monthly">This month</option>

                <option value="Weekly">This week</option>

                <option value="Custom">A specific financial goal</option>
              </select>
            </div>

            {/* GOAL */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                What do you want to achieve?
              </label>

              <textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Example: I want to pay my bills, save ₦100,000, invest some money and still have enough for myself."
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* GENERATE */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Sparkles size={20} />

              {loading ? "Creating your plan..." : "Generate My Financial Plan"}

              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
      )}

      {/* ================================= */}
      {/* AI PLAN */}
      {/* ================================= */}

      {plan && (
        <div className="space-y-6">
          {/* PLAN HEADER */}

          <div className="rounded-2xl bg-slate-900 p-6 text-white shadow-lg sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-indigo-300">
                  <Sparkles size={20} />

                  <span className="text-sm font-semibold">BudgetFlow AI</span>
                </div>

                <h1 className="mt-3 text-2xl font-bold sm:text-3xl">
                  Here's your financial plan
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                  Based on {formatMoney(plan.income)} and your financial goals.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
                title="Create another plan"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-slate-300">Your goal</p>

              <p className="mt-1 text-sm font-medium text-white">{goal}</p>
            </div>
          </div>

          {/* TOTAL */}

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Available to plan</p>

                <p className="mt-1 text-3xl font-bold text-slate-900">
                  {formatMoney(plan.income)}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <Wallet size={24} />
              </div>
            </div>
          </div>

          {/* BREAKDOWN */}

          <div>
            <h2 className="mb-4 text-xl font-bold text-slate-900">
              Recommended Breakdown
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              {plan.categories.map((item) => {
                const Icon = getCategoryIcon(item.name);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white p-5 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconBg} ${item.iconColor}`}
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

                      <p className="text-lg font-bold text-slate-900">
                        {formatMoney(item.amount)}
                      </p>
                    </div>

                    {/* PROGRESS */}

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600"
                        style={{
                          width: `${item.percentage}%`,
                        }}
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

          {/* ACTIONS */}

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900">
              What would you like to do?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              You can apply this plan to your BudgetFlow account.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleUsePlan}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                <Target size={19} />
                Use This Plan
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw size={19} />
                Create Another Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AIPlanner;
