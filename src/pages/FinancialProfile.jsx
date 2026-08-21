import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import toast from "react-hot-toast";

import { useFinance } from "../context/FinanceContext";

const goalOptions = [
  "Save money",
  "Build emergency fund",
  "Invest",
  "Pay debt",
  "Start a business",
  "Other",
];

const budgetPreferences = [
  "Balanced",
  "Aggressive Saving",
  "Essentials First",
  "Custom",
];

function FinancialProfile() {
  const {
    defaultCurrency,
    setDefaultCurrency,
    currencySymbol,
    financialProfile,
    financialProfileLoading,
    saveFinancialProfile,
  } = useFinance();

  const [monthlyIncome, setMonthlyIncome] = useState("");
  const [mainGoal, setMainGoal] = useState(goalOptions[0]);
  const [monthlySavingsTarget, setMonthlySavingsTarget] = useState("");
  const [emergencyFundTarget, setEmergencyFundTarget] = useState("");
  const [budgetPreference, setBudgetPreference] = useState(
    budgetPreferences[0],
  );
  const [saving, setSaving] = useState(false);

  // Populate the form once the saved financial profile has loaded.
  useEffect(() => {
    if (!financialProfile) return;

    setMonthlyIncome(String(financialProfile.monthly_income || ""));
    setMainGoal(financialProfile.main_goal || goalOptions[0]);
    setMonthlySavingsTarget(
      String(financialProfile.monthly_savings_target || ""),
    );
    setEmergencyFundTarget(
      String(financialProfile.emergency_fund_target || ""),
    );
    setBudgetPreference(financialProfile.budget_preference || budgetPreferences[0]);
  }, [financialProfile]);

  const handleSave = async () => {
    const income = Number(monthlyIncome);

    if (monthlyIncome && (!Number.isFinite(income) || income < 0)) {
      toast.error("Please enter a valid monthly income.");
      return;
    }

    setSaving(true);

    try {
      await saveFinancialProfile({
        monthlyIncome: income,
        mainGoal,
        monthlySavingsTarget: Number(monthlySavingsTarget) || 0,
        emergencyFundTarget: Number(emergencyFundTarget) || 0,
        budgetPreference,
      });

      toast.success("Financial profile saved!");
    } catch (error) {
      console.error("Save financial profile error:", error);
      toast.error(error?.message || "Failed to save your financial profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600 sm:mx-0">
          <Wallet size={26} />
        </div>

        <h1 className="mt-4 text-3xl font-bold text-slate-900">
          Financial Profile
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Save your financial preferences so BudgetFlow (and the AI Planner)
          can suggest better defaults. You can still override any value.
        </p>
      </div>

      <div className="space-y-6 rounded-2xl bg-white p-6 shadow-md sm:p-8">
        {/* INCOME */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Income</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Monthly Income
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  placeholder="350000"
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Default Currency
              </label>
              <select
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="NGN">₦ Nigerian Naira</option>
                <option value="USD">$ US Dollar</option>
                <option value="GBP">£ British Pound</option>
                <option value="EUR">€ Euro</option>
                <option value="JPY">¥ Japanese Yen</option>
                <option value="CNY">¥ Chinese Yuan</option>
                <option value="CAD">C$ Canadian Dollar</option>
                <option value="AUD">A$ Australian Dollar</option>
                <option value="CHF">CHF Swiss Franc</option>
              </select>
            </div>
          </div>
        </div>

        {/* GOAL */}
        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Financial Goal
          </h2>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Main financial goal
            </label>
            <select
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {goalOptions.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* SAVINGS */}
        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">Savings</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Monthly Savings Target
              </label>
              <input
                type="number"
                min="0"
                value={monthlySavingsTarget}
                onChange={(e) => setMonthlySavingsTarget(e.target.value)}
                placeholder="100000"
                className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Emergency Fund Target{" "}
                <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="number"
                min="0"
                value={emergencyFundTarget}
                onChange={(e) => setEmergencyFundTarget(e.target.value)}
                placeholder="500000"
                className="w-full rounded-lg border border-slate-300 p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>

        {/* BUDGET PREFERENCE */}
        <div className="border-t border-slate-100 pt-6">
          <h2 className="text-lg font-semibold text-slate-900">
            Budget Preference
          </h2>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Preferred budgeting approach
            </label>
            <select
              value={budgetPreference}
              onChange={(e) => setBudgetPreference(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white p-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            >
              {budgetPreferences.map((preference) => (
                <option key={preference} value={preference}>
                  {preference}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || financialProfileLoading}
          className="w-full rounded-lg bg-indigo-600 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Financial Profile"}
        </button>
      </div>
    </section>
  );
}

export default FinancialProfile;
