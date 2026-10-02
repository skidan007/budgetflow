// Planner categories are shared with Smart Planner. New expense categories are
// determined only by the user's applicable current budgets.
export const EXPENSE_CATEGORIES = [
  "Food", "Transport", "Bills", "Shopping", "Health", "Entertainment",
  "Savings", "Emergency Fund", "Investment", "Rent", "Education",
  "Debt Repayment", "Business", "Personal Care", "Other",
];

export const INCOME_CATEGORIES = ["Salary", "Business", "Investment", "Other"];

export function getAvailableExpenseCategoriesFromBudgets(budgets = [], currentMonth, currency) {
  const seen = new Set();
  return budgets
    .filter((budget) => budget.month === currentMonth && budget.currency === currency)
    .map((budget) => String(budget.category || "").trim())
    .filter((category) => {
      if (!category || seen.has(category)) return false;
      seen.add(category);
      return true;
    });
}
