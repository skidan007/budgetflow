import test from "node:test";
import assert from "node:assert/strict";
import { getAvailableExpenseCategoriesFromBudgets, INCOME_CATEGORIES } from "./categoryCatalog.mjs";

const currentMonth = "2026-10";
const currency = "NGN";

test("only current month budgets in the active currency provide expense categories", () => {
  const budgets = [
    { category: "Food", month: currentMonth, currency },
    { category: "Transport", month: currentMonth, currency },
    { category: "Food", month: "2026-09", currency },
    { category: "Health", month: currentMonth, currency: "USD" },
  ];
  assert.deepEqual(getAvailableExpenseCategoriesFromBudgets(budgets, currentMonth, currency), ["Food", "Transport"]);
});

test("duplicate current budget categories appear only once", () => {
  const budgets = [
    { category: "Food", month: currentMonth, currency },
    { category: "Food", month: currentMonth, currency },
    { category: "Personal Care", month: currentMonth, currency },
    { category: "Other", month: currentMonth, currency },
  ];
  assert.deepEqual(getAvailableExpenseCategoriesFromBudgets(budgets, currentMonth, currency), ["Food", "Personal Care", "Other"]);
});

test("no current budgets produces no expense category fallback", () => {
  assert.deepEqual(getAvailableExpenseCategoriesFromBudgets([], currentMonth, currency), []);
  assert.deepEqual(getAvailableExpenseCategoriesFromBudgets([
    { category: "Food", month: "2026-09", currency },
    { category: "Health", month: currentMonth, currency: "USD" },
  ], currentMonth, currency), []);
});

test("new budgets appear and deleted or historical budget categories disappear", () => {
  const existing = [{ category: "Food", month: currentMonth, currency }, { category: "Transport", month: currentMonth, currency }];
  assert.deepEqual(getAvailableExpenseCategoriesFromBudgets(existing, currentMonth, currency), ["Food", "Transport"]);
  const withNewBudget = [...existing, { category: "Health", month: currentMonth, currency }];
  assert.deepEqual(getAvailableExpenseCategoriesFromBudgets(withNewBudget, currentMonth, currency), ["Food", "Transport", "Health"]);
  const afterDelete = withNewBudget.filter((budget) => budget.category !== "Health");
  assert.deepEqual(getAvailableExpenseCategoriesFromBudgets(afterDelete, currentMonth, currency), ["Food", "Transport"]);
});

test("income categories remain separate from the expense budget restriction", () => {
  assert.deepEqual(INCOME_CATEGORIES, ["Salary", "Business", "Investment", "Other"]);
});
