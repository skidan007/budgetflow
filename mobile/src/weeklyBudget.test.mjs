import assert from "node:assert/strict";
import test from "node:test";
import { weeklyBudgetSummary } from "./weeklyBudget.mjs";

const budget = { month: "2025-01", category: "Food", currency: "NGN", amount: 31000 };

test("weekly targets use the days in the current budget-month week", () => {
  for (const [month, today, expectedDays] of [
    ["2025-02", "2025-02-28", 5],
    ["2024-02", "2024-02-29", 4],
    ["2025-04", "2025-04-30", 3],
    ["2025-05", "2025-05-31", 6],
  ]) {
    const summary = weeklyBudgetSummary({
      budget: { ...budget, month, amount: 28000 },
      transactions: [],
      today,
    });
    assert.equal(summary.days, expectedDays, `${month} week duration`);
    const monthDays = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
    assert.equal(summary.target, 28000 / monthDays * expectedDays);
  }
});

test("weekly spent is limited to the selected category, currency, month, and current week", () => {
  const summary = weeklyBudgetSummary({
    budget,
    today: "2025-01-08",
    transactions: [
      { type: "Expense", category: "Food", currency: "NGN", month: "2025-01", date: "2025-01-06", amount: 1200 },
      { type: "Expense", category: "Food", currency: "NGN", month: "2025-01", date: "2025-01-08", amount: 800 },
      { type: "Expense", category: "Transport", currency: "NGN", month: "2025-01", date: "2025-01-07", amount: 400 },
      { type: "Expense", category: "Food", currency: "USD", month: "2025-01", date: "2025-01-07", amount: 400 },
      { type: "Expense", category: "Food", currency: "NGN", month: "2024-12", date: "2024-12-31", amount: 900 },
      { type: "Income", category: "Food", currency: "NGN", month: "2025-01", date: "2025-01-07", amount: 500 },
    ],
  });
  assert.equal(summary.spent, 2000);
  assert.equal(summary.status, "Within weekly target");
});

test("weekly summary is omitted for budgets outside the current budget month", () => {
  assert.equal(weeklyBudgetSummary({ budget, today: "2025-02-01", transactions: [] }), null);
});

test("weekly status distinguishes target reached from overspending", () => {
  const atTarget = weeklyBudgetSummary({
    budget,
    today: "2025-01-08",
    transactions: [{ type: "Expense", category: "Food", currency: "NGN", month: "2025-01", date: "2025-01-08", amount: 7000 }],
  });
  const overTarget = weeklyBudgetSummary({
    budget,
    today: "2025-01-08",
    transactions: [{ type: "Expense", category: "Food", currency: "NGN", month: "2025-01", date: "2025-01-08", amount: 7500 }],
  });
  assert.equal(atTarget.status, "At weekly target");
  assert.equal(overTarget.status, "Over weekly target");
  assert.equal(overTarget.remaining, -500);
});
