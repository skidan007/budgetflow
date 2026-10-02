export function validateFinancialProfileAmounts(draft, decimalSeparator = ".") {
  const errors = {};
  const fields = [
    ["monthlyIncome", "monthlyIncome", "Monthly income"],
    ["monthlySavingsTarget", "monthlySavingsTarget", "Monthly savings target"],
    ["emergencyFundTarget", "emergencyFundTarget", "Emergency fund target"],
  ];
  fields.forEach(([key, errorKey, label]) => {
    const text = String(draft[key] ?? "").trim();
    if (!text) return;
    const normalized = decimalSeparator === "." ? text : text.replace(decimalSeparator, ".");
    const amount = Number(normalized);
    if (!Number.isFinite(amount) || amount < 0) errors[errorKey] = `${label} must be zero or greater.`;
  });
  return errors;
}

export function financialProfilePayload(userId, updates) {
  return {
    user_id: userId,
    monthly_income: Number(updates.monthlyIncome) || 0,
    main_goal: updates.mainGoal || "",
    monthly_savings_target: Number(updates.monthlySavingsTarget) || 0,
    emergency_fund_target: Number(updates.emergencyFundTarget) || 0,
    budget_preference: updates.budgetPreference || "Balanced",
  };
}

export function buildCurrencyOptions(symbols, names) {
  return Object.entries(symbols).map(([code, symbol]) => ({
    code,
    symbol,
    name: names[code] || code,
  }));
}
