import test from "node:test";
import assert from "node:assert/strict";
import { parseEditableAmount } from "./amountInput.mjs";
import { allocatePlannerAmounts, fromMinorUnits, toMinorUnits, totalMinorUnits } from "./planner.mjs";

test("automatically allocates all available money using selected weights and exact cent remainders", () => {
  const result = allocatePlannerAmounts(10_000_000, [
    { name: "Food", weight: 25, mode: "automatic" },
    { name: "Transport", weight: 15, mode: "automatic" },
    { name: "Bills", weight: 15, mode: "automatic" },
  ]);
  assert.equal(result.error, undefined);
  assert.equal(result.plannedMinor, 10_000_000);
  assert.equal(result.remainingMinor, 0);
  assert.deepEqual(result.rows.map((row) => row.amountMinor), [4_545_455, 2_727_273, 2_727_272]);
});

test("specific allocations may leave a clear, unallocated remainder", () => {
  const result = allocatePlannerAmounts(10_000_000, [
    { name: "Food", mode: "specific", amount: "20000" },
    { name: "Transport", mode: "specific", amount: "15000" },
    { name: "Bills", mode: "specific", amount: "30000" },
  ]);
  assert.equal(result.plannedMinor, 6_500_000);
  assert.equal(result.remainingMinor, 3_500_000);
});

test("rejects and reports over-allocation without silently changing inputs", () => {
  const result = allocatePlannerAmounts(5_000_000, [
    { name: "Food", mode: "specific", amount: "30000" },
    { name: "Bills", mode: "specific", amount: "30000" },
  ]);
  assert.equal(result.error, "overallocated");
  assert.equal(result.overMinor, 1_000_000);
});

test("preserves decimal amounts and supports natural leading/trailing decimal states", () => {
  const parsed = parseEditableAmount("12,500.50", "$", true);
  assert.equal(parsed.error, undefined);
  assert.equal(toMinorUnits(parsed.value), 1_250_050);
  assert.equal(toMinorUnits(".50"), 50);
  assert.equal(toMinorUnits("12."), 1_200);
  const result = allocatePlannerAmounts(1_250_050, [{ name: "Food", mode: "automatic", weight: 25 }]);
  assert.equal(result.rows[0].amountMinor, 1_250_050);
  assert.equal(fromMinorUnits(1_250_050), 12500.5);
});

test("rejects invalid amount syntax and keeps totals in safe integer cents", () => {
  for (const input of ["", "1.234", "1.2.3", "-4", "NaN", "1,000"])
    assert.equal(toMinorUnits(input), null, input);
  assert.equal(totalMinorUnits([{ amountMinor: 125050 }, { amountMinor: 50 }]), 125100);
  assert.equal(totalMinorUnits([{ amountMinor: null }]), null);
});
