import test from "node:test";
import assert from "node:assert/strict";
import {
  amountCursorForEdit,
  editedTextRange,
  formatEditableAmount,
  parseEditableAmount,
  validateEditableAmount,
} from "./amountInput.mjs";

const cases = [
  ["5", "5"],
  ["50", "50"],
  ["500", "500"],
  ["1,000", "1000"],
  ["10,000", "10000"],
  ["100,000", "100000"],
  ["1,000,000", "1000000"],
  ["50.5", "50.5"],
  ["50.50", "50.50"],
  ["1,250.75", "1250.75"],
  [".50", "0.50"],
  ["000500", "500"],
  ["000500.50", "500.50"],
  ["₦50,000", "50000"],
  ["50,000.50", "50000.50"],
  ["0", "0"],
  ["0.00", "0.00"],
];

test("accepts valid values, grouped pastes, and decimal input without forcing trailing zeros", () => {
  for (const [input, expected] of cases) {
    assert.equal(parseEditableAmount(input, "₦").value, expected, input);
  }
  assert.equal(formatEditableAmount("50000.50"), "50,000.50");
  assert.equal(formatEditableAmount("100000000.50"), "100,000,000.50");
});

test("preserves incomplete decimal typing states", () => {
  assert.equal(parseEditableAmount("12.", "₦", true).value, "12.");
  assert.equal(parseEditableAmount("0.", "₦", true).value, "0.");
});

test("rejects invalid precision, characters, grouping, multiple decimals, and negatives", () => {
  for (const input of ["500.123", "10.20.30", "abc", "50a", "-5000", "1,00", " 500"]) {
    assert.ok(parseEditableAmount(input, "₦").error, input);
  }
});

test("requires a positive finite transaction amount", () => {
  for (const input of ["", "0", "0.00", "-5000", "Infinity", "500.123"])
    assert.ok(validateEditableAmount(input), input || "empty");
  for (const input of ["5", "50.5", "50.50", "1250.75"])
    assert.equal(validateEditableAmount(input), null, input);
});

test("keeps the caret after end insertion and in the edited middle position", () => {
  const append = editedTextRange("100", "1000");
  const appendValue = parseEditableAmount("1000", "₦", true).value;
  assert.equal(amountCursorForEdit("1000", "₦", append.prefix + append.inserted.length, appendValue), 5);

  const middle = editedTextRange("1,000", "1,2000");
  const middleValue = parseEditableAmount("1,2000", "₦", true).value;
  assert.equal(middleValue, "12000");
  assert.equal(amountCursorForEdit("1,2000", "₦", middle.prefix + middle.inserted.length, middleValue), 2);
});
