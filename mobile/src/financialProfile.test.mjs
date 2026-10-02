import test from "node:test";
import assert from "node:assert/strict";
import { buildCurrencyOptions, financialProfilePayload, validateFinancialProfileAmounts } from "./financialProfile.mjs";

test("profile mapping matches the existing financial_profiles fields and user ownership", () => {
  assert.deepEqual(financialProfilePayload("user-123", {
    monthlyIncome: "350000.50",
    mainGoal: "Build emergency fund",
    monthlySavingsTarget: "100000",
    emergencyFundTarget: "500000",
    budgetPreference: "Aggressive Saving",
  }), {
    user_id: "user-123",
    monthly_income: 350000.5,
    main_goal: "Build emergency fund",
    monthly_savings_target: 100000,
    emergency_fund_target: 500000,
    budget_preference: "Aggressive Saving",
  });
});

test("profile amount validation allows blank optional fields and rejects invalid or negative amounts", () => {
  assert.deepEqual(validateFinancialProfileAmounts({ monthlyIncome: "", monthlySavingsTarget: "100", emergencyFundTarget: "" }), {});
  assert.deepEqual(validateFinancialProfileAmounts({ monthlyIncome: "-1", monthlySavingsTarget: "abc", emergencyFundTarget: "Infinity" }), {
    monthlyIncome: "Monthly income must be zero or greater.",
    monthlySavingsTarget: "Monthly savings target must be zero or greater.",
    emergencyFundTarget: "Emergency fund target must be zero or greater.",
  });
  assert.deepEqual(validateFinancialProfileAmounts({ monthlyIncome: "10,5" }, ","), {});
});

test("currency selector options are derived only from the existing supported symbol map", () => {
  assert.deepEqual(buildCurrencyOptions({ NGN: "₦", USD: "$", GBP: "£" }, { NGN: "Nigerian Naira", USD: "US Dollar", GBP: "British Pound" }), [
    { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "GBP", symbol: "£", name: "British Pound" },
  ]);
});
