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
  Pencil,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { useFinance } from "../context/FinanceContext";

function AIPlanner() {
  const {
    defaultCurrency,
    currencySymbol,
    setGoals,
    setBudgets,
    currentMonth,
  } = useFinance();

  // -------------------------------------
  // FORM STATE
  // -------------------------------------

  const [income, setIncome] = useState("");
  const [goal, setGoal] = useState("");
  const [planningFor, setPlanningFor] = useState("Monthly");

  // -------------------------------------
  // PLAN STATE
  // -------------------------------------

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  // -------------------------------------
  // EDIT STATE
  // -------------------------------------

  const [isEditing, setIsEditing] = useState(false);

  // -------------------------------------
  // FORMAT MONEY
  // -------------------------------------

  const formatMoney = (amount) => {
    return `${currencySymbol}${Number(amount || 0).toLocaleString()}`;
  };

  // -------------------------------------
  // CATEGORY ICON
  // -------------------------------------

  const getCategoryIcon = (category) => {
    const name = String(category || "").toLowerCase();

    if (name.includes("saving")) {
      return PiggyBank;
    }

    if (name.includes("invest") || name.includes("wealth")) {
      return TrendingUp;
    }

    if (name.includes("emergency") || name.includes("buffer")) {
      return ShieldCheck;
    }

    if (name.includes("personal") || name.includes("flexible")) {
      return Target;
    }

    return Wallet;
  };

  // -------------------------------------
  // CATEGORY STYLE
  // -------------------------------------

  const getCategoryStyle = (category) => {
    const name = String(category || "").toLowerCase();

    if (name.includes("saving")) {
      return {
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        progress: "bg-green-600",
      };
    }

    if (name.includes("invest") || name.includes("wealth")) {
      return {
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600",
        progress: "bg-purple-600",
      };
    }

    if (name.includes("emergency") || name.includes("buffer")) {
      return {
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        progress: "bg-red-600",
      };
    }

    if (name.includes("personal") || name.includes("flexible")) {
      return {
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        progress: "bg-orange-600",
      };
    }

    return {
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      progress: "bg-blue-600",
    };
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
      toast.error("Tell BudgetFlow what you want to achieve.");
      return;
    }

    setLoading(true);

    try {
      /*
       * TEMPORARY LOCAL PLAN
       *
       * This will later be replaced by the real
       * AI API response.
       */

      await new Promise((resolve) => setTimeout(resolve, 700));

      const food = amount * 0.15;
      const transport = amount * 0.1;
      const bills = amount * 0.15;
      const entertainment = amount * 0.05;
      const shopping = amount * 0.05;
      const health = amount * 0.05;

      const savings = amount * 0.2;
      const investment = amount * 0.15;
      const emergency = amount * 0.1;

      setPlan({
        income: amount,

        summary:
          "This is a starting financial plan based on your available money and stated goal.",

        categories: [
          {
            id: 1,
            name: "Food",
            amount: food,
            percentage: 15,
            description: "Food, groceries and daily meals.",
          },

          {
            id: 2,
            name: "Transport",
            amount: transport,
            percentage: 10,
            description: "Transportation and commuting expenses.",
          },

          {
            id: 3,
            name: "Bills",
            amount: bills,
            percentage: 15,
            description:
              "Electricity, internet, phone and other regular bills.",
          },

          {
            id: 4,
            name: "Entertainment",
            amount: entertainment,
            percentage: 5,
            description: "Entertainment and leisure activities.",
          },

          {
            id: 5,
            name: "Shopping",
            amount: shopping,
            percentage: 5,
            description: "Clothing, personal purchases and other shopping.",
          },

          {
            id: 6,
            name: "Health",
            amount: health,
            percentage: 5,
            description:
              "Healthcare, medication and other health-related expenses.",
          },

          {
            id: 7,
            name: "Savings",
            amount: savings,
            percentage: 20,
            description: "Money set aside for your savings goals.",
          },

          {
            id: 8,
            name: "Investment",
            amount: investment,
            percentage: 15,
            description: "Money allocated toward long-term wealth building.",
          },

          {
            id: 9,
            name: "Emergency Fund",
            amount: emergency,
            percentage: 10,
            description: "A financial buffer for unexpected expenses.",
          },
        ],
      });

      toast.success("Your financial plan is ready!");
    } catch (error) {
      console.error("Generate plan error:", error);

      toast.error("Unable to generate your financial plan.");
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------
  // EDIT PLAN
  // -------------------------------------

  const handleEditPlan = () => {
    setIsEditing(true);
  };

  // -------------------------------------
  // UPDATE CATEGORY AMOUNT
  // -------------------------------------

  const handleCategoryAmountChange = (categoryId, value) => {
    const amount = Number(value);

    setPlan((prev) => {
      if (!prev) return prev;

      const updatedCategories = prev.categories.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }

        return {
          ...category,
          amount: Number.isNaN(amount) || amount < 0 ? 0 : amount,
        };
      });

      const total = updatedCategories.reduce(
        (sum, category) => sum + Number(category.amount || 0),
        0,
      );

      const categoriesWithPercent = updatedCategories.map((category) => ({
        ...category,
        percentage: total > 0 ? Math.round((category.amount / total) * 100) : 0,
      }));

      return {
        ...prev,
        categories: categoriesWithPercent,
      };
    });
  };

  // -------------------------------------
  // SAVE EDITED PLAN
  // -------------------------------------

  const handleSaveEdit = () => {
    if (!plan) return;

    const total = plan.categories.reduce(
      (sum, category) => sum + Number(category.amount || 0),
      0,
    );

    if (total <= 0) {
      toast.error("Your plan must contain at least one amount.");
      return;
    }

    setPlan((prev) => {
      if (!prev) return prev;

      const categories = prev.categories.map((category) => ({
        ...category,
        percentage: Math.round((Number(category.amount || 0) / total) * 100),
      }));

      return {
        ...prev,
        categories,
      };
    });

    setIsEditing(false);

    toast.success("Plan updated successfully.");
  };

  // -------------------------------------
  // CANCEL EDIT
  // -------------------------------------

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  // -------------------------------------
  // RESET
  // -------------------------------------

  const handleReset = () => {
    setPlan(null);
    setIncome("");
    setGoal("");
    setPlanningFor("Monthly");
    setIsEditing(false);
  };

  // -------------------------------------
  // USE PLAN
  // -------------------------------------

  const handleUsePlan = () => {
    if (!plan) {
      toast.error("There is no plan to use.");
      return;
    }

    try {
      const savingsCategory = plan.categories.find((category) =>
        String(category.name).toLowerCase().includes("saving"),
      );

      const emergencyCategory = plan.categories.find((category) =>
        String(category.name).toLowerCase().includes("emergency"),
      );

      // -----------------------------------
      // CREATE / UPDATE SAVINGS GOAL
      // -----------------------------------

      if (savingsCategory && Number(savingsCategory.amount) > 0) {
        setGoals((previousGoals) => {
          const existingGoal = previousGoals.find(
            (item) => item.name === "BudgetFlow Savings Plan",
          );

          const newGoal = {
            id: existingGoal?.id ?? `ai-savings-${Date.now()}`,

            name: "BudgetFlow Savings Plan",

            type: "🤖 AI Plan",

            targetAmount: Number(savingsCategory.amount),

            currentAmount: existingGoal?.currentAmount ?? 0,

            targetDate: "",

            currency: defaultCurrency,

            savingsHistory: existingGoal?.savingsHistory ?? [],
          };

          if (existingGoal) {
            return previousGoals.map((item) =>
              item.id === existingGoal.id ? newGoal : item,
            );
          }

          return [...previousGoals, newGoal];
        });
      }

      // -----------------------------------
      // CREATE / UPDATE EMERGENCY GOAL
      // -----------------------------------

      if (emergencyCategory && Number(emergencyCategory.amount) > 0) {
        setGoals((previousGoals) => {
          const existingGoal = previousGoals.find(
            (item) => item.name === "BudgetFlow Emergency Fund",
          );

          const newGoal = {
            id: existingGoal?.id ?? `ai-emergency-${Date.now()}`,

            name: "BudgetFlow Emergency Fund",

            type: "🛡️ Emergency Fund",

            targetAmount: Number(emergencyCategory.amount),

            currentAmount: existingGoal?.currentAmount ?? 0,

            targetDate: "",

            currency: defaultCurrency,

            savingsHistory: existingGoal?.savingsHistory ?? [],
          };

          if (existingGoal) {
            return previousGoals.map((item) =>
              item.id === existingGoal.id ? newGoal : item,
            );
          }

          return [...previousGoals, newGoal];
        });
      }

      // -----------------------------------
      // CREATE MONTHLY BUDGETS
      // -----------------------------------

      const allowedBudgetCategories = [
        "Food",
        "Transport",
        "Bills",
        "Entertainment",
        "Shopping",
        "Health",
      ];

      const budgetCategories = plan.categories.filter((category) =>
        allowedBudgetCategories.includes(category.name),
      );

      setBudgets((previousBudgets) => {
        const updatedBudgets = [...previousBudgets];

        budgetCategories.forEach((category) => {
          const categoryName = category.name;

          const categoryAmount = Number(category.amount);

          if (categoryAmount <= 0) {
            return;
          }

          const existingIndex = updatedBudgets.findIndex(
            (budget) =>
              budget.category === categoryName &&
              budget.currency === defaultCurrency &&
              budget.month === currentMonth,
          );

          const newBudget = {
            id:
              existingIndex >= 0
                ? updatedBudgets[existingIndex].id
                : `ai-budget-${Date.now()}-${categoryName}`,

            category: categoryName,

            amount: categoryAmount,

            currency: defaultCurrency,

            month: currentMonth,
          };

          if (existingIndex >= 0) {
            updatedBudgets[existingIndex] = newBudget;
          } else {
            updatedBudgets.push(newBudget);
          }
        });

        return updatedBudgets;
      });

      setIsEditing(false);

      toast.success("Your AI plan has been added to BudgetFlow!");
    } catch (error) {
      console.error("Use AI plan error:", error);

      toast.error("Unable to apply the plan.");
    }
  };

  // -------------------------------------
  // PAGE
  // -------------------------------------

  return (
    <section className="mx-auto max-w-5xl space-y-8">
      {/* ================================= */}
      {/* INTRO */}
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
            Tell BudgetFlow how much money you have and what you want to
            achieve. We'll help you create a practical financial plan.
          </p>
        </div>
      )}

      {/* ================================= */}
      {/* FORM */}
      {/* ================================= */}

      {!plan && (
        <div className="rounded-2xl bg-white p-6 shadow-md sm:p-8">
          <form onSubmit={handleGeneratePlan} className="space-y-6">
            {/* INCOME */}

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

            {/* SUBMIT */}

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
      {/* PLAN */}
      {/* ================================= */}

      {plan && (
        <div className="space-y-6">
          {/* HEADER */}

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
                  Based on {formatMoney(plan.income)} and your financial goal.
                </p>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="rounded-lg p-2 text-slate-300 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw size={20} />
              </button>
            </div>

            <div className="mt-6 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-slate-300">Your goal</p>

              <p className="mt-1 text-sm font-medium text-white">{goal}</p>
            </div>

            {plan.summary && (
              <p className="mt-5 text-sm leading-6 text-slate-300">
                {plan.summary}
              </p>
            )}
          </div>

          {/* TOTAL */}

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <p className="text-sm text-slate-500">Available to plan</p>

            <p className="mt-1 text-3xl font-bold text-slate-900">
              {formatMoney(plan.income)}
            </p>
          </div>

          {/* BREAKDOWN */}

          <div>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Recommended Breakdown
                </h2>

                {isEditing && (
                  <p className="mt-1 text-sm text-slate-500">
                    Adjust the amounts before applying your plan.
                  </p>
                )}
              </div>

              {!isEditing ? (
                <button
                  type="button"
                  onClick={handleEditPlan}
                  className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <Pencil size={16} />
                  Edit Plan
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    <Check size={16} />
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {plan.categories.map((item) => {
                const Icon = getCategoryIcon(item.name);

                const style = getCategoryStyle(item.name);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white p-5 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${style.iconBg} ${style.iconColor}`}
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
                            onChange={(e) =>
                              handleCategoryAmountChange(
                                item.id,
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-2 text-right font-bold text-slate-900 outline-none focus:border-indigo-500"
                          />
                        </div>
                      ) : (
                        <p className="text-lg font-bold text-slate-900">
                          {formatMoney(item.amount)}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${style.progress}`}
                        style={{
                          width: `${Math.min(item.percentage, 100)}%`,
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

          {/* PLAN TOTAL */}

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-indigo-900">
                Total planned
              </span>

              <span className="text-xl font-bold text-indigo-900">
                {formatMoney(
                  plan.categories.reduce(
                    (sum, item) => sum + Number(item.amount || 0),
                    0,
                  ),
                )}
              </span>
            </div>

            <p className="mt-1 text-sm text-indigo-700">
              Your plan should ideally match your available amount.
            </p>
          </div>

          {/* ACTIONS */}

          <div className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-bold text-slate-900">
              What would you like to do?
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Apply this plan to your BudgetFlow account.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleUsePlan}
                disabled={isEditing}
                className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
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

          {/* EXPLANATION */}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex gap-3">
              <Sparkles size={20} className="mt-0.5 shrink-0 text-indigo-600" />

              <div>
                <h3 className="font-semibold text-slate-900">
                  How BudgetFlow will use this plan
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Savings and Emergency Fund will become real goals in your
                  Goals page. Your spending categories will become monthly
                  budgets. Investment remains a recommendation for now.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AIPlanner;
