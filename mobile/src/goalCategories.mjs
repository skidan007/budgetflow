export const GOAL_CATEGORIES = [
  { name: "Emergency Fund", goalName: "Emergency Fund", icon: "emergencyFund" },
  { name: "Savings", goalName: "Personal Savings", icon: "savings" },
  { name: "Education", goalName: "Education Fund", icon: "education" },
  { name: "Business", goalName: "Business Fund", icon: "business" },
  { name: "Travel", goalName: "Travel Fund", icon: "travel" },
  { name: "Home", goalName: "Home Fund", icon: "home" },
  { name: "Car", goalName: "Car Fund", icon: "transport" },
  { name: "Technology", goalName: "Technology Fund", icon: "laptop" },
  { name: "Health", goalName: "Health Fund", icon: "health" },
  { name: "Other", goalName: "Other Goal", icon: "sparkles" },
];

const categoryAliases = new Map([
  ["emergencyfund", "Emergency Fund"],
  ["emergency", "Emergency Fund"],
  ["savings", "Savings"],
  ["personalsavings", "Savings"],
  ["savingsgoal", "Savings"],
  ["education", "Education"],
  ["educationfund", "Education"],
  ["business", "Business"],
  ["businessfund", "Business"],
  ["travel", "Travel"],
  ["travelgoal", "Travel"],
  ["home", "Home"],
  ["house", "Home"],
  ["homefund", "Home"],
  ["car", "Car"],
  ["vehicle", "Car"],
  ["technology", "Technology"],
  ["tech", "Technology"],
  ["health", "Health"],
  ["healthfund", "Health"],
  ["other", "Other"],
  ["goal", "Other"],
  ["new", "Other"],
]);

function categoryKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function matchCategory(value) {
  const key = categoryKey(value);
  if (!key) return null;
  const exact = categoryAliases.get(key);
  if (exact) return exact;
  // Handle older values such as "ðŸŽ“ Education" or "My Travel Goal".
  const aliases = [...categoryAliases.entries()].sort(([a], [b]) => b.length - a.length);
  return aliases.find(([alias]) => alias.length > 3 && key.includes(alias))?.[1] || null;
}

export function goalCategoryVisual(value) {
  const matched = matchCategory(value);
  return GOAL_CATEGORIES.find((category) => category.name === matched)
    || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
}

export function normalizeGoal(goal) {
  const matched = [goal?.category, goal?.type, goal?.name, goal?.title]
    .map(matchCategory)
    .find(Boolean);
  const category = GOAL_CATEGORIES.find((item) => item.name === matched)
    || GOAL_CATEGORIES[GOAL_CATEGORIES.length - 1];
  const suppliedName = String(goal?.name ?? goal?.title ?? "").trim();
  return {
    ...goal,
    name: suppliedName || category.goalName,
    category: category.name,
    type: category.name,
    icon: category.icon,
  };
}
