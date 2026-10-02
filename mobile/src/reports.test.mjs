import test from "node:test";
import assert from "node:assert/strict";
import {
  budgetPerformance,
  expenseCategoryTotals,
  totalForType,
  transactionMonth,
  transactionsForMonth,
} from "./reports.mjs";

const entries = [
  { type: "Income", category: "Salary", amount: 350000, date: "2026-09-10", currency: "NGN" },
  { type: "Expense", category: "Food", amount: 30000, date: "2026-09-12", currency: "NGN" },
  { type: "Expense", category: "Transport", amount: 20000, date: "2026-09-18", currency: "NGN" },
  { type: "Expense", category: "Bills", amount: 50000, date: "2026-09-25", currency: "NGN" },
  { type: "Income", category: "Salary", amount: 1000, date: "2026-10-01", currency: "USD" },
  { type: "Expense", category: "Transport", amount: 25000, date: "2026-10-01", currency: "NGN" },
];

test("selected month totals use only matching transactions and recognized types", () => {
  const month = transactionsForMonth(entries, "2026-09", "NGN");
  assert.equal(totalForType(month, "Income"), 350000);
  assert.equal(totalForType(month, "Expense"), 100000);
  assert.equal(totalForType(month, "Transfer"), 0);
  assert.equal(totalForType(month, "Income") - totalForType(month, "Expense"), 250000);
});

test("category totals sort highest spending first and calculate shares from expenses", () => {
  const categories = expenseCategoryTotals(transactionsForMonth(entries, "2026-09", "NGN"));
  assert.deepEqual(categories.map(({ category, amount }) => [category, amount]), [
    ["Bills", 50000], ["Food", 30000], ["Transport", 20000],
  ]);
  assert.equal(categories.reduce((total, row) => total + row.amount, 0), 100000);
  assert.equal(categories[1].amount / 100000 * 100, 30);
});

test("budget performance reports remaining and over-budget amounts with raw percentages", () => {
  const transactions = [
    { type: "Expense", category: "Food", amount: 30000, date: "2026-09-15", currency: "NGN" },
    { type: "Expense", category: "Transport", amount: 25000, date: "2026-09-20", currency: "NGN" },
  ];
  assert.deepEqual(budgetPerformance(transactions, { category: "Food", amount: 50000 }, "2026-09", "NGN"), {
    amount: 50000, spent: 30000, remaining: 20000, percent: 60,
  });
  assert.deepEqual(budgetPerformance(transactions, { category: "Transport", amount: 20000 }, "2026-09", "NGN"), {
    amount: 20000, spent: 25000, remaining: -5000, percent: 125,
  });
  assert.deepEqual(budgetPerformance([], { category: "Food", amount: 0 }, "2026-09", "NGN"), {
    amount: 0, spent: 0, remaining: 0, percent: 0,
  });
});

test("month membership follows local transaction date strings at month boundaries", () => {
  assert.equal(transactionMonth({ date: "2026-01-31" }), "2026-01");
  assert.equal(transactionMonth({ date: "2026-02-01" }), "2026-02");
  assert.equal(transactionsForMonth([
    { type: "Expense", amount: 1, date: "2026-01-31", currency: "NGN" },
    { type: "Expense", amount: 2, date: "2026-02-01", currency: "NGN" },
  ], "2026-02", "NGN").length, 1);
});

test("reports filter currencies and keep legacy missing-currency records in NGN", () => {
  assert.equal(transactionsForMonth(entries, "2026-10", "USD").length, 1);
  assert.equal(transactionsForMonth([{ type: "Income", amount: 1, date: "2026-10-01" }], "2026-10", "NGN").length, 1);
  assert.equal(transactionsForMonth(entries, "2026-11", "NGN").length, 0);
});
