import test from "node:test";
import assert from "node:assert/strict";
import { GOAL_CATEGORIES, goalCategoryVisual, normalizeGoal } from "./goalCategories.mjs";

test("goal categories cover the mobile and web category set with registered icon names", () => {
  assert.deepEqual(GOAL_CATEGORIES.map(({ name }) => name), ["Emergency Fund", "Savings", "Education", "Business", "Travel", "Home", "Car", "Technology", "Health", "Other"]);
  assert.ok(GOAL_CATEGORIES.every(({ icon }) => typeof icon === "string" && icon.length > 0));
  assert.equal(goalCategoryVisual("Savings Goal").icon, "savings");
  assert.equal(goalCategoryVisual("Emergency Fund").icon, "emergencyFund");
  assert.equal(goalCategoryVisual("Car").icon, "transport");
  assert.equal(goalCategoryVisual("Technology").goalName, "Technology Fund");
  assert.equal(goalCategoryVisual("ðŸŽ“ Education").name, "Education");
  assert.equal(goalCategoryVisual("Unknown category").name, "Other");
});

test("goal normalization keeps user names and resolves category aliases", () => {
  assert.deepEqual(
    ["Savings", "Education", "Business", "Travel", "Home", "Car", "Technology", "Health"].map(
      (category) => normalizeGoal({ name: `${category} custom`, type: category }).category,
    ),
    ["Savings", "Education", "Business", "Travel", "Home", "Car", "Technology", "Health"],
  );
  assert.deepEqual(
    normalizeGoal({ name: "Japan Trip", type: "âœˆï¸ Travel" }),
    { name: "Japan Trip", type: "Travel", category: "Travel", icon: "travel" },
  );
  assert.equal(normalizeGoal({ name: "New", type: "ðŸŽ¯ Goal" }).name, "New");
});
